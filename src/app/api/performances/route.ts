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
