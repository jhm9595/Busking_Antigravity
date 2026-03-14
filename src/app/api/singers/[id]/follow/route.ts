import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const fanId = searchParams.get('fanId')

    try {
        const singer = await prisma.singer.findUnique({
            where: { id },
            select: { fanCount: true }
        })

        if (!singer) {
            return NextResponse.json({ error: 'Singer not found' }, { status: 404 })
        }

        let isFollowed = false
        if (fanId) {
            const follow = await prisma.follow.findUnique({
                where: {
                    singerId_fanId: {
                        singerId: id,
                        fanId
                    }
                }
            })
            isFollowed = !!follow
        }

        return NextResponse.json({
            fanCount: singer.fanCount,
            isFollowed
        })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch follow status' }, { status: 500 })
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    try {
        const body = await request.json()
        const { fanId } = body

        if (!fanId) {
            return NextResponse.json({ error: 'Fan ID required' }, { status: 400 })
        }

        // Check if already following
        const existingFollow = await prisma.follow.findUnique({
            where: {
                singerId_fanId: {
                    singerId: id,
                    fanId
                }
            }
        })

        let isFollowed = false
        if (existingFollow) {
            // Unfollow
            await prisma.$transaction([
                prisma.follow.delete({
                    where: {
                        singerId_fanId: {
                            singerId: id,
                            fanId
                        }
                    }
                }),
                prisma.singer.update({
                    where: { id },
                    data: { fanCount: { decrement: 1 } }
                })
            ])
            isFollowed = false
        } else {
            // Follow
            await prisma.$transaction([
                prisma.follow.create({
                    data: {
                        singerId: id,
                        fanId
                    }
                }),
                prisma.singer.update({
                    where: { id },
                    data: { fanCount: { increment: 1 } }
                })
            ])
            isFollowed = true
        }

        // Return new count
        const updatedSinger = await prisma.singer.findUnique({
            where: { id },
            select: { fanCount: true }
        })

        return NextResponse.json({
            success: true,
            isFollowed,
            fanCount: updatedSinger?.fanCount || 0
        })

    } catch (error) {
        console.error('Follow error:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
