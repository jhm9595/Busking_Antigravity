'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// --- Profile & Singer Sync ---
export async function syncUserProfile(user: { id: string, email?: string, fullName?: string | null, imageUrl?: string }) {
    try {
        // 1. Upsert Profile (Default role is 'audience', it shouldn't overwrite if they are already 'singer')
        await prisma.profile.upsert({
            where: { id: user.id },
            update: {
                email: user.email,
                avatarUrl: user.imageUrl,
            },
            create: {
                id: user.id,
                email: user.email,
                role: 'audience',
                nickname: user.fullName || `user_${user.id.slice(-4)}`,
                avatarUrl: user.imageUrl,
            },
        })
        return { success: true }
    } catch (error) {
        console.error('Sync Error:', error)
        return { success: false, error }
    }
}

export async function checkNicknameUnique(nickname: string, excludeUserId?: string) {
    const existing = await prisma.profile.findFirst({
        where: {
            nickname: { equals: nickname, mode: 'insensitive' },
            NOT: excludeUserId ? { id: excludeUserId } : undefined
        }
    })
    return !existing
}

export async function registerSinger(user: { id: string, stageName: string }) {
    try {
        const isUnique = await checkNicknameUnique(user.stageName, user.id)
        if (!isUnique) {
            return { success: false, error: 'NICKNAME_DUPLICATE' }
        }

        await prisma.$transaction(async (tx) => {
            // Update Profile to role: 'singer'
            await tx.profile.update({
                where: { id: user.id },
                data: {
                    role: 'singer',
                    nickname: user.stageName
                }
            })

            // Create Singer profile
            await tx.singer.upsert({
                where: { id: user.id },
                update: {
                    stageName: user.stageName,
                },
                create: {
                    id: user.id,
                    stageName: user.stageName,
                    isVerified: false,
                    fanCount: 0,
                },
            })
        })
        revalidatePath('/singer/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Register Singer Error:', error)
        return { success: false, error }
    }
}


// --- Songs ---
export async function getSongs(singerId: string) {
    return await prisma.song.findMany({
        where: { singerId, isRepertoire: true },
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
        const end = new Date(p.endTime!)

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
        songs: (p.performanceSongs as any[]).map(ps => ({
            ...ps.song,
            status: ps.status,
            order: ps.order
        }))
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

    // Auto-update status check
    const now = new Date()
    const start = new Date(performance.startTime)
    // Fallback: 1 hour if not specified
    const end = performance.endTime
        ? new Date(performance.endTime)
        : new Date(start.getTime() + 1 * 60 * 60 * 1000)

    let currentStatus = performance.status

    if (end < now && (currentStatus === 'live' || currentStatus === 'scheduled')) {
        try {
            await prisma.performance.update({
                where: { id },
                data: { status: 'completed' }
            })
            currentStatus = 'completed'
        } catch (e) {
            console.error('Auto-close error in getPerformanceById:', e)
        }
    }


    return JSON.parse(JSON.stringify({
        ...performance,
        status: currentStatus,
        songs: (performance.performanceSongs as any[]).map(ps => ({
            ...ps.song,
            status: ps.status,
            order: ps.order
        }))
    }));
}

export async function updateSongStatus(performanceId: string, songId: string, status: 'pending' | 'completed') {
    try {
        await prisma.performanceSong.updateMany({
            where: {
                performanceId,
                songId
            },
            data: { status } as any
        })
        revalidatePath(`/live/${performanceId}`)
        revalidatePath(`/singer/live`)
        return { success: true }
    } catch (error) {
        console.error('Update song status failed:', error)
        return { success: false, error }
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

        // Overlap check
        const newStart = new Date(data.startTime)
        const newEnd = new Date(data.endTime)

        // Fetch existing active performances for this singer
        const existingPerformances = await prisma.performance.findMany({
            where: {
                singerId: data.singerId,
                status: { in: ['scheduled', 'live'] }
            }
        })

        const overlapping = existingPerformances.find(p => {
            const start = new Date(p.startTime)
            const end = new Date(p.endTime!)

            // Check for any overlap: (StartA < EndB) && (EndA > StartB)
            return (newStart < end) && (newEnd > start)
        })

        if (overlapping) {
            return { success: false, error: 'DUPLICATE_SCHEDULE' }
        }


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
            chatCapacity: data.expectedAudience || 50,
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
    } catch (error: any) {
        console.error('Failed to add performance:', error)
        return { success: false, error: error.message || 'UNKNOWN_ERROR' }
    }
}

export async function togglePerformanceChat(performanceId: string, enabled: boolean) {
    try {
        await prisma.performance.update({
            where: { id: performanceId },
            data: { chatEnabled: enabled }
        })
        revalidatePath(`/live/${performanceId}`)
        revalidatePath('/singer/live')
        return { success: true }
    } catch (error) {
        console.error('Failed to toggle chat:', error)
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

        if (data.lat !== undefined) {
            updateData.locationLat = data.lat
        }
        delete updateData.lat

        if (data.lng !== undefined) {
            updateData.locationLng = data.lng
        }
        delete updateData.lng

        await prisma.performance.updateMany({
            where: { id: data.id, singerId: data.singerId },
            data: updateData
        })
        revalidatePath('/singer/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Failed to update performance:', error)
        return { success: false, error: String(error) }
    }
}

export async function updatePerformanceSetlist(data: {
    performanceId: string,
    singerId: string,
    songIds: string[]
}) {
    try {
        await prisma.$transaction(async (tx) => {
            // 1. Get current statuses to preserve them
            const existingMapping = await tx.performanceSong.findMany({
                where: { performanceId: data.performanceId },
                select: { songId: true, status: true }
            })
            
            const statusMap: Record<string, string> = {}
            existingMapping.forEach(m => {
                statusMap[m.songId] = m.status
            })

            // 2. Clear existing songs
            await tx.performanceSong.deleteMany({
                where: { performanceId: data.performanceId }
            })

            // 3. Add new songs with order AND preserved status
            if (data.songIds.length > 0) {
                await tx.performanceSong.createMany({
                    data: data.songIds.map((songId, index) => ({
                        performanceId: data.performanceId,
                        songId: songId,
                        order: index,
                        status: (statusMap[songId] || 'pending') as any
                    }))
                })
            }
        })
        revalidatePath('/singer/dashboard')
        revalidatePath(`/live/${data.performanceId}`)
        revalidatePath('/singer/live')
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

// --- Point System ---
export async function getUserPoints(userId: string) {
    const profile = await prisma.profile.findUnique({
        where: { id: userId },
        select: { points: true }
    })
    return profile?.points || 0
}

export async function chargePoints(userId: string, amount: number) {
    try {
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
        return { success: true, points: profile.points }
    } catch (error) {
        return { success: false, error }
    }
}

export async function sponsorSinger(fanId: string, singerId: string, amount: number) {
    try {
        return await prisma.$transaction(async (tx) => {
            // 1. Deduct from fan
            const fan = await tx.profile.findUnique({ where: { id: fanId } })
            if (!fan || fan.points < amount) throw new Error('INSUFFICIENT_POINTS')

            await tx.profile.update({
                where: { id: fanId },
                data: { points: { decrement: amount } }
            })

            // 2. Add to singer (singer's profile)
            await tx.profile.update({
                where: { id: singerId },
                data: { points: { increment: amount } }
            })

            // 3. Record transactions
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
                    amount: amount,
                    type: 'REWARD',
                    description: `Received sponsorship from fan ${fanId}`
                }
            })

            return { success: true }
        })
    } catch (error: any) {
        console.error('Sponsorship failed:', error)
        return { success: false, error: error.message }
    }
}

export async function usePointsForChat(singerId: string, performanceId: string) {
    const CHAT_OPEN_COST = 100 // Example cost
    try {
        return await prisma.$transaction(async (tx) => {
            const profile = await tx.profile.findUnique({ where: { id: singerId } })
            if (!profile || profile.points < CHAT_OPEN_COST) throw new Error('INSUFFICIENT_POINTS')

            await tx.profile.update({
                where: { id: singerId },
                data: { points: { decrement: CHAT_OPEN_COST } }
            })

            await tx.pointTransaction.create({
                data: {
                    profileId: singerId,
                    amount: -CHAT_OPEN_COST,
                    type: 'CHAT_OPEN',
                    description: `Opened chat for performance ${performanceId}`
                }
            })

            await tx.performance.update({
                where: { id: performanceId },
                data: { chatEnabled: true }
            })

            return { success: true }
        })
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function getSinger(id: string) {
    const singer = await prisma.singer.findUnique({
        where: { id },
        include: { profile: true }
    })
    return singer ? JSON.parse(JSON.stringify(singer)) : null
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

export async function updateNickname(userId: string, newNickname: string) {
    try {
        const isUnique = await checkNicknameUnique(newNickname, userId)
        if (!isUnique) return { success: false, error: 'NICKNAME_DUPLICATE' }

        await prisma.profile.update({
            where: { id: userId },
            data: { nickname: newNickname }
        })
        revalidatePath('/singer/dashboard')
        return { success: true }
    } catch (error) {
        return { success: false, error }
    }
}

export async function withdrawUser(userId: string) {
    try {
        await prisma.$transaction(async (tx) => {
            // Delete follows
            await tx.follow.deleteMany({ where: { OR: [{ singerId: userId }, { fanId: userId }] } })
            // Delete singer profile
            await tx.singer.deleteMany({ where: { id: userId } })
            // Finally delete profile
            await tx.profile.delete({ where: { id: userId } })
        })
        return { success: true }
    } catch (error) {
        console.error('Withdrawal failed:', error)
        return { success: false, error }
    }
}

export async function updatePerformanceStatus(id: string, status: 'scheduled' | 'live' | 'completed' | 'canceled') {
    try {
        const data: any = { status }
        await prisma.performance.update({
            where: { id },
            data: data
        })
        revalidatePath('/singer/dashboard')
        revalidatePath(`/singer/live`)
        revalidatePath(`/live/${id}`)
        return { success: true }
    } catch (error) {
        console.error('Failed to update status:', error)
        return { success: false, error: String(error) }
    }
}


// --- Requests ---
export async function getPerformanceRequests(performanceId: string) {
    return await prisma.songRequest.findMany({
        where: { performanceId },
        orderBy: { createdAt: 'desc' }
    })
}

export async function createSongRequest(data: { performanceId: string, title: string, artist: string, requesterName?: string }) {
    try {
        await prisma.songRequest.create({
            data: {
                performanceId: data.performanceId,
                title: data.title,
                artist: data.artist,
                requesterName: data.requesterName || 'Anonymous'
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

            // Guard: Already accepted — prevent double-click duplicates
            if (req.status === 'accepted') {
                throw new Error('Request already accepted')
            }

            // Guard: Check if the same song (title + artist) already exists in this performance's setlist
            const existingInSetlist = await tx.performanceSong.findFirst({
                where: {
                    performanceId: req.performanceId,
                    song: {
                        title: req.title,
                        artist: req.artist
                    }
                }
            })
            if (existingInSetlist) {
                // Song already in setlist — just mark the request as accepted without adding again
                await tx.songRequest.update({
                    where: { id: requestId },
                    data: { status: 'accepted' }
                })
                return
            }

            // Create Song (Ad-hoc so it doesn't pollute global repertoire)
            const song = await tx.song.create({
                data: {
                    singerId,
                    title: req.title,
                    artist: req.artist,
                    isRepertoire: false,
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
    } catch (error: any) {
        if (error?.message === 'Request already accepted') {
            return { success: true, alreadyAccepted: true }
        }
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
                await tx.performanceSong.updateMany({
                    where: {
                        performanceId,
                        songId: songIds[i]
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
