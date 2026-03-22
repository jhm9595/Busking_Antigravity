const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const Redis = require('ioredis');
const { createAdapter } = require('@socket.io/redis-adapter');

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 1000; // 1 second window
const RATE_LIMIT_MAX_MESSAGES = 3; // Max 3 messages per window per socket

// Allowed origins for CORS
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : [
        'http://localhost:3000',
        'https://minimic.com',
        'https://www.minimic.com',
        // Production Cloud Run URL
        'https://busking-chat-server-678912953258.us-central1.run.app'
      ];

const app = express();
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.run.app')) {
            return callback(null, true);
        }
        
        console.warn(`Blocked CORS request from origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST']
}));

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);
            
            if (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.run.app')) {
                return callback(null, true);
            }
            
            console.warn(`Blocked CORS request from origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        },
        methods: ['GET', 'POST']
    }
});

const redisClient = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');
redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('Connected to Redis'));

const pubClient = redisClient;
const subClient = pubClient.duplicate();
io.adapter(createAdapter(pubClient, subClient));

// Rate limiting store (in-memory for simplicity, use Redis for production)
const rateLimitStore = new Map();

function checkRateLimit(socketId, eventType) {
    const now = Date.now();
    const key = `${socketId}:${eventType}`;
    
    if (!rateLimitStore.has(key)) {
        rateLimitStore.set(key, { count: 0, windowStart: now });
    }
    
    const record = rateLimitStore.get(key);
    
    // Reset if window expired
    if (now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
        record.count = 0;
        record.windowStart = now;
    }
    
    // Increment and check
    record.count++;
    
    if (record.count > RATE_LIMIT_MAX_MESSAGES) {
        return false; // Rate limited
    }
    
    return true;
}

// Clean up old rate limit records periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
        if (now - record.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
            rateLimitStore.delete(key);
        }
    }
}, RATE_LIMIT_WINDOW_MS * 10);

async function broadcastAndStore(performanceId, messageObj) {
    const historyKey = `live_history:${performanceId}`;
    try {
        await redisClient.rpush(historyKey, JSON.stringify(messageObj));
        await redisClient.expire(historyKey, 86400); 
        io.in(performanceId).emit('receive_message', messageObj);
    } catch (err) {
        console.error('Failed to store history:', err);
    }
}

// Helper to verify if socket belongs to singer for a performance
async function verifySingerOwnership(socketId, performanceId) {
    // For now, trust the userType stored during join
    // In production, this should verify against the authoritative DB
    const sockets = await io.in(performanceId).fetchSockets();
    const socket = sockets.find(s => s.id === socketId);
    
    if (!socket || !socket.data) return false;
    
    // Singer must have joined with userType='singer'
    return socket.data.userType === 'singer';
}

io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

    socket.on('join_room', async (data) => {
        const { performanceId, username, userType, capacity = 50 } = data;
        if (!performanceId) return;

        // Validate userType
        if (!['singer', 'audience'].includes(userType)) {
            console.warn(`Invalid userType from ${socket.id}: ${userType}`);
            socket.emit('join_error', { message: '잘못된 사용자 유형입니다.' });
            return;
        }

        const sockets = await io.in(performanceId).fetchSockets();
        const audienceCount = sockets.filter(s => s.data && s.data.userType === 'audience').length;

        if (userType === 'audience' && audienceCount >= capacity) {
            socket.emit('join_error', { message: '채팅방 인원이 가득 찼습니다.' });
            return;
        }

        socket.data = { performanceId, userType, username };
        socket.join(performanceId);

        const newCount = userType === 'audience' ? audienceCount + 1 : audienceCount;
        io.in(performanceId).emit('update_viewing_count', { count: newCount });

        const statusKey = `live_status:${performanceId}`;
        const status = await redisClient.get(statusKey) || 'closed';
        socket.emit('chat_status', { status });

        if (status === 'open' || userType === 'singer') {
            const historyKey = `live_history:${performanceId}`;
            const historyStr = await redisClient.lrange(historyKey, 0, -1);
            const history = historyStr.map(msg => JSON.parse(msg));
            socket.emit('load_history', history);
        } else {
            socket.emit('load_history', []);
        }
    });

    socket.on('open_chat', async (data) => {
        const { performanceId } = data;
        if (!performanceId) return;

        // SECURITY: Only singer can open chat
        const isSinger = await verifySingerOwnership(socket.id, performanceId);
        if (!isSinger) {
            console.warn(`Unauthorized open_chat attempt from ${socket.id}`);
            socket.emit('error', { message: '권한이 없습니다.' });
            return;
        }

        // Rate limit check
        if (!checkRateLimit(socket.id, 'open_chat')) {
            socket.emit('error', { message: '너무 많은 요청입니다.' });
            return;
        }

        const statusKey = `live_status:${performanceId}`;
        await redisClient.set(statusKey, 'open', 'EX', 86400);
        io.in(performanceId).emit('chat_status', { status: 'open' });

        await broadcastAndStore(performanceId, {
            performanceId,
            author: 'System',
            message: '채팅창이 열렸습니다!',
            timestamp: new Date().toISOString(),
            type: 'system'
        });
    });

    socket.on('send_message', async (data) => {
        const { performanceId, userType } = data;
        if (!performanceId) return;

        // Rate limit check for messages
        if (!checkRateLimit(socket.id, 'send_message')) {
            return; // Silently drop rate-limited messages
        }

        const statusKey = `live_status:${performanceId}`;
        const status = await redisClient.get(statusKey) || 'closed';
        if (status !== 'open' && userType !== 'singer') return;

        await broadcastAndStore(performanceId, data);
    });

    socket.on('system_alert', async (data) => {
        const { performanceId, message } = data;
        if (!performanceId) return;

        // SECURITY: Only singer can send system alerts
        const isSinger = await verifySingerOwnership(socket.id, performanceId);
        if (!isSinger) {
            console.warn(`Unauthorized system_alert attempt from ${socket.id}`);
            socket.emit('error', { message: '권한이 없습니다.' });
            return;
        }

        // Rate limit check
        if (!checkRateLimit(socket.id, 'system_alert')) {
            socket.emit('error', { message: '너무 많은 요청입니다.' });
            return;
        }

        await broadcastAndStore(performanceId, {
            performanceId,
            author: 'System',
            message,
            timestamp: new Date().toISOString(),
            type: 'system',
            isAlert: true
        });
    });

    socket.on('song_requested', async (data) => {
        const { performanceId, title, artist, username, timestamp } = data;
        if (!performanceId) return;

        // Rate limit check
        if (!checkRateLimit(socket.id, 'song_requested')) {
            socket.emit('error', { message: '너무 많은 요청입니다.' });
            return;
        }

        await broadcastAndStore(performanceId, {
            performanceId,
            author: 'System',
            message: `새로운 신청곡: ${title} ${artist ? ' - ' + artist : ''} (신청: ${username})`,
            timestamp: timestamp || new Date().toISOString(),
            type: 'system',
            isRequest: true,
            requestData: { title, artist, username }
        });
        io.in(performanceId).emit('song_requested', data);
    });

    socket.on('donation_received', async (data) => {
        const { performanceId, username, amount } = data;
        if (!performanceId) return;

        // SECURITY: Validate donation amount (basic sanity check)
        if (!amount || typeof amount !== 'number' || amount < 1 || amount > 100000) {
            console.warn(`Invalid donation amount from ${socket.id}: ${amount}`);
            socket.emit('error', { message: '잘못된 후원 금액입니다.' });
            return;
        }

        // Rate limit check
        if (!checkRateLimit(socket.id, 'donation_received')) {
            socket.emit('error', { message: '너무 많은 요청입니다.' });
            return;
        }

        await broadcastAndStore(performanceId, {
            performanceId,
            author: 'System',
            message: `${username}님이 ${amount} 포인트를 후원하셨습니다! 💖`,
            timestamp: new Date().toISOString(),
            type: 'donation',
            amount,
            donorName: username
        });
    });

    socket.on('chat_status_toggled', async (data) => {
        const { performanceId, enabled } = data;
        if (!performanceId) return;

        // SECURITY: Only singer can toggle chat status
        const isSinger = await verifySingerOwnership(socket.id, performanceId);
        if (!isSinger) {
            console.warn(`Unauthorized chat_status_toggled attempt from ${socket.id}`);
            socket.emit('error', { message: '권한이 없습니다.' });
            return;
        }

        const statusKey = `live_status:${performanceId}`;
        const newStatus = enabled ? 'open' : 'closed';
        await redisClient.set(statusKey, newStatus, 'EX', 86400);
        
        io.in(performanceId).emit('chat_status', { status: newStatus });
        if (enabled) {
            await broadcastAndStore(performanceId, {
                performanceId,
                author: 'System',
                message: '가수가 채팅방을 열었습니다!',
                timestamp: new Date().toISOString(),
                type: 'system'
            });
        }
    });

    socket.on('song_status_updated', (data) => {
        const { performanceId } = data;
        if (performanceId) io.in(performanceId).emit('song_status_updated', data);
    });

    socket.on('performance_ended', (data) => {
        const { performanceId } = data;
        if (!performanceId) return;

        // SECURITY: Only singer can end performance
        verifySingerOwnership(socket.id, performanceId).then(isSinger => {
            if (!isSinger) {
                console.warn(`Unauthorized performance_ended attempt from ${socket.id}`);
                socket.emit('error', { message: '권한이 없습니다.' });
                return;
            }
            io.in(performanceId).emit('performance_ended', data);
        });
    });

    socket.on('disconnect', () => {
        if (socket.data && socket.data.performanceId) {
            const perfId = socket.data.performanceId;
            setTimeout(async () => {
                try {
                    const sockets = await io.in(perfId).fetchSockets();
                    const count = sockets.filter(s => s.data && s.data.userType === 'audience').length;
                    io.in(perfId).emit('update_viewing_count', { count });
                } catch (e) {
                    console.error('Error fetching sockets on disconnect', e);
                }
            }, 500);
        }
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Realtime Server running on port ${PORT}`);
    console.log(`Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
});
