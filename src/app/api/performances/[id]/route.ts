import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Dynamic route for individual performance operations
type RouteContext = { params: Promise<{ id: string }> }

// GET: Get single performance
export async function GET(
    request: Request,
    { params }: RouteContext
) {
    try {
        const { id } = await params
        
        const performance = await prisma.performance.findUnique({
            where: { id },
            include: {
                performanceSongs: {
                    orderBy: { order: 'asc' },
                    include: { song: true }
                }
            }
        })

        if (!performance) {
            return NextResponse.json({ error: 'Performance not found' }, { status: 404 })
        }

        return NextResponse.json(performance)
    } catch (error) {
        console.error('Error fetching performance:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// PATCH: Update performance
export async function PATCH(
    request: Request,
    { params }: RouteContext
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { action } = body

        switch (action) {
            case 'update_status': {
                const { status } = body
                await prisma.performance.update({
                    where: { id },
                    data: { status }
                })
                revalidatePath('/singer/dashboard')
                revalidatePath(`/live/${id}`)
                return NextResponse.json({ success: true })
            }

            case 'toggle_chat': {
                const { enabled } = body
                await prisma.performance.update({
                    where: { id },
                    data: { chatEnabled: enabled }
                })
                revalidatePath(`/live/${id}`)
                revalidatePath('/singer/live')
                return NextResponse.json({ success: true })
            }

            case 'update': {
                const { title, locationText, lat, lng, startTime, endTime, chatEnabled } = body
                
                const updateData: any = {}
                if (title) updateData.title = title
                if (locationText) updateData.locationText = locationText
                if (lat) updateData.locationLat = lat
                if (lng) updateData.locationLng = lng
                if (startTime) updateData.startTime = new Date(startTime)
                if (endTime) updateData.endTime = new Date(endTime)
                if (chatEnabled !== undefined) updateData.chatEnabled = chatEnabled

                await prisma.performance.update({
                    where: { id },
                    data: updateData
                })
                revalidatePath('/singer/dashboard')
                revalidatePath(`/live/${id}`)
                return NextResponse.json({ success: true })
            }

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }
    } catch (error) {
        console.error('Error updating performance:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// DELETE: Delete performance
export async function DELETE(
    request: Request,
    { params }: RouteContext
) {
    try {
        const { id } = await params
        
        await prisma.performance.delete({ where: { id } })
        revalidatePath('/singer/dashboard')
        
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting performance:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
