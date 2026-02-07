import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const singer = await prisma.singer.findUnique({
            where: { id },
            include: {
                performances: true,
                songs: true,
            }
        })

        if (!singer) {
            return NextResponse.json(
                { error: 'Singer not found' },
                { status: 404 }
            )
        }

        // Auto-update performance status: Close stale live/scheduled sessions
        const now = new Date()
        const updatedPerformances = await Promise.all(singer.performances.map(async (p) => {
            const start = new Date(p.startTime)
            // Use endTime if present, otherwise assume 3 hours max duration from start
            let end = p.endTime ? new Date(p.endTime) : new Date(start.getTime() + 3 * 60 * 60 * 1000)

            // If time has passed, effectively complete it
            if (end < now && (p.status === 'live' || p.status === 'scheduled')) {
                try {
                    await prisma.performance.update({
                        where: { id: p.id },
                        data: { status: 'completed' }
                    })
                } catch (e) {
                    // Ignore update errors (e.g. race conditions), just return updated state
                    console.error('Auto-close error:', e)
                }
                return { ...p, status: 'completed' }
            }
            return p
        }))

        // Sort by startTime ASC (Earliest first - best for Upcoming list)
        updatedPerformances.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

        return NextResponse.json({
            ...singer,
            performances: updatedPerformances
        })
    } catch (error) {
        console.error('Error fetching singer:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
