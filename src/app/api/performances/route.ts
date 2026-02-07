import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const fanId = searchParams.get('fanId')

        const performances = await prisma.performance.findMany({
            where: {
                status: {
                    in: ['live', 'scheduled']
                }
            },
            orderBy: {
                startTime: 'asc'
            }
        })

        // Fetch followed singers if fanId is present
        let followedSingerIds: string[] = []
        if (fanId) {
            const follows = await prisma.follow.findMany({
                where: { fanId },
                select: { singerId: true }
            })
            followedSingerIds = follows.map(f => f.singerId)
        }

        // Auto-update status logic: Check for stale live/scheduled performances
        const now = new Date()
        const requests = performances.map(async (p: any) => {
            const start = new Date(p.startTime)
            let end = p.endTime ? new Date(p.endTime) : null
            if (!end) end = new Date(start.getTime() + 3 * 60 * 60 * 1000)

            if (end < now) {
                // If past end time, mark as completed
                try {
                    await prisma.performance.update({
                        where: { id: p.id },
                        data: { status: 'completed' }
                    })
                } catch (e) {
                    console.error('Auto-close error map:', e)
                }
                return { ...p, status: 'completed', isFollowed: false }
            }
            // Add isFollowed flag
            return {
                ...p,
                isFollowed: followedSingerIds.includes(p.singerId)
            }
        })

        const updatedPerformances = await Promise.all(requests)

        // Filter and Sort
        const validPerformances = updatedPerformances
            .filter(p => p.status !== 'completed')
            .sort((a, b) => {
                // 1. Sort by Followed status (Followed first)
                if (a.isFollowed && !b.isFollowed) return -1
                if (!a.isFollowed && b.isFollowed) return 1

                // 2. Sort by Status (Live first)
                if (a.status === 'live' && b.status !== 'live') return -1
                if (a.status !== 'live' && b.status === 'live') return 1

                // 3. Sort by Time (handled by DB mostly, but good to ensure)
                return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
            })

        return NextResponse.json(validPerformances)
    } catch (error) {
        console.error('Error fetching performances:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
