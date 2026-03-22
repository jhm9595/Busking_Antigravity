const { PrismaClient } = require('@prisma/client');
const { io } = require('socket.io-client');
const prisma = new PrismaClient();

const SERVER_URL = process.env.NEXT_PUBLIC_REALTIME_SERVER_URL || 'https://busking-chat-server-1073779064370.us-central1.run.app';

async function main() {
  console.log(`Connecting to Realtime Server at ${SERVER_URL}...`);
  const socket = io(SERVER_URL);

  await new Promise((resolve) => {
    socket.on('connect', () => {
      console.log('socket.io connected!');
      resolve();
    });
  });

  console.log('목업 공연들의 채팅방을 강제로 개설합니다...');
  const performances = await prisma.performance.findMany({
    where: { 
      singerId: { startsWith: 'mock_singer_' }
    }
  });

  let opened = 0;
  for (const p of performances) {
    socket.emit('chat_status_toggled', { performanceId: p.id, enabled: true });
    opened++;
    // Add small delay to avoid flooding
    await new Promise(r => setTimeout(r, 50));
  }

  console.log(`✅ ${opened}개의 목업 공연 채팅방 상태를 'open'으로 변경했습니다 (프로덕션 챗서버).`);
  
  socket.disconnect();
  await prisma.$disconnect();
}

main().catch(console.error);
