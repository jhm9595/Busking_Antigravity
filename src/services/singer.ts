'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

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

export async function updateSingerProfile(singerId: string, data: { bio?: string, socialLinks?: string, hairColor?: string, topColor?: string, bottomColor?: string }) {
    try {
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
    await prisma.performance.update({
        where: { id },
        data: { status }
    })
    revalidatePath('/singer/dashboard')
    revalidatePath(`/live/${id}`)
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

export async function deleteSong(songId: string) {
    await prisma.song.delete({ where: { id: songId } })
    revalidatePath('/singer/dashboard')
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

export async function updateSetlistOrder(performanceId: string, songIds: string[]) {
    await prisma.$transaction(
        songIds.map((id, index) =>
            prisma.performanceSong.updateMany({
                where: { performanceId, songId: id },
                data: { order: index }
            })
        )
    )
    revalidatePath(`/live/${performanceId}`)
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
        const newStart = new Date(data.startTime)
        const newEnd = new Date(data.endTime)

        const durationMs = newEnd.getTime() - newStart.getTime()
        const durationHours = durationMs / (1000 * 60 * 60)
        
        if (durationHours < 1) {
            return { success: false, error: 'MIN_DURATION_NOT_MET' }
        }

        const billableHours = Math.ceil(durationHours)
        const totalCost = billableHours * 1000

        return await prisma.$transaction(async (tx) => {
            const profile = await tx.profile.findUnique({ where: { id: data.singerId } })
            if (!profile || profile.points < totalCost) {
                throw new Error('INSUFFICIENT_POINTS')
            }

            const existingPerformances = await tx.performance.findMany({
                where: {
                    singerId: data.singerId,
                    status: { in: ['scheduled', 'live'] }
                }
            })

            const overlapping = existingPerformances.find(p => {
                const start = new Date(p.startTime)
                const end = new Date(p.endTime!)
                return (newStart < end) && (newEnd > start)
            })

            if (overlapping) throw new Error('DUPLICATE_SCHEDULE')

            await tx.profile.update({
                where: { id: data.singerId },
                data: { points: { decrement: totalCost } }
            })

            await tx.pointTransaction.create({
                data: {
                    profileId: data.singerId,
                    amount: -totalCost,
                    type: 'PERFORMANCE_REGISTER',
                    description: `Registration Fee: ${data.title} (${durationHours.toFixed(1)}h)`
                }
            })

            const result = await tx.performance.create({
                data: {
                    singerId: data.singerId,
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
    await prisma.performance.delete({ where: { id } })
    revalidatePath('/singer/dashboard')
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
    streamingEnabled?: boolean
}) {
    try {
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

export async function createSongRequest(data: { performanceId: string, title: string, artist?: string, requesterName: string }) {
    return await prisma.songRequest.create({
        data: {
            performanceId: data.performanceId,
            title: data.title,
            artist: data.artist || '',
            requesterName: data.requesterName,
            status: 'pending'
        }
    })
}

export async function acceptSongRequest(id: string, singerId: string) {
    return await prisma.$transaction(async (tx) => {
        const request = await tx.songRequest.update({
            where: { id },
            data: { status: 'accepted' }
        })

        const song = await tx.song.create({
            data: {
                singerId,
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
    return await prisma.bookingRequest.create({
        data: {
            singerId: data.singerId,
            requesterName: data.name,
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

export async function updateTeamId(singerId: string, teamId: string | null) {
  try {
    await prisma.singer.update({
      where: { id: singerId },
      data: { teamId }
    })
    revalidatePath(`/singer/${singerId}`)
    revalidatePath('/singer/dashboard')
    return { success: true }
  } catch (error) {
    return { success: false, error }
  }
}

export async function getTeamMembers(teamId: string) {
  return await prisma.singer.findMany({
    where: { teamId },
    orderBy: { createdAt: 'asc' }
  })
}

// Withdraw user - delete all user data
export async function withdrawUser(userId: string) {
  try {
    // Delete in order to respect foreign key constraints
    // 1. Delete performance songs
    await prisma.performanceSong.deleteMany({
      where: { performance: { singerId: userId } }
    })
    
    // 2. Delete performances
    await prisma.performance.deleteMany({
      where: { singerId: userId }
    })
    
    // 3. Delete songs
    await prisma.song.deleteMany({
      where: { singerId: userId }
    })
    
    // 4. Delete booking requests
    await prisma.bookingRequest.deleteMany({
      where: { singerId: userId }
    })
    
    // 5. Delete follows
    await prisma.follow.deleteMany({
      where: { OR: [{ singerId: userId }, { fanId: userId }] }
    })
    
    // 6. Delete point transactions
    await prisma.pointTransaction.deleteMany({
      where: { profileId: userId }
    })
    
    // 7. Delete singer profile
    await prisma.singer.deleteMany({
      where: { id: userId }
    })
    
    // 8. Delete profile
    await prisma.profile.deleteMany({
      where: { id: userId }
    })
    
    revalidatePath('/')
    revalidatePath('/singer/dashboard')
    
    return { success: true }
  } catch (error) {
    console.error('Withdrawal error:', error)
    return { success: false, error }
  }
}
