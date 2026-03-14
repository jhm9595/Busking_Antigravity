'use server'

import { prisma } from '@/lib/prisma'
import securityContract from '@/lib/security-contract'
import realtimeControlToken from '@/lib/realtime-control-token'
import { revalidatePath } from 'next/cache'

const { auth } = require('@clerk/nextjs/server') as {
    auth: () => Promise<{ userId: string | null }>
}

type AuthDecision = {
    allowed: boolean
    statusCode: number
    actorUserId: string | null
}

const { evaluateTrustBoundary } = securityContract as {
    evaluateTrustBoundary: (options: {
        action: 'read' | 'write'
        authState: { userId?: string | null }
        ownerId?: string | null
        allowAnonymousRead?: boolean
        ownerRequired?: boolean
    }) => AuthDecision
}

const { createRealtimeControlToken } = realtimeControlToken as {
    createRealtimeControlToken: (payload: {
        userId: string
        performanceId: string
        role?: 'owner'
        capacity?: number | null
    }, options?: {
        ttlSeconds?: number
    }) => string | null
}

async function requireAuthenticatedWrite(): Promise<AuthDecision> {
    const authState = await auth()
    return evaluateTrustBoundary({
        action: 'write',
        authState,
        ownerRequired: false
    })
}

async function requireOwnerWrite(ownerId: string | null | undefined): Promise<AuthDecision> {
    const authState = await auth()
    return evaluateTrustBoundary({
        action: 'write',
        authState,
        ownerId: ownerId || null,
        ownerRequired: Boolean(ownerId)
    })
}

function deniedWriteResult(statusCode: number): { success: false, statusCode: number, error: 'UNAUTHORIZED' | 'FORBIDDEN' } {
    return {
        success: false,
        statusCode,
        error: statusCode === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN'
    }
}

// --- Profile & Singer Sync ---
export async function syncUserProfile(user: { id: string, email?: string, fullName?: string | null, imageUrl?: string | null }) {
    try {
        const existing = await prisma.profile.findUnique({ where: { id: user.id } })
        
        if (!existing) {
            // Give 2000 free points to new users on first sync
            await prisma.profile.create({
                data: {
                    id: user.id,
                    email: user.email,
                    role: 'audience',
                    nickname: user.fullName || `user_${user.id.slice(-4)}`,
                    avatarUrl: user.imageUrl,
                    points: 2000
                },
            })
            // Record welcome bonus
            await prisma.pointTransaction.create({
                data: {
                    profileId: user.id,
                    amount: 2000,
                    type: 'REWARD',
                    description: 'Welcome Bonus Points'
                }
            })
        } else {
            // Efficiency: Only update if changed
            const needsUpdate = existing.email !== user.email || existing.avatarUrl !== user.imageUrl
            if (needsUpdate) {
                await prisma.profile.update({
                    where: { id: user.id },
                    data: {
                        email: user.email,
                        avatarUrl: user.imageUrl,
                    }
                })
            }
        }
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

export async function updateNickname(userId: string, newNickname: string) {
    try {
        const access = await requireOwnerWrite(userId)
        if (!access.allowed) {
            return deniedWriteResult(access.statusCode)
        }

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

export async function registerSinger(user: { id: string, stageName: string }) {
    try {
        const isUnique = await checkNicknameUnique(user.stageName, user.id)
        if (!isUnique) {
            return { success: false, error: 'NICKNAME_DUPLICATE' }
        }

        await prisma.$transaction(async (tx: any) => {
            await tx.profile.update({
                where: { id: user.id },
                data: {
                    role: 'singer',
                    nickname: user.stageName
                }
            })

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

export async function updateSingerProfile(singerId: string, data: { bio?: string, socialLinks?: string, hairColor?: string, topColor?: string, bottomColor?: string }) {
    try {
        const access = await requireOwnerWrite(singerId)
        if (!access.allowed) {
            return deniedWriteResult(access.statusCode)
        }

        await prisma.singer.update({
            where: { id: singerId },
            data
        })
        revalidatePath('/singer/dashboard')
        revalidatePath(`/singer/${singerId}`)
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
        const access = await requireOwnerWrite(userId)
        if (!access.allowed) {
            return deniedWriteResult(access.statusCode)
        }

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
        const access = await requireOwnerWrite(fanId)
        if (!access.allowed) {
            return deniedWriteResult(access.statusCode)
        }

        return await prisma.$transaction(async (tx: any) => {
            const fan = await tx.profile.findUnique({ where: { id: fanId } })
            if (!fan || fan.points < amount) throw new Error('INSUFFICIENT_POINTS')

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
        const performance = await prisma.performance.findUnique({
            where: { id: performanceId },
            select: { singerId: true }
        })

        if (!performance) {
            return { success: false, statusCode: 404, error: 'PERFORMANCE_NOT_FOUND' }
        }

        const access = await requireOwnerWrite(performance.singerId)
        if (!access.allowed) {
            return deniedWriteResult(access.statusCode)
        }

        return await prisma.$transaction(async (tx: any) => {
            const profile = await tx.profile.findUnique({ where: { id: performance.singerId } })
            if (!profile || profile.points < CHAT_OPEN_COST) throw new Error('INSUFFICIENT_POINTS')

            await tx.profile.update({
                where: { id: performance.singerId },
                data: { points: { decrement: CHAT_OPEN_COST } }
            })

            await tx.pointTransaction.create({
                data: {
                    profileId: performance.singerId,
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

// --- Singer Data & Performances ---
export async function getSinger(id: string) {
    const singer = await prisma.singer.findUnique({
        where: { id },
        include: { 
            profile: true,
            performances: {
                where: { status: { not: 'canceled' } },
                orderBy: { startTime: 'desc' }
            }
        }
    })
    return singer
}

export async function getPerformances(singerId: string) {
    return await prisma.performance.findMany({
        where: { singerId },
        orderBy: { startTime: 'desc' },
        include: {
            performanceSongs: {
                select: {
                    order: true,
                    status: true,
                    song: {
                        select: {
                            id: true,
                            title: true,
                            artist: true
                        }
                    }
                }
            }
        }
    })
}

export async function getPerformanceById(id: string) {
    const p = await prisma.performance.findUnique({
        where: { id },
        include: {
            performanceSongs: {
                orderBy: { order: 'asc' },
                include: { song: true }
            }
        }
    })
    if (!p) return null
    return {
        ...p,
        songs: (p.performanceSongs as any[]).map(ps => ({
            ...ps.song,
            status: ps.status,
            order: ps.order
        }))
    }
}

export async function updatePerformanceStatus(id: string, status: 'scheduled' | 'live' | 'completed' | 'canceled') {
    const performance = await prisma.performance.findUnique({
        where: { id },
        select: { singerId: true }
    })

    if (!performance) {
        return { success: false, statusCode: 404, error: 'PERFORMANCE_NOT_FOUND' }
    }

    const access = await requireOwnerWrite(performance.singerId)
    if (!access.allowed) {
        return deniedWriteResult(access.statusCode)
    }

    await prisma.performance.update({
        where: { id },
        data: { status }
    })
    revalidatePath('/singer/dashboard')
    revalidatePath(`/live/${id}`)
    return { success: true }
}

export async function createRealtimeOwnerControlToken(performanceId: string) {
    try {
        const performance = await prisma.performance.findUnique({
            where: { id: performanceId },
            select: {
                singerId: true,
                chatCapacity: true
            }
        })

        if (!performance) {
            console.error('[Token] Performance not found:', performanceId)
            return { success: false, statusCode: 404, error: 'PERFORMANCE_NOT_FOUND' }
        }

        const access = await requireOwnerWrite(performance.singerId)
        console.log('[Token] Access check:', access)
        if (!access.allowed || !access.actorUserId) {
            return deniedWriteResult(access.statusCode)
        }

        const token = createRealtimeControlToken({
            userId: access.actorUserId,
            performanceId,
            role: 'owner',
            capacity: performance.chatCapacity
        }, {
            ttlSeconds: 5 * 60
        })

        console.log('[Token] Generated token:', token ? 'present' : 'MISSING')
        if (!token) {
            console.error('[Token] REALTIME_CONTROL_TOKEN_SECRET is missing in environment!')
            return { success: false, statusCode: 500, error: 'REALTIME_TOKEN_SECRET_MISSING' }
        }

        return {
            success: true,
            token,
            capacity: performance.chatCapacity
        }
    } catch (error) {
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
    const access = await requireAuthenticatedWrite()
    if (!access.allowed || !access.actorUserId) {
        return deniedWriteResult(access.statusCode)
    }

    await prisma.song.create({
        data: {
            singerId: access.actorUserId,
            title: data.title,
            artist: data.artist,
            youtubeUrl: data.youtubeUrl,
        }
    })
    revalidatePath('/singer/dashboard')
    return { success: true }
}

export async function deleteSong(songId: string) {
    const song = await prisma.song.findUnique({
        where: { id: songId },
        select: { singerId: true }
    })

    if (!song) {
        return { success: false, statusCode: 404, error: 'SONG_NOT_FOUND' }
    }

    const access = await requireOwnerWrite(song.singerId)
    if (!access.allowed) {
        return deniedWriteResult(access.statusCode)
    }

    await prisma.song.delete({ where: { id: songId } })
    revalidatePath('/singer/dashboard')
    return { success: true }
}

export async function updatePerformanceSetlist(data: {
    performanceId: string,
    singerId: string,
    songIds: string[]
}) {
    try {
        const performance = await prisma.performance.findUnique({
            where: { id: data.performanceId },
            select: { singerId: true }
        })

        if (!performance) {
            return { success: false, statusCode: 404, error: 'PERFORMANCE_NOT_FOUND' }
        }

        const access = await requireOwnerWrite(performance.singerId)
        if (!access.allowed || !access.actorUserId) {
            return deniedWriteResult(access.statusCode)
        }

        if (data.songIds.length > 0) {
            const ownedSongs = await prisma.song.findMany({
                where: {
                    id: { in: data.songIds },
                    singerId: access.actorUserId
                },
                select: { id: true }
            })

            if (ownedSongs.length !== data.songIds.length) {
                return deniedWriteResult(403)
            }
        }

        await prisma.$transaction(async (tx: any) => {
            const existingMapping = await tx.performanceSong.findMany({
                where: { performanceId: data.performanceId },
                select: { songId: true, status: true }
            })

            const statusMap: Record<string, string> = {}
            existingMapping.forEach((m: any) => {
                statusMap[m.songId] = m.status
            })

            await tx.performanceSong.deleteMany({
                where: { performanceId: data.performanceId }
            })

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

export async function updateSongStatus(performanceId: string, songId: string, status: 'pending' | 'completed') {
    try {
        const performance = await prisma.performance.findUnique({
            where: { id: performanceId },
            select: { singerId: true }
        })

        if (!performance) {
            return { success: false, statusCode: 404, error: 'PERFORMANCE_NOT_FOUND' }
        }

        const access = await requireOwnerWrite(performance.singerId)
        if (!access.allowed) {
            return deniedWriteResult(access.statusCode)
        }

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

export async function updateSetlistOrder(performanceId: string, songIds: string[]) {
    const performance = await prisma.performance.findUnique({
        where: { id: performanceId },
        select: { singerId: true }
    })

    if (!performance) {
        return { success: false, statusCode: 404, error: 'PERFORMANCE_NOT_FOUND' }
    }

    const access = await requireOwnerWrite(performance.singerId)
    if (!access.allowed) {
        return deniedWriteResult(access.statusCode)
    }

    await prisma.$transaction(
        songIds.map((id, index) =>
            prisma.performanceSong.updateMany({
                where: { performanceId, songId: id },
                data: { order: index }
            })
        )
    )
    revalidatePath(`/live/${performanceId}`)
    return { success: true }
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
    songIds?: string[]
}) {
    try {
        const access = await requireAuthenticatedWrite()
        if (!access.allowed || !access.actorUserId) {
            return deniedWriteResult(access.statusCode)
        }

        const newStart = new Date(data.startTime)
        const newEnd = new Date(data.endTime)

        const durationMs = newEnd.getTime() - newStart.getTime()
        const durationHours = durationMs / (1000 * 60 * 60)
        
        if (durationHours < 1) {
            return { success: false, error: 'MIN_DURATION_NOT_MET' }
        }

        const billableHours = Math.ceil(durationHours)
        const totalCost = billableHours * 1000

        return await prisma.$transaction(async (tx: any) => {
            const profile = await tx.profile.findUnique({ where: { id: access.actorUserId } })
            if (!profile || profile.points < totalCost) {
                throw new Error('INSUFFICIENT_POINTS')
            }

            const existingPerformances = await tx.performance.findMany({
                where: {
                    singerId: access.actorUserId,
                    status: { in: ['scheduled', 'live'] }
                }
            })

            const overlapping = existingPerformances.find((p: any) => {
                const start = new Date(p.startTime)
                const end = new Date(p.endTime!)
                return (newStart < end) && (newEnd > start)
            })

            if (overlapping) throw new Error('DUPLICATE_SCHEDULE')

            await tx.profile.update({
                where: { id: access.actorUserId },
                data: { points: { decrement: totalCost } }
            })

            await tx.pointTransaction.create({
                data: {
                    profileId: access.actorUserId,
                    amount: -totalCost,
                    type: 'PERFORMANCE_REGISTER',
                    description: `Registration Fee: ${data.title} (${durationHours.toFixed(1)}h)`
                }
            })

            const result = await tx.performance.create({
                data: {
                    singerId: access.actorUserId,
                    title: data.title,
                    locationText: data.locationText,
                    locationLat: data.lat || 37.5665,
                    locationLng: data.lng || 126.9780,
                    startTime: newStart,
                    endTime: newEnd,
                    chatEnabled: data.chatEnabled,
                    streamingEnabled: data.streamingEnabled || false,
                    chatCostPerHour: 0,
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
            })

            return { success: true, id: result.id }
        })
    } catch (error: any) {
        console.error('Failed to add performance:', error)
        return { success: false, error: error.message || 'UNKNOWN_ERROR' }
    }
}

export async function deletePerformance(id: string) {
    const performance = await prisma.performance.findUnique({
        where: { id },
        select: { singerId: true }
    })

    if (!performance) {
        return { success: false, statusCode: 404, error: 'PERFORMANCE_NOT_FOUND' }
    }

    const access = await requireOwnerWrite(performance.singerId)
    if (!access.allowed) {
        return deniedWriteResult(access.statusCode)
    }

    await prisma.performance.delete({ where: { id } })
    revalidatePath('/singer/dashboard')
    return { success: true }
}

export async function togglePerformanceChat(performanceId: string, enabled: boolean) {
    try {
        const performance = await prisma.performance.findUnique({
            where: { id: performanceId },
            select: { singerId: true }
        })

        if (!performance) {
            return { success: false, statusCode: 404, error: 'PERFORMANCE_NOT_FOUND' }
        }

        const access = await requireOwnerWrite(performance.singerId)
        if (!access.allowed) {
            return deniedWriteResult(access.statusCode)
        }

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
    streamingEnabled?: boolean
}) {
    try {
        const performance = await prisma.performance.findUnique({
            where: { id: data.id },
            select: { singerId: true }
        })

        if (!performance) {
            return { success: false, statusCode: 404, error: 'PERFORMANCE_NOT_FOUND' }
        }

        const access = await requireOwnerWrite(performance.singerId)
        if (!access.allowed) {
            return deniedWriteResult(access.statusCode)
        }

        const updateData: any = {}
        if (data.title) updateData.title = data.title
        if (data.locationText) updateData.locationText = data.locationText
        if (data.lat) updateData.locationLat = data.lat
        if (data.lng) updateData.locationLng = data.lng
        if (data.startTime) updateData.startTime = new Date(data.startTime)
        if (data.endTime) updateData.endTime = new Date(data.endTime)
        if (data.chatEnabled !== undefined) updateData.chatEnabled = data.chatEnabled
        if (data.streamingEnabled !== undefined) updateData.streamingEnabled = data.streamingEnabled

        await prisma.performance.update({
            where: { id: data.id },
            data: updateData
        })
        revalidatePath('/singer/dashboard')
        revalidatePath(`/live/${data.id}`)
        return { success: true }
    } catch (error) {
        return { success: false, error }
    }
}

export async function getPerformanceRequests(performanceId: string) {
    return await prisma.songRequest.findMany({
        where: { performanceId },
        orderBy: { createdAt: 'desc' }
    })
}

export async function createSongRequest(data: { performanceId: string, title: string, artist?: string }) {
    const access = await requireAuthenticatedWrite()
    if (!access.allowed || !access.actorUserId) {
        return deniedWriteResult(access.statusCode)
    }

    const requesterProfile = await prisma.profile.findUnique({
        where: { id: access.actorUserId },
        select: { nickname: true }
    })

    return await prisma.songRequest.create({
        data: {
            performanceId: data.performanceId,
            title: data.title,
            artist: data.artist || '',
            requesterName: requesterProfile?.nickname || access.actorUserId,
            status: 'pending'
        }
    })
}

export async function acceptSongRequest(id: string, singerId: string) {
    const songRequest = await prisma.songRequest.findUnique({
        where: { id },
        select: {
            performance: {
                select: { singerId: true }
            }
        }
    })

    if (!songRequest?.performance) {
        return { success: false, statusCode: 404, error: 'SONG_REQUEST_NOT_FOUND' }
    }

    const access = await requireOwnerWrite(songRequest.performance.singerId)
    if (!access.allowed) {
        return deniedWriteResult(access.statusCode)
    }

    return await prisma.$transaction(async (tx: any) => {
        const request = await tx.songRequest.update({
            where: { id },
            data: { status: 'accepted' }
        })

        const song = await tx.song.create({
            data: {
                singerId: songRequest.performance.singerId,
                title: request.title,
                artist: request.artist || 'Unknown',
                isRepertoire: false,
                tags: '["requested"]'
            }
        })

        const count = await tx.performanceSong.count({
            where: { performanceId: request.performanceId }
        })

        await tx.performanceSong.create({
            data: {
                performanceId: request.performanceId,
                songId: song.id,
                order: count,
                status: 'pending'
            }
        })

        return song
    })
}

export async function rejectSongRequest(id: string) {
    const songRequest = await prisma.songRequest.findUnique({
        where: { id },
        select: {
            performance: {
                select: { singerId: true }
            }
        }
    })

    if (!songRequest?.performance) {
        return { success: false, statusCode: 404, error: 'SONG_REQUEST_NOT_FOUND' }
    }

    const access = await requireOwnerWrite(songRequest.performance.singerId)
    if (!access.allowed) {
        return deniedWriteResult(access.statusCode)
    }

    return await prisma.songRequest.update({
        where: { id },
        data: { status: 'rejected' }
    })
}

export async function getBookingRequests(singerId: string) {
    return await prisma.bookingRequest.findMany({
        where: { singerId },
        orderBy: { createdAt: 'desc' },
        include: {
            singer: { include: { profile: true } }
        }
    })
}

export async function createBookingRequest(data: {
    singerId: string,
    name: string,
    contact: string,
    eventType: string,
    eventDate?: string,
    location?: string,
    budget?: string,
    message?: string
}) {
    const access = await requireAuthenticatedWrite()
    if (!access.allowed || !access.actorUserId) {
        return deniedWriteResult(access.statusCode)
    }

    const requesterProfile = await prisma.profile.findUnique({
        where: { id: access.actorUserId },
        select: { nickname: true }
    })

    return await prisma.bookingRequest.create({
        data: {
            singerId: data.singerId,
            requesterName: requesterProfile?.nickname || data.name,
            contactInfo: data.contact,
            eventType: data.eventType,
            eventDate: data.eventDate ? new Date(data.eventDate) : null,
            location: data.location,
            budget: data.budget,
            message: data.message,
            status: 'pending'
        }
    })
}

export async function withdrawUser(userId: string) {
    try {
        const access = await requireOwnerWrite(userId)
        if (!access.allowed) {
            return deniedWriteResult(access.statusCode)
        }

        await prisma.profile.delete({ where: { id: userId } })
        return { success: true }
    } catch (error) {
        console.error('Withdraw failed:', error)
        return { success: false, error }
    }
}
