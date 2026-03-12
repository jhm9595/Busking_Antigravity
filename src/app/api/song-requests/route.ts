import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import securityContract from '@/lib/security-contract'

const { auth } = require('@clerk/nextjs/server') as {
    auth: () => Promise<{ userId: string | null }>
}

const { evaluateTrustBoundary } = securityContract as {
    evaluateTrustBoundary: (options: {
        action: 'read' | 'write'
        authState: { userId?: string | null }
        ownerId?: string | null
        allowAnonymousRead?: boolean
        ownerRequired?: boolean
    }) => { allowed: boolean, statusCode: number, actorUserId: string | null }
}

export async function POST(request: Request) {
    try {
        const authState = await auth()
        const access = evaluateTrustBoundary({
            action: 'write',
            authState,
            ownerRequired: false
        })

        if (!access.allowed || !access.actorUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: access.statusCode })
        }

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

        const requesterProfile = await prisma.profile.findUnique({
            where: { id: access.actorUserId },
            select: { nickname: true }
        })

        const songRequest = await prisma.songRequest.create({
            data: {
                performanceId,
                title: title.trim(),
                artist: (artist || '').trim() || 'Unknown',
                requesterName: requesterProfile?.nickname || 'Anonymous'
            }
        })

        return NextResponse.json({ success: true, id: songRequest.id })
    } catch (error) {
        console.error('Song request failed:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
