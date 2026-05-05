import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolvePerformanceStatus } from '@/lib/performance-lifecycle'

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
                songs: {
                    where: { isRepertoire: true }
                },
            }
        })

        if (!singer) {
            return NextResponse.json(
                { error: 'Singer not found' },
                { status: 404 }
            )
        }

        // Compute performance status in-memory using shared resolver (GET = read-only)
        const resolvedPerformances = singer.performances.map(p => {
            const start = new Date(p.startTime)
            const end = p.endTime ? new Date(p.endTime) : null
            const { status } = resolvePerformanceStatus(start, end, p.status)
            return status !== p.status ? { ...p, status } : p
        })

        // Sort by startTime ASC (Earliest first)
        resolvedPerformances.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

        return NextResponse.json({
            ...singer,
            performances: resolvedPerformances
        })
    } catch (error) {
        console.error('Error fetching singer:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
