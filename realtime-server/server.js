const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const Redis = require('ioredis');
const { createAdapter } = require('@socket.io/redis-adapter');
const jwt = require('jsonwebtoken'); // Clerk 토큰 검증용

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 1000;
const RATE_LIMIT_MAX_MESSAGES = 3;

// Allowed origins for CORS
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      'http://localhost:3000',
      'https://busking.minibig.pw',
      'https://www.busking.minibig.pw',
    ];

const app = express();
app.use(cors({
  origin: (origin, callback) => {
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

// Rate limiting store (in-memory for simplicity)
const rateLimitStore = new Map();

function checkRateLimit(socketId, eventType) {
  const now = Date.now();
  const key = `${socketId}:${eventType}`;
  
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, { count: 0, windowStart: now });
  }
  
  const record = rateLimitStore.get(key);
  
  if (now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
    record.count = 0;
    record.windowStart = now;
  }
  
  record.count++;
  
  if (record.count > RATE_LIMIT_MAX_MESSAGES) {
    return false;
  }
  
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now - record.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
      rateLimitStore.delete(key);
    }
  }
}, RATE_LIMIT_WINDOW_MS * 10);

// Clerk JWT 검증 (pub/sub secret으로 서명된 세션 토큰)
function verifyClerkToken(token) {
  try {
    const secret = process.env.CLERK_SECRET_KEY;
    if (!secret) {
      console.warn('CLERK_SECRET_KEY not set, skipping token verification');
      return null;
    }
    // Clerk의 session token 검증 (RS256/JWK 필요 시 확장)
    // 간단한 경우: Next.js API를 통한 세션 검증 권장
    return jwt.verify(token, secret);
  } catch (err) {
    console.warn('Token verification failed:', err.message);
    return null;
  }
}

// Prisma 클라이언트 (실시간 서버 내부용)
// 참고: 실제로는 Next.js API를 경유하여 인증하고, 실시간 서버는 내부 인증된 요청만 처리하는 구조 권장
// 여기서는 Redis 기반 인증 상태를 활용

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

// 권한 확인: Redis에 저장된 인증 정보 활용
// 구조: Redis `auth:${socketId}` = { userId, userType, performanceId, singerId }
async function getSocketAuth(socketId, performanceId) {
  try {
    const authKey = `auth:${socketId}`;
    const authData = await redisClient.get(authKey);
    if (!authData) return null;
    
    const parsed = JSON.parse(authData);
    if (parsed.performanceId !== performanceId) return null;
    
    return parsed; // { userId, userType, singerId, performanceId }
  } catch (err) {
    console.error('Auth check failed:', err);
    return null;
  }
}

// Prisma를 통한 소유권 확인 (실시간 서버에서 직접 DB 조회)
// 참고: 실제로는 Next.js API로 권한 검증 후 브로드캐스트하는 구조가 더 안전함
// 여기서는 임시로 Redis 인증 정보만 활용
async function authorizeSingerControl(socketId, performanceId) {
  const auth = await getSocketAuth(socketId, performanceId);
  if (!auth) return false;
  
  // userType이 singer이고, singerId가 존재해야 함
  if (auth.userType !== 'singer' || !auth.singerId) return false;
  
  // 추가: Prisma로 performance 소유권 확인 (선택적, DB 연결 시)
  // const perf = await prisma.performance.findUnique({ where: { id: performanceId } });
  // return perf && perf.singerId === auth.singerId;
  
  return true;
}

io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on('join_room', async (data) => {
    const { performanceId, username, capacity = 50 } = data;
    if (!performanceId) return;

    // SECURITY: Do NOT trust userType from client. Look up from Redis.
    // The Next.js API sets auth:{socketId} when user authenticates.
    const authKey = `auth:${socket.id}`;
    let userType = 'audience'; // default, unprivileged
    let singerId = null;

    try {
      const authData = await redisClient.get(authKey);
      if (authData) {
        const parsed = JSON.parse(authData);
        if (parsed.performanceId === performanceId) {
          userType = parsed.userType || 'audience';
          singerId = parsed.singerId || null;
        }
      }
    } catch (err) {
      console.error('Auth lookup failed:', err);
    }

    const sockets = await io.in(performanceId).fetchSockets();
    const audienceCount = sockets.filter(s => s.data && s.data.userType === 'audience').length;

    if (userType === 'audience' && audienceCount >= capacity) {
      socket.emit('join_error', { message: '채팅방 인원이 가득 찼습니다.' });
      return;
    }

    // Store auth info in socket data (verified from Redis, not client)
    socket.data = { performanceId, userType, username, singerId };
    
    // Refresh Redis TTL on join
    await redisClient.set(authKey, JSON.stringify({
      performanceId,
      userType,
      username,
      singerId
    }), 'EX', 86400);

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

    // SECURITY: Only singer can open chat - verify through stored auth
    const isSinger = await authorizeSingerControl(socket.id, performanceId);
    if (!isSinger) {
      console.warn(`Unauthorized open_chat attempt from ${socket.id}`);
      socket.emit('authorization_error', { event: 'open_chat', message: '권한이 없습니다.' });
      return;
    }

    if (!checkRateLimit(socket.id, 'open_chat')) {
      socket.emit('authorization_error', { event: 'rate_limit', message: '너무 많은 요청입니다.' });
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
    const isSinger = await authorizeSingerControl(socket.id, performanceId);
    if (!isSinger) {
      console.warn(`Unauthorized system_alert attempt from ${socket.id}`);
      socket.emit('authorization_error', { event: 'system_alert', message: '권한이 없습니다.' });
      return;
    }

    if (!checkRateLimit(socket.id, 'system_alert')) {
      socket.emit('authorization_error', { event: 'rate_limit', message: '너무 많은 요청입니다.' });
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

    if (!checkRateLimit(socket.id, 'song_requested')) {
      socket.emit('authorization_error', { event: 'rate_limit', message: '너무 많은 요청입니다.' });
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

    if (!amount || typeof amount !== 'number' || amount < 1 || amount > 100000) {
      console.warn(`Invalid donation amount from ${socket.id}: ${amount}`);
      socket.emit('authorization_error', { event: 'donation_received', message: '잘못된 후원 금액입니다.' });
      return;
    }

    if (!checkRateLimit(socket.id, 'donation_received')) {
      socket.emit('authorization_error', { event: 'rate_limit', message: '너무 많은 요청입니다.' });
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
    const isSinger = await authorizeSingerControl(socket.id, performanceId);
    if (!isSinger) {
      console.warn(`Unauthorized chat_status_toggled attempt from ${socket.id}`);
      socket.emit('authorization_error', { event: 'chat_status_toggled', message: '권한이 없습니다.' });
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

    // SECURITY: Only singer can end performance - verify through stored auth
    authorizeSingerControl(socket.id, performanceId).then(isSinger => {
      if (!isSinger) {
        console.warn(`Unauthorized performance_ended attempt from ${socket.id}`);
        socket.emit('authorization_error', { event: 'performance_ended', message: '권한이 없습니다.' });
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
