import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Helper to check nickname uniqueness
async function checkNicknameUnique(nickname: string, excludeUserId?: string) {
    const existing = await prisma.profile.findFirst({
        where: {
            nickname: { equals: nickname, mode: 'insensitive' },
            NOT: excludeUserId ? { id: excludeUserId } : undefined
        }
    })
    return !existing
}

// GET: Get singer by ID
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const singerId = searchParams.get('singerId')

        if (!singerId) {
            return NextResponse.json({ error: 'Missing singerId' }, { status: 400 })
        }

        const singer = await prisma.singer.findUnique({
            where: { id: singerId },
            include: {
                profile: true,
                performances: {
                    where: { status: { not: 'canceled' } },
                    orderBy: { startTime: 'desc' }
                }
            }
        })

        if (!singer) {
            return NextResponse.json({ error: 'Singer not found' }, { status: 404 })
        }

        return NextResponse.json(singer)
    } catch (error) {
        console.error('Error fetching singer:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// POST: Singer operations (register, update profile, etc.)
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { action } = body

        switch (action) {
            case 'register': {
                const { userId, stageName } = body
                
                const isUnique = await checkNicknameUnique(stageName, userId)
                if (!isUnique) {
                    return NextResponse.json({ success: false, error: 'NICKNAME_DUPLICATE' }, { status: 400 })
                }

                await prisma.$transaction(async (tx) => {
                    await tx.profile.update({
                        where: { id: userId },
                        data: {
                            role: 'singer',
                            nickname: stageName
                        }
                    })

                    await tx.singer.upsert({
                        where: { id: userId },
                        update: { stageName },
                        create: {
                            id: userId,
                            stageName,
                            isVerified: false,
                            fanCount: 0,
                        },
                    })
                })
                
                revalidatePath('/singer/dashboard')
                return NextResponse.json({ success: true })
            }

            case 'update_profile': {
                const { singerId, bio, socialLinks } = body
                
                await prisma.singer.update({
                    where: { id: singerId },
                    data: { bio, socialLinks }
                })
                
                revalidatePath('/singer/dashboard')
                revalidatePath(`/singer/${singerId}`)
                return NextResponse.json({ success: true })
            }

            case 'update_nickname': {
                const { userId, nickname } = body
                
                const isUnique = await checkNicknameUnique(nickname, userId)
                if (!isUnique) {
                    return NextResponse.json({ success: false, error: 'NICKNAME_DUPLICATE' }, { status: 400 })
                }

                await prisma.profile.update({
                    where: { id: userId },
                    data: { nickname }
                })
                
                revalidatePath('/singer/dashboard')
                return NextResponse.json({ success: true })
            }

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }
    } catch (error) {
        console.error('Singer API error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
