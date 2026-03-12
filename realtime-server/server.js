const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const Redis = require('ioredis')
const { createAdapter } = require('@socket.io/redis-adapter')
const realtimeAuthority = require('../src/lib/realtime-authority.js')

const { resolveJoinAuthority, authorizeOwnerControl, normalizePerformanceId } = realtimeAuthority

const app = express()
app.use(cors())

const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
})

const redisClient = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379')
redisClient.on('error', (err) => console.log('Redis Client Error', err))
redisClient.on('connect', () => console.log('Connected to Redis'))

const pubClient = redisClient
const subClient = pubClient.duplicate()
io.adapter(createAdapter(pubClient, subClient))

const HISTORY_TTL_SECONDS = 86400
const STATUS_TTL_SECONDS = 86400
const CAPACITY_TTL_SECONDS = 86400
const DEFAULT_ROOM_CAPACITY = parseInteger(process.env.REALTIME_DEFAULT_CHAT_CAPACITY, 50)
const MAX_ROOM_CAPACITY = parseInteger(process.env.REALTIME_MAX_CHAT_CAPACITY, 500)

function parseInteger(value, fallback) {
    const parsed = Number.parseInt(String(value), 10)
    return Number.isInteger(parsed) ? parsed : fallback
}

function normalizeUsername(value, fallback = 'Guest') {
    if (typeof value !== 'string') {
        return fallback
    }

    const trimmed = value.trim()
    if (!trimmed) {
        return fallback
    }

    return trimmed.slice(0, 32)
}

function normalizeMessageText(value, maxLength = 500) {
    if (typeof value !== 'string') {
        return null
    }

    const trimmed = value.trim()
    if (!trimmed) {
        return null
    }

    return trimmed.slice(0, maxLength)
}

function normalizePositiveInteger(value) {
    const parsed = Number.parseInt(String(value), 10)
    if (!Number.isInteger(parsed) || parsed <= 0) {
        return null
    }

    return parsed
}

function normalizeSocketTimestamp(value) {
    if (typeof value !== 'string') {
        return new Date().toISOString()
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
        return new Date().toISOString()
    }

    return date.toISOString()
}

function sanitizeAvatarConfig(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return null
    }

    return value
}

function countAudienceSockets(sockets) {
    return sockets.filter((connectedSocket) => {
        return !connectedSocket.data || connectedSocket.data.role !== 'owner'
    }).length
}

function isSocketOwnerForPerformance(socket, performanceId) {
    return Boolean(
        socket &&
        socket.data &&
        socket.data.role === 'owner' &&
        socket.data.performanceId === performanceId
    )
}

function emitAuthorizationError(socket, eventName) {
    socket.emit('authorization_error', {
        event: eventName,
        message: 'FORBIDDEN'
    })
}

async function resolveRoomCapacity(performanceId, tokenPayload = null) {
    const capacityKey = `live_capacity:${performanceId}`
    const tokenCapacity = normalizePositiveInteger(tokenPayload && tokenPayload.capacity)

    if (tokenCapacity) {
        const normalizedCapacity = Math.min(tokenCapacity, MAX_ROOM_CAPACITY)
        try {
            await redisClient.set(capacityKey, String(normalizedCapacity), 'EX', CAPACITY_TTL_SECONDS)
        } catch (_error) {
            return normalizedCapacity
        }
        return normalizedCapacity
    }

    try {
        const cachedCapacity = await redisClient.get(capacityKey)
        const normalizedCapacity = normalizePositiveInteger(cachedCapacity)
        if (normalizedCapacity) {
            return Math.min(normalizedCapacity, MAX_ROOM_CAPACITY)
        }
    } catch (_error) {
        return DEFAULT_ROOM_CAPACITY
    }

    return DEFAULT_ROOM_CAPACITY
}

async function broadcastAndStore(performanceId, messageObj) {
    const historyKey = `live_history:${performanceId}`

    try {
        await redisClient.rpush(historyKey, JSON.stringify(messageObj))
        await redisClient.expire(historyKey, HISTORY_TTL_SECONDS)
        io.in(performanceId).emit('receive_message', messageObj)
    } catch (err) {
        console.error('Failed to store history:', err)
    }
}

async function emitViewingCount(performanceId) {
    if (!performanceId) {
        return
    }

    try {
        const sockets = await io.in(performanceId).fetchSockets()
        const count = countAudienceSockets(sockets)
        io.in(performanceId).emit('update_viewing_count', { count })
    } catch (error) {
        console.error('Error updating viewing count', error)
    }
}

function applyOwnerTrustToSocket(socket, authorization) {
    if (!socket || !authorization || !authorization.performanceId) {
        return
    }

    socket.data = {
        ...socket.data,
        performanceId: authorization.performanceId,
        role: 'owner',
        actorUserId: authorization.actorUserId || (socket.data && socket.data.actorUserId) || null,
        username: normalizeUsername(socket.data && socket.data.username, 'Singer')
    }

    socket.join(authorization.performanceId)
}

function parseStoredHistory(historyRows) {
    return historyRows.reduce((messages, rawRow) => {
        try {
            const parsed = JSON.parse(rawRow)
            if (parsed && typeof parsed === 'object') {
                messages.push(parsed)
            }
        } catch (_error) {
            return messages
        }

        return messages
    }, [])
}

function buildChatMessage(socket, rawData, performanceId) {
    const messageText = normalizeMessageText(rawData && rawData.message)
    if (!messageText) {
        return null
    }

    const isOwner = isSocketOwnerForPerformance(socket, performanceId)
    const fallbackAuthor = isOwner ? 'Singer' : 'Guest'

    return {
        performanceId,
        author: normalizeUsername(socket.data && socket.data.username, fallbackAuthor),
        message: messageText,
        timestamp: normalizeSocketTimestamp(rawData && rawData.timestamp),
        type: isOwner ? 'singer' : 'audience',
        avatarConfig: isOwner ? null : sanitizeAvatarConfig((rawData && rawData.avatarConfig) || (socket.data && socket.data.avatarConfig))
    }
}

io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`)

    socket.on('join_room', async (rawData = {}) => {
        const joinAuthority = resolveJoinAuthority(rawData)
        const performanceId = joinAuthority.performanceId
        if (!performanceId) {
            return
        }

        const previousPerformanceId = socket.data && socket.data.performanceId
        if (previousPerformanceId && previousPerformanceId !== performanceId) {
            socket.leave(previousPerformanceId)
        }

        const sockets = await io.in(performanceId).fetchSockets()
        const audienceCount = countAudienceSockets(sockets)
        const roomCapacity = await resolveRoomCapacity(performanceId, joinAuthority.tokenPayload)
        const isOwner = joinAuthority.isOwner
        const alreadyJoined = socket.rooms.has(performanceId)

        if (!isOwner && !alreadyJoined && audienceCount >= roomCapacity) {
            socket.emit('join_error', { message: '채팅방 인원이 가득 찼습니다.' })
            return
        }

        socket.data = {
            ...socket.data,
            performanceId,
            role: isOwner ? 'owner' : 'audience',
            actorUserId: isOwner ? joinAuthority.actorUserId : null,
            username: normalizeUsername(rawData.username, isOwner ? 'Singer' : 'Guest'),
            avatarConfig: sanitizeAvatarConfig(rawData.avatarConfig),
            roomCapacity
        }
        socket.join(performanceId)

        const viewingCount = !isOwner && !alreadyJoined ? audienceCount + 1 : audienceCount
        io.in(performanceId).emit('update_viewing_count', { count: viewingCount })

        const statusKey = `live_status:${performanceId}`
        const status = (await redisClient.get(statusKey)) || 'closed'
        socket.emit('chat_status', { status })

        if (status === 'open' || isOwner) {
            const historyKey = `live_history:${performanceId}`
            const historyRows = await redisClient.lrange(historyKey, 0, -1)
            socket.emit('load_history', parseStoredHistory(historyRows))
            return
        }

        socket.emit('load_history', [])
    })

    socket.on('open_chat', async (rawData = {}) => {
        const authorization = authorizeOwnerControl(socket.data, rawData)
        if (!authorization.allowed || !authorization.performanceId) {
            emitAuthorizationError(socket, 'open_chat')
            return
        }

        applyOwnerTrustToSocket(socket, authorization)
        await resolveRoomCapacity(authorization.performanceId, authorization.tokenPayload)

        const statusKey = `live_status:${authorization.performanceId}`
        await redisClient.set(statusKey, 'open', 'EX', STATUS_TTL_SECONDS)

        io.in(authorization.performanceId).emit('chat_status', { status: 'open' })
        io.in(authorization.performanceId).emit('chat_status_toggled', { enabled: true })

        await broadcastAndStore(authorization.performanceId, {
            performanceId: authorization.performanceId,
            author: 'System',
            message: '채팅창이 열렸습니다!',
            timestamp: new Date().toISOString(),
            type: 'system'
        })
    })

    socket.on('send_message', async (rawData = {}) => {
        const payloadPerformanceId = normalizePerformanceId(rawData.performanceId)
        const socketPerformanceId = socket.data && socket.data.performanceId
        const performanceId = payloadPerformanceId || socketPerformanceId
        if (!performanceId || socketPerformanceId !== performanceId) {
            return
        }

        const statusKey = `live_status:${performanceId}`
        const status = (await redisClient.get(statusKey)) || 'closed'
        const isOwner = isSocketOwnerForPerformance(socket, performanceId)
        if (status !== 'open' && !isOwner) {
            return
        }

        const message = buildChatMessage(socket, rawData, performanceId)
        if (!message) {
            return
        }

        await broadcastAndStore(performanceId, message)
    })

    socket.on('system_alert', async (rawData = {}) => {
        const authorization = authorizeOwnerControl(socket.data, rawData)
        if (!authorization.allowed || !authorization.performanceId) {
            emitAuthorizationError(socket, 'system_alert')
            return
        }

        const message = normalizeMessageText(rawData.message, 300)
        if (!message) {
            return
        }

        applyOwnerTrustToSocket(socket, authorization)

        await broadcastAndStore(authorization.performanceId, {
            performanceId: authorization.performanceId,
            author: 'System',
            message,
            timestamp: new Date().toISOString(),
            type: 'system',
            isAlert: true
        })
    })

    socket.on('song_requested', async (rawData = {}) => {
        const performanceId = normalizePerformanceId(rawData.performanceId)
        if (!performanceId || !socket.data || socket.data.performanceId !== performanceId) {
            return
        }

        const title = normalizeMessageText(rawData.title, 120)
        if (!title) {
            return
        }

        const artist = normalizeMessageText(rawData.artist, 120)
        const username = normalizeUsername(rawData.username, normalizeUsername(socket.data.username, 'Audience'))
        const message = `새로운 신청곡: ${title}${artist ? ` - ${artist}` : ''} (신청: ${username})`
        const timestamp = normalizeSocketTimestamp(rawData.timestamp)

        await broadcastAndStore(performanceId, {
            performanceId,
            author: 'System',
            message,
            timestamp,
            type: 'system',
            isRequest: true,
            requestData: { title, artist: artist || '', username }
        })

        io.in(performanceId).emit('song_requested', {
            performanceId,
            title,
            artist: artist || '',
            username,
            timestamp
        })
    })

    socket.on('donation_received', async (rawData = {}) => {
        const performanceId = normalizePerformanceId(rawData.performanceId)
        if (!performanceId || !socket.data || socket.data.performanceId !== performanceId) {
            return
        }

        const amount = normalizePositiveInteger(rawData.amount)
        if (!amount) {
            return
        }

        const username = normalizeUsername(rawData.username, normalizeUsername(socket.data.username, 'Audience'))
        await broadcastAndStore(performanceId, {
            performanceId,
            author: 'System',
            message: `${username}님이 ${amount} 포인트를 후원하셨습니다! 💖`,
            timestamp: new Date().toISOString(),
            type: 'donation',
            amount
        })
    })

    socket.on('chat_status_toggled', async (rawData = {}) => {
        const authorization = authorizeOwnerControl(socket.data, rawData)
        if (!authorization.allowed || !authorization.performanceId) {
            emitAuthorizationError(socket, 'chat_status_toggled')
            return
        }

        applyOwnerTrustToSocket(socket, authorization)

        const enabled = Boolean(rawData.enabled)
        const newStatus = enabled ? 'open' : 'closed'
        const statusKey = `live_status:${authorization.performanceId}`
        await redisClient.set(statusKey, newStatus, 'EX', STATUS_TTL_SECONDS)

        io.in(authorization.performanceId).emit('chat_status', { status: newStatus })
        io.in(authorization.performanceId).emit('chat_status_toggled', { enabled })

        if (enabled) {
            await broadcastAndStore(authorization.performanceId, {
                performanceId: authorization.performanceId,
                author: 'System',
                message: '가수가 채팅방을 열었습니다!',
                timestamp: new Date().toISOString(),
                type: 'system'
            })
        }
    })

    socket.on('song_status_updated', (rawData = {}) => {
        const authorization = authorizeOwnerControl(socket.data, rawData)
        if (!authorization.allowed || !authorization.performanceId) {
            emitAuthorizationError(socket, 'song_status_updated')
            return
        }

        applyOwnerTrustToSocket(socket, authorization)

        io.in(authorization.performanceId).emit('song_status_updated', {
            performanceId: authorization.performanceId,
            songId: normalizePerformanceId(rawData.songId) || rawData.songId || null,
            status: normalizeMessageText(rawData.status, 32) || null
        })
    })

    socket.on('performance_ended', async (rawData = {}) => {
        const authorization = authorizeOwnerControl(socket.data, rawData)
        if (!authorization.allowed || !authorization.performanceId) {
            emitAuthorizationError(socket, 'performance_ended')
            return
        }

        applyOwnerTrustToSocket(socket, authorization)

        const statusKey = `live_status:${authorization.performanceId}`
        await redisClient.set(statusKey, 'closed', 'EX', STATUS_TTL_SECONDS)

        io.in(authorization.performanceId).emit('chat_status', { status: 'closed' })
        io.in(authorization.performanceId).emit('chat_status_toggled', { enabled: false })
        io.in(authorization.performanceId).emit('performance_ended', {
            performanceId: authorization.performanceId,
            endedAt: new Date().toISOString()
        })
    })

    socket.on('disconnect', () => {
        if (socket.data && socket.data.performanceId) {
            const performanceId = socket.data.performanceId
            setTimeout(() => {
                emitViewingCount(performanceId)
            }, 500)
        }
    })
})

const PORT = process.env.PORT || 4000
server.listen(PORT, () => {
    console.log(`Realtime Server running on port ${PORT}`)
})
