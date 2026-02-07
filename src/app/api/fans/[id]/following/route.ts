
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // id is fanId
) {
    try {
        const { id } = await params
        // Fetch singers followed by fanId
        const follows = await prisma.follow.findMany({
            where: { fanId: id },
            select: { singerId: true }
        })

        if (follows.length === 0) {
            return NextResponse.json([])
        }

        const singerIds = follows.map(f => f.singerId)

        // Find singer profiles
        const singers = await prisma.singer.findMany({
            where: { id: { in: singerIds } },
            select: {
                id: true,
                stageName: true,
                profile: {
                    select: {
                        avatarUrl: true
                    }
                }
            }
        })

        return NextResponse.json(singers)

    } catch (error) {
        console.error('Error fetching following:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
