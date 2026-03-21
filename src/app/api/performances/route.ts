import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPerformanceSortKey, resolvePerformanceStatus } from '@/lib/performance-lifecycle'
import { toKSTISOString } from '@/lib/kst-time'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const fanId = searchParams.get('fanId')
        const query = searchParams.get('query')
        const filter = searchParams.get('filter') // 'all', 'live', 'followed'

        // Fetch followed singers if fanId is present
        let followedSingerIds: string[] = []
        if (fanId) {
            const follows = await prisma.follow.findMany({
                where: { fanId },
                select: { singerId: true }
            })
            followedSingerIds = follows.map(f => f.singerId)
        }

        const whereClause: any = {
            status: {
                in: ['live', 'scheduled']
            }
        }

        if (query) {
            whereClause.OR = [
                { title: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { singer: { stageName: { contains: query, mode: 'insensitive' } } }
            ]
        }

        if (filter === 'live') {
            whereClause.status = 'live'
        } else if (filter === 'followed' && fanId) {
            whereClause.singerId = { in: followedSingerIds }
        }

        const performances = await prisma.performance.findMany({
            where: whereClause,
            include: {
                singer: {
                    select: {
                        stageName: true,
                        profile: true
                    }
                }
            },
            orderBy: {
                startTime: 'asc'
            }
        })

        const resolvedPerformances = performances.map((p: any) => {
            const start = new Date(p.startTime)
            const end = p.endTime ? new Date(p.endTime) : null
            const { status } = resolvePerformanceStatus(start, end, p.status)

            // Add isFollowed flag
            return {
                ...p,
                status,
                isFollowed: followedSingerIds.includes(p.singerId)
            }
        })

        // Filter and Sort
        const validPerformances = resolvedPerformances
            .filter(p => p.status !== 'completed')
            .sort((a, b) => getPerformanceSortKey({
                isFollowed: a.isFollowed,
                status: a.status,
                startTime: new Date(a.startTime)
            }) - getPerformanceSortKey({
                isFollowed: b.isFollowed,
                status: b.status,
                startTime: new Date(b.startTime)
            }))

        return NextResponse.json(validPerformances.map((performance) => ({
            ...performance,
            startTime: toKSTISOString(new Date(performance.startTime)),
            endTime: performance.endTime ? toKSTISOString(new Date(performance.endTime)) : null
        })))
    } catch (error) {
        console.error('Error fetching performances:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}

// POST: Add new performance
export async function POST(request: Request) {
    try {
        const data = await request.json()
        
        const { singerId, title, locationText, lat, lng, startTime, endTime, chatEnabled, streamingEnabled, songIds } = data

        if (!title || !String(title).trim()) {
            return NextResponse.json({ success: false, error: 'TITLE_REQUIRED' }, { status: 400 })
        }

        if (!locationText || !String(locationText).trim()) {
            return NextResponse.json({ success: false, error: 'LOCATION_REQUIRED' }, { status: 400 })
        }

        if (!startTime || !endTime) {
            return NextResponse.json({ success: false, error: 'TIME_REQUIRED' }, { status: 400 })
        }

        if (!Array.isArray(songIds) || songIds.length === 0) {
            return NextResponse.json({ success: false, error: 'SONGS_REQUIRED' }, { status: 400 })
        }

        const newStart = new Date(startTime)
        const newEnd = new Date(endTime)

        const durationMs = newEnd.getTime() - newStart.getTime()
        const durationHours = durationMs / (1000 * 60 * 60)
        
        if (durationHours < 1) {
            return NextResponse.json({ success: false, error: 'MIN_DURATION_NOT_MET' }, { status: 400 })
        }

        const billableHours = Math.ceil(durationHours)
        const totalCost = billableHours * 1000

        const result = await prisma.$transaction(async (tx) => {
            const profile = await tx.profile.findUnique({ where: { id: singerId } })
            if (!profile || profile.points < totalCost) {
                throw new Error('INSUFFICIENT_POINTS')
            }

            const existingPerformances = await tx.performance.findMany({
                where: {
                    singerId,
                    status: { in: ['scheduled', 'live'] }
                }
            })

            const overlapping = existingPerformances.find(p => {
                const start = new Date(p.startTime)
                const end = new Date(p.endTime!)
                return (newStart < end) && (newEnd > start)
            })

            if (overlapping) throw new Error('DUPLICATE_SCHEDULE')

            await tx.profile.update({
                where: { id: singerId },
                data: { points: { decrement: totalCost } }
            })

            await tx.pointTransaction.create({
                data: {
                    profileId: singerId,
                    amount: -totalCost,
                    type: 'PERFORMANCE_REGISTER',
                    description: `Registration Fee: ${title} (${durationHours.toFixed(1)}h)`
                }
            })

            const performance = await tx.performance.create({
                data: {
                    singerId,
                    title,
                    locationText,
                    locationLat: lat || 37.5665,
                    locationLng: lng || 126.9780,
                    startTime: newStart,
                    endTime: newEnd,
                    chatEnabled: chatEnabled || false,
                    streamingEnabled: streamingEnabled || false,
                    chatCostPerHour: 0,
                    expectedAudience: 0,
                    chatCapacity: 50,
                    status: 'scheduled',
                    performanceSongs: {
                        create: songIds?.map((id: string, index: number) => ({
                            songId: id,
                            order: index
                        })) || []
                    }
                }
            })

            return { success: true, id: performance.id }
        })

        return NextResponse.json(result)
    } catch (error: any) {
        console.error('Failed to add performance:', error)
        
        if (error.message === 'INSUFFICIENT_POINTS') {
            return NextResponse.json({ success: false, error: 'INSUFFICIENT_POINTS' }, { status: 400 })
        }
        if (error.message === 'DUPLICATE_SCHEDULE') {
            return NextResponse.json({ success: false, error: 'DUPLICATE_SCHEDULE' }, { status: 400 })
        }
        
        return NextResponse.json({ success: false, error: error.message || 'UNKNOWN_ERROR' }, { status: 500 })
    }
}
