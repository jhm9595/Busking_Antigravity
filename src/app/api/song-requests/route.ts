import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { performanceId, title, artist } = body

        if (!performanceId || !title) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Check that performance exists and is live
        const performance = await prisma.performance.findUnique({
            where: { id: performanceId },
            select: { id: true, status: true }
        })

        if (!performance) {
            return NextResponse.json({ error: 'Performance not found' }, { status: 404 })
        }

        const songRequest = await prisma.songRequest.create({
            data: {
                performanceId,
                title: title.trim(),
                artist: (artist || '').trim() || 'Unknown',
            }
        })

        return NextResponse.json({ success: true, id: songRequest.id })
    } catch (error) {
        console.error('Song request failed:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
