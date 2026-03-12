import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolvePerformanceLifecycleStatus } from '@/lib/performance-lifecycle'

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

        const updatedPerformances = singer.performances.map((p) => ({
            ...p,
            status: resolvePerformanceLifecycleStatus(p)
        }))

        // Sort by startTime ASC (Earliest first)
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
