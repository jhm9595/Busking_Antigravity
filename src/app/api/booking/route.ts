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
        const { singerId, contactInfo, eventType, eventDate, location, budget, message } = body

        if (!singerId || !contactInfo || !eventType) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        const requesterProfile = await prisma.profile.findUnique({
            where: { id: access.actorUserId },
            select: { nickname: true, email: true }
        })

        const booking = await prisma.bookingRequest.create({
            data: {
                singerId,
                requesterName: requesterProfile?.nickname || requesterProfile?.email || 'Audience',
                contactInfo,
                eventType,
                eventDate: eventDate ? new Date(eventDate) : null,
                location,
                budget,
                message,
                status: 'pending'
            }
        })

        return NextResponse.json(booking)
    } catch (error) {
        console.error('Error creating booking request:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
