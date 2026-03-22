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

        // Auto-update performance status: Close stale live/scheduled sessions
        // PERFORMANCE FIX: Use batch updates instead of N+1 queries
        const now = new Date()
        const toComplete: string[] = []
        const toLive: string[] = []

        singer.performances.forEach((p) => {
            const start = new Date(p.startTime)
            // Use endTime if present, otherwise assume 3 hours max duration from start
            const end = p.endTime ? new Date(p.endTime) : new Date(start.getTime() + 3 * 60 * 60 * 1000)

            if (end < now && (p.status === 'live' || p.status === 'scheduled')) {
                toComplete.push(p.id)
            } else if (start <= now && p.status === 'scheduled') {
                toLive.push(p.id)
            }
        })

        // Batch update all at once
        await prisma.$transaction([
            ...toComplete.map(id =>
                prisma.performance.update({
                    where: { id },
                    data: { status: 'completed' }
                })
            ),
            ...toLive.map(id =>
                prisma.performance.update({
                    where: { id },
                    data: { status: 'live' }
                })
            )
        ])

        // Map updated statuses
        const statusMap = new Map<string, string>()
        toComplete.forEach(id => statusMap.set(id, 'completed'))
        toLive.forEach(id => statusMap.set(id, 'live'))

        const updatedPerformances = singer.performances.map(p => {
            const newStatus = statusMap.get(p.id)
            return newStatus ? { ...p, status: newStatus } : p
        })

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
