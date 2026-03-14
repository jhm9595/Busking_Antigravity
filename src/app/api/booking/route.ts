import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { singerId, contactInfo, eventType, eventDate, location, budget, message, requesterName } = body

        if (!singerId || !contactInfo || !eventType || !requesterName) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        const booking = await prisma.bookingRequest.create({
            data: {
                singerId,
                requesterName,
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
