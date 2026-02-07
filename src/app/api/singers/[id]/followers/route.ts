
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        // Fetch follows for this singer
        const follows = await prisma.follow.findMany({
            where: { singerId: id },
            select: { fanId: true, createdAt: true }
        })

        if (follows.length === 0) {
            return NextResponse.json({ followers: [], anonymousCount: 0 })
        }

        const fanIds = follows.map(f => f.fanId)

        // Find profiles for these fans
        const profiles = await prisma.profile.findMany({
            where: { id: { in: fanIds } },
            select: {
                id: true,
                nickname: true,
                avatarUrl: true
            }
        })

        // Map profiles back to follows to include follow date? 
        // Or just return profiles.
        // We also want to know how many are anonymous (not in profile table).

        // Actually, if a user isn't in Profile table, they are likely anonymous device users.
        // But Profile table should contain all users if created via Clerk? No, unauth users don't have Profile.
        // So anonymous count = total follows - found profiles.

        const anonymousCount = follows.length - profiles.length

        return NextResponse.json({
            followers: profiles,
            anonymousCount
        })

    } catch (error) {
        console.error('Error fetching followers:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
