const { PrismaClient } = require('@prisma/client');
const path = require('path');

// Try requiring ioredis from realtime-server or root
let Redis;
try {
  Redis = require('./node_modules/ioredis');
} catch (e) {
  try {
    Redis = require('../realtime-server/node_modules/ioredis');
  } catch (e2) {
    Redis = require(path.join(__dirname, '../realtime-server/node_modules/ioredis'));
  }
}

const prisma = new PrismaClient();
const redisClient = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

async function main() {
  console.log('목업 공연들의 채팅방을 강제로 개설합니다...');
  const performances = await prisma.performance.findMany({
    where: { 
      singerId: { startsWith: 'mock_singer_' }
    }
  });

  let opened = 0;
  for (const p of performances) {
    const statusKey = `live_status:${p.id}`;
    await redisClient.set(statusKey, 'open', 'EX', 86400 * 3); // 3 days expiry
    opened++;
  }

  console.log(`✅ ${opened}개의 목업 공연 채팅방 상태를 'open'으로 레디스에 기록했습니다.`);
  
  await prisma.$disconnect();
  redisClient.quit();
}

main().catch(console.error);
