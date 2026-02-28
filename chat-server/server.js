const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const Redis = require('ioredis');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

// Configure Redis client
const redisClient = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('Connected to Redis'));

io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

    socket.on('join_room', async (data) => {
        const { performanceId, username, userType } = data;
        socket.join(performanceId);
        
        // Check room status
        const statusKey = `chat_status:${performanceId}`;
        const status = await redisClient.get(statusKey) || 'closed';
        
        socket.emit('chat_status', { status });

        if (status === 'open' || userType === 'singer') {
            const historyKey = `chat_history:${performanceId}`;
            const historyStr = await redisClient.lrange(historyKey, 0, -1);
            const history = historyStr.map(msg => JSON.parse(msg));
            socket.emit('load_history', history);
        } else {
            socket.emit('load_history', []);
        }
    });

    socket.on('open_chat', async (data) => {
        const { performanceId } = data;
        const statusKey = `chat_status:${performanceId}`;
        await redisClient.set(statusKey, 'open', 'EX', 86400); // Expire in 1 day
        io.in(performanceId).emit('chat_status', { status: 'open' });
        
        const sysMsg = {
             performanceId,
             author: 'System',
             message: '채팅창이 열렸습니다! (Chat is now open!)',
             timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
             type: 'system'
        };
        await redisClient.rpush(`chat_history:${performanceId}`, JSON.stringify(sysMsg));
        await redisClient.expire(`chat_history:${performanceId}`, 86400);
        io.in(performanceId).emit('receive_message', sysMsg);
    });

    socket.on('send_message', async (data) => {
        const { performanceId, userType } = data;
        const statusKey = `chat_status:${performanceId}`;
        const status = await redisClient.get(statusKey) || 'closed';

        if (status !== 'open' && userType !== 'singer') {
             // Ignore if not open
             return;
        }

        const historyKey = `chat_history:${performanceId}`;
        
        await redisClient.rpush(historyKey, JSON.stringify(data));
        await redisClient.expire(historyKey, 86400); // Expiry 1 day
        
        io.in(performanceId).emit('receive_message', data);
    });

    socket.on('system_alert', async (data) => {
         const { performanceId, message } = data;
         const sysMsg = {
             performanceId,
             author: 'System',
             message,
             timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
             type: 'system',
             isAlert: true
         };
         
         const historyKey = `chat_history:${performanceId}`;
         await redisClient.rpush(historyKey, JSON.stringify(sysMsg));
         await redisClient.expire(historyKey, 86400);
         
         io.in(performanceId).emit('receive_message', sysMsg);
    });

    socket.on('song_requested', (data) => {
        const { performanceId } = data;
        io.in(performanceId).emit('song_requested', data);
    });

    socket.on('disconnect', () => {
        console.log('User Disconnected', socket.id);
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Chat Server running on port ${PORT}`);
});
