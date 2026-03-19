import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: Request) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { performanceId, title, artist, requesterName } = body

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
                requesterName: (requesterName || '').trim() || 'Anonymous'
            }
        })

        return NextResponse.json({ success: true, id: songRequest.id })
    } catch (error) {
        console.error('Song request failed:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
