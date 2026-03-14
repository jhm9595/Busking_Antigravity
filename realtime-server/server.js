const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const Redis = require('ioredis');
const { createAdapter } = require('@socket.io/redis-adapter');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const redisClient = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');
redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('Connected to Redis'));

const pubClient = redisClient;
const subClient = pubClient.duplicate();
io.adapter(createAdapter(pubClient, subClient));

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

io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

    socket.on('join_room', async (data) => {
        const { performanceId, username, userType, capacity = 50 } = data;
        if (!performanceId) return;

        const sockets = await io.in(performanceId).fetchSockets();
        const audienceCount = sockets.filter(s => s.data && s.data.userType === 'audience').length;

        if (userType === 'audience' && audienceCount >= capacity) {
            socket.emit('join_error', { message: '채팅방 인원이 가득 찼습니다.' });
            return;
        }

        socket.data = { performanceId, userType };
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

        const statusKey = `live_status:${performanceId}`;
        const status = await redisClient.get(statusKey) || 'closed';
        if (status !== 'open' && userType !== 'singer') return;

        await broadcastAndStore(performanceId, data);
    });

    socket.on('system_alert', async (data) => {
        const { performanceId, message } = data;
        if (!performanceId) return;

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

        await broadcastAndStore(performanceId, {
            performanceId,
            author: 'System',
            message: `${username}님이 ${amount} 포인트를 후원하셨습니다! 💖`,
            timestamp: new Date().toISOString(),
            type: 'donation',
            amount
        });
    });

    socket.on('chat_status_toggled', async (data) => {
        const { performanceId, enabled } = data;
        if (!performanceId) return;

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
        if (performanceId) io.in(performanceId).emit('performance_ended', data);
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
});
