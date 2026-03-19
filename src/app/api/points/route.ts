import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// POST: Point operations
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { action } = body

        switch (action) {
            case 'charge': {
                const { userId, amount } = body
                
                const profile = await prisma.profile.update({
                    where: { id: userId },
                    data: { points: { increment: amount } }
                })

                await prisma.pointTransaction.create({
                    data: {
                        profileId: userId,
                        amount,
                        type: 'CHARGE',
                        description: 'Point charged'
                    }
                })

                revalidatePath('/singer/dashboard')
                return NextResponse.json({ success: true, points: profile.points })
            }

            case 'sponsor': {
                const { fanId, singerId, amount } = body
                
                await prisma.$transaction(async (tx) => {
                    const fan = await tx.profile.findUnique({ where: { id: fanId } })
                    if (!fan || fan.points < amount) {
                        throw new Error('INSUFFICIENT_POINTS')
                    }

                    await tx.profile.update({
                        where: { id: fanId },
                        data: { points: { decrement: amount } }
                    })

                    await tx.profile.update({
                        where: { id: singerId },
                        data: { points: { increment: amount } }
                    })

                    await tx.pointTransaction.create({
                        data: {
                            profileId: fanId,
                            amount: -amount,
                            type: 'SPONSORSHIP',
                            targetSingerId: singerId,
                            description: `Sponsored singer ${singerId}`
                        }
                    })

                    await tx.pointTransaction.create({
                        data: {
                            profileId: singerId,
                            amount,
                            type: 'REWARD',
                            description: `Received sponsorship from fan ${fanId}`
                        }
                    })
                })

                return NextResponse.json({ success: true })
            }

            case 'get_points': {
                const { userId } = body
                
                const profile = await prisma.profile.findUnique({
                    where: { id: userId },
                    select: { points: true }
                })
                
                return NextResponse.json({ points: profile?.points || 0 })
            }

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }
    } catch (error: any) {
        console.error('Points API error:', error)
        
        if (error.message === 'INSUFFICIENT_POINTS') {
            return NextResponse.json({ success: false, error: 'INSUFFICIENT_POINTS' }, { status: 400 })
        }
        
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
