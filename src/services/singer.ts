'use server'

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// --- Profile & Singer Sync ---
export async function syncUserProfile(user: { id: string, email?: string, fullName?: string | null, imageUrl?: string }) {
    try {
        // 1. Upsert Profile
        await prisma.profile.upsert({
            where: { id: user.id },
            update: {
                email: user.email,
                nickname: user.fullName,
                avatarUrl: user.imageUrl,
            },
            create: {
                id: user.id,
                email: user.email,
                role: 'singer',
                nickname: user.fullName,
                avatarUrl: user.imageUrl,
            },
        })

        // 2. Upsert Singer
        await prisma.singer.upsert({
            where: { id: user.id },
            update: {
                stageName: user.fullName || 'Unknown Singer',
            },
            create: {
                id: user.id,
                stageName: user.fullName || 'Unknown Singer',
                isVerified: false,
                fanCount: 0,
            },
        })
        return { success: true }
    } catch (error) {
        console.error('Sync Error:', error)
        return { success: false, error }
    }
}

// --- Songs ---
export async function getSongs(singerId: string) {
    return await prisma.song.findMany({
        where: { singerId },
        orderBy: { createdAt: 'desc' }
    })
}

export async function addSong(data: { singerId: string, title: string, artist: string, youtubeUrl?: string }) {
    await prisma.song.create({
        data: {
            singerId: data.singerId,
            title: data.title,
            artist: data.artist,
            youtubeUrl: data.youtubeUrl,
        }
    })
    revalidatePath('/singer/dashboard')
}

export async function deleteSong(id: string) {
    await prisma.song.delete({ where: { id } })
    revalidatePath('/singer/dashboard')
}

// --- Performances ---
export async function getPerformances(singerId: string) {
    const performances = await prisma.performance.findMany({
        where: { singerId },
        include: {
            performanceSongs: {
                include: { song: true },
                orderBy: { order: 'asc' }
            }
        },
        orderBy: { startTime: 'asc' }
    })

    // Auto-update status for stale sessions
    const now = new Date()
    const updatedPerformances = await Promise.all(performances.map(async (p) => {
        const start = new Date(p.startTime)
        // Use endTime if present, otherwise assume 3 hours max duration
        let end = p.endTime ? new Date(p.endTime) : new Date(start.getTime() + 3 * 60 * 60 * 1000)

        if (end < now && (p.status === 'live' || p.status === 'scheduled')) {
            try {
                await prisma.performance.update({
                    where: { id: p.id },
                    data: { status: 'completed' }
                })
            } catch (e) {
                console.error('Auto-close error:', e)
            }
            return { ...p, status: 'completed' }
        }
        return p
    }))

    // Sort by startTime ASC (Earliest first)
    updatedPerformances.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

    return updatedPerformances.map(p => ({
        ...p,
        songs: p.performanceSongs.map(ps => ps.song)
    }))
}

export async function getPerformanceById(id: string) {
    const performance = await prisma.performance.findUnique({
        where: { id },
        include: {
            performanceSongs: {
                include: { song: true },
                orderBy: { order: 'asc' }
            }
        }
    })

    if (!performance) return null

    return {
        ...performance,
        songs: performance.performanceSongs.map(ps => ps.song)
    }
}


export async function addPerformance(data: {
    singerId: string,
    title: string,
    locationText: string,
    lat?: number,
    lng?: number,
    startTime: string,
    endTime: string,
    chatEnabled: boolean,
    streamingEnabled?: boolean,
    chatCost: number,
    expectedAudience?: number,
    songIds?: string[] // List of selected song IDs
}) {
    try {
        console.log('Adding performance:', data)

        const performanceData = {
            singerId: data.singerId,
            title: data.title,
            locationText: data.locationText,
            locationLat: data.lat || 37.5665,
            locationLng: data.lng || 126.9780,
            startTime: new Date(data.startTime),
            endTime: new Date(data.endTime),
            chatEnabled: data.chatEnabled,
            streamingEnabled: data.streamingEnabled || false,
            chatCostPerHour: Number(data.chatCost) || 0,
            expectedAudience: data.expectedAudience || 0,
            status: 'scheduled',
            performanceSongs: {
                create: data.songIds?.map((id, index) => ({
                    songId: id,
                    order: index
                })) || []
            }
        }

        await prisma.performance.create({
            data: performanceData
        })
        revalidatePath('/singer/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Failed to add performance:', error)
        return { success: false, error }
    }
}

export async function updatePerformance(data: {
    id: string,
    singerId: string,
    title?: string,
    locationText?: string,
    lat?: number,
    lng?: number,
    startTime?: string,
    endTime?: string,
    chatEnabled?: boolean,
    chatCost?: number
}) {
    try {
        const updateData: any = { ...data }
        delete updateData.id
        delete updateData.singerId
        // Convert strings to Dates
        if (data.startTime) updateData.startTime = new Date(data.startTime)
        if (data.endTime) updateData.endTime = new Date(data.endTime)
        if (data.chatCost !== undefined) updateData.chatCostPerHour = Number(data.chatCost)
        delete updateData.chatCost // mapped to chatCostPerHour

        await prisma.performance.updateMany({
            where: { id: data.id, singerId: data.singerId },
            data: updateData
        })
        revalidatePath('/singer/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Failed to update performance:', error)
        return { success: false, error }
    }
}

export async function updatePerformanceSetlist(data: {
    performanceId: string,
    singerId: string,
    songIds: string[]
}) {
    try {
        await prisma.$transaction(async (tx) => {
            // 1. Clear existing songs
            await tx.performanceSong.deleteMany({
                where: { performanceId: data.performanceId }
            })

            // 2. Add new songs with order
            if (data.songIds.length > 0) {
                await tx.performanceSong.createMany({
                    data: data.songIds.map((songId, index) => ({
                        performanceId: data.performanceId,
                        songId: songId,
                        order: index
                    }))
                })
            }
        })
        revalidatePath('/singer/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Failed to update setlist:', error)
        return { success: false, error }
    }
}

export async function deletePerformance(id: string) {
    try {
        await prisma.performance.delete({ where: { id } })
        revalidatePath('/singer/dashboard')
        return { success: true }
    } catch (error) {
        return { success: false, error }
    }
}

export async function getSinger(id: string) {
    const singer = await prisma.singer.findUnique({
        where: { id },
        include: { profile: true }
    })
    return singer
}

export async function updateSingerProfile(id: string, data: {
    bio?: string
    hairColor?: string
    topColor?: string
    bottomColor?: string
    socialLinks?: {
        instagram?: string
        facebook?: string
        youtube?: string
        tiktok?: string
        soundcloud?: string
        twitter?: string
    }
}) {
    try {
        const updateData: any = {}
        if (data.bio !== undefined) updateData.bio = data.bio
        if (data.hairColor !== undefined) updateData.hairColor = data.hairColor
        if (data.topColor !== undefined) updateData.topColor = data.topColor
        if (data.bottomColor !== undefined) updateData.bottomColor = data.bottomColor
        if (data.socialLinks) updateData.socialLinks = JSON.stringify(data.socialLinks)

        await prisma.singer.update({
            where: { id },
            data: updateData
        })
        revalidatePath('/singer/dashboard')
        revalidatePath(`/singer/${id}`)
        return { success: true }
    } catch (error) {
        console.error('Failed to update profile:', error)
        return { success: false, error }
    }
}

export async function updatePerformanceStatus(id: string, status: 'scheduled' | 'live' | 'completed' | 'canceled') {
    try {
        await prisma.performance.update({
            where: { id },
            data: { status }
        })
        revalidatePath('/singer/dashboard')
        revalidatePath(`/singer/live`)
        return { success: true }
    } catch (error) {
        console.error('Failed to update status:', error)
        return { success: false, error }
    }
}

// --- Requests ---
export async function getPerformanceRequests(performanceId: string) {
    return await prisma.songRequest.findMany({
        where: { performanceId },
        orderBy: { createdAt: 'desc' }
    })
}

export async function createSongRequest(data: { performanceId: string, title: string, artist: string }) {
    try {
        await prisma.songRequest.create({
            data: {
                performanceId: data.performanceId,
                title: data.title,
                artist: data.artist
            }
        })
        revalidatePath(`/singer/live`)
        return { success: true }
    } catch (error) {
        return { success: false, error }
    }
}

export async function acceptSongRequest(requestId: string, singerId: string) {
    try {
        await prisma.$transaction(async (tx) => {
            const req = await tx.songRequest.findUnique({ where: { id: requestId } })
            if (!req) throw new Error('Request not found')

            // Create Song in repertoire
            const song = await tx.song.create({
                data: {
                    singerId,
                    title: req.title,
                    artist: req.artist,
                    tags: '["requested"]'
                }
            })

            // Add to Performance
            const last = await tx.performanceSong.findFirst({
                where: { performanceId: req.performanceId },
                orderBy: { order: 'desc' }
            })
            const newOrder = (last?.order ?? -1) + 1

            await tx.performanceSong.create({
                data: {
                    performanceId: req.performanceId,
                    songId: song.id,
                    order: newOrder
                }
            })

            // Update Request Status
            await tx.songRequest.update({
                where: { id: requestId },
                data: { status: 'accepted' }
            })
        })
        revalidatePath(`/singer/live`)
        return { success: true }
    } catch (error) {
        console.error('Accept request failed:', error)
        return { success: false, error }
    }
}

export async function rejectSongRequest(requestId: string) {
    try {
        await prisma.songRequest.update({
            where: { id: requestId },
            data: { status: 'rejected' }
        })
        revalidatePath(`/singer/live`)
        return { success: true }
    } catch (error) {
        return { success: false, error }
    }
}

export async function updateSetlistOrder(performanceId: string, songIds: string[]) {
    try {
        await prisma.$transaction(async (tx) => {
            for (let i = 0; i < songIds.length; i++) {
                // For composite key update, we just update order where match
                await tx.performanceSong.update({
                    where: {
                        performanceId_songId: {
                            performanceId,
                            songId: songIds[i]
                        }
                    },
                    data: { order: i }
                })
            }
        })
        revalidatePath(`/singer/live`)
        return { success: true }
    } catch (e) {
        console.error(e)
        return { success: false }
    }
}


// --- Booking Requests ---
export async function createBookingRequest(data: {
    singerId: string,
    requesterName: string,
    contactInfo: string,
    eventType: string,
    eventDate?: string,
    location?: string,
    budget?: string,
    message?: string
}) {
    try {
        await prisma.bookingRequest.create({
            data: {
                singerId: data.singerId,
                requesterName: data.requesterName,
                contactInfo: data.contactInfo,
                eventType: data.eventType,
                eventDate: data.eventDate ? new Date(data.eventDate) : null,
                location: data.location,
                budget: data.budget,
                message: data.message
            }
        })
        // No path to revalidate immediately visible to audience, but helpful for singer
        revalidatePath('/singer/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Booking request failed:', error)
        return { success: false, error }
    }
}

export async function getSingerBookingRequests(singerId: string) {
    return await prisma.bookingRequest.findMany({
        where: { singerId },
        orderBy: { createdAt: 'desc' },
        include: {
            singer: { include: { profile: true } }
        }
    })
}
