import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// POST: Setlist operations
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { action } = body

        switch (action) {
            case 'update_setlist': {
                const { performanceId, songIds } = body
                
                await prisma.$transaction(async (tx) => {
                    // 1. Get current statuses to preserve them
                    const existingMapping = await tx.performanceSong.findMany({
                        where: { performanceId },
                        select: { songId: true, status: true }
                    })
                    
                    const statusMap: Record<string, string> = {}
                    existingMapping.forEach(m => {
                        statusMap[m.songId] = m.status
                    })

                    // 2. Clear existing songs
                    await tx.performanceSong.deleteMany({
                        where: { performanceId }
                    })

                    // 3. Add new songs with order AND preserved status
                    if (songIds?.length > 0) {
                        await tx.performanceSong.createMany({
                            data: songIds.map((songId: string, index: number) => ({
                                performanceId,
                                songId,
                                order: index,
                                status: (statusMap[songId] || 'pending') as any
                            }))
                        })
                    }
                })
                
                revalidatePath('/singer/dashboard')
                revalidatePath(`/live/${performanceId}`)
                revalidatePath('/singer/live')
                return NextResponse.json({ success: true })
            }

            case 'update_song_status': {
                const { performanceId, songId, status } = body
                
                await prisma.performanceSong.updateMany({
                    where: { performanceId, songId },
                    data: { status: status as any }
                })
                
                revalidatePath(`/live/${performanceId}`)
                revalidatePath('/singer/live')
                return NextResponse.json({ success: true })
            }

            case 'update_order': {
                const { performanceId, songIds } = body
                
                await prisma.$transaction(
                    songIds.map((id: string, index: number) =>
                        prisma.performanceSong.updateMany({
                            where: { performanceId, songId: id },
                            data: { order: index }
                        })
                    )
                )
                
                revalidatePath(`/live/${performanceId}`)
                return NextResponse.json({ success: true })
            }

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }
    } catch (error) {
        console.error('Setlist API error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
