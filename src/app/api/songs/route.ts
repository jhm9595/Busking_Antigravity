import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// GET: Get songs for a singer
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const singerId = searchParams.get('singerId')

        if (!singerId) {
            return NextResponse.json({ error: 'Missing singerId' }, { status: 400 })
        }

        const songs = await prisma.song.findMany({
            where: { singerId, isRepertoire: true },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(songs)
    } catch (error) {
        console.error('Error fetching songs:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// POST: Song operations
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { action } = body

        switch (action) {
            case 'add': {
                const { singerId, title, artist, youtubeUrl } = body
                
                await prisma.song.create({
                    data: {
                        singerId,
                        title,
                        artist,
                        youtubeUrl,
                    }
                })
                
                revalidatePath('/singer/dashboard')
                return NextResponse.json({ success: true })
            }

            case 'delete': {
                const { songId } = body
                
                await prisma.song.delete({ where: { id: songId } })
                revalidatePath('/singer/dashboard')
                return NextResponse.json({ success: true })
            }

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }
    } catch (error) {
        console.error('Songs API error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
