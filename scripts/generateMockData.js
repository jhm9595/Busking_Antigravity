const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const path = require('path');

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
const redisClient = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');


const MOCK_PREFIX = 'mock_singer_';

const mockSingers = [
  {
    id: `${MOCK_PREFIX}1`,
    nickname: "보컬장인 김소울",
    stageName: "김소울",
    bio: "30대의 짙은 호소력. 영혼을 울리는 소울 R&B를 들려드립니다. 언제나 라이브에서 뵙겠습니다!",
    location: { text: "서울 홍대 걷고싶은거리", lat: 37.5568, lng: 126.9242 },
    songs: [
      { title: "Good Day", artist: "IU", youtubeUrl: "https://www.youtube.com/watch?v=jeqdYqsrsA0" },
      { title: "Someone Like You", artist: "Adele", youtubeUrl: "https://www.youtube.com/watch?v=hLQl3WQQoQ0" },
      { title: "Attention", artist: "Charlie Puth", youtubeUrl: "https://www.youtube.com/watch?v=nfs8NYg7yQM" }
    ]
  },
  {
    id: `${MOCK_PREFIX}2`,
    nickname: "인디팝 요정 제이",
    stageName: "요정 제이",
    bio: "20대 초반의 상큼하고 발랄한 꿀보이스 인디 뮤직! 많이 사랑해주세요.",
    location: { text: "서울 신촌 연세로", lat: 37.5551, lng: 126.9369 },
    songs: [
      { title: "Hype Boy", artist: "NewJeans", youtubeUrl: "https://www.youtube.com/watch?v=11cta61wi0g" },
      { title: "Love Lee", artist: "AKMU", youtubeUrl: "https://www.youtube.com/watch?v=EIz09kLzN9k" },
      { title: "Sugar", artist: "Maroon 5", youtubeUrl: "https://www.youtube.com/watch?v=09R8_2nJtjg" }
    ]
  },
  {
    id: `${MOCK_PREFIX}3`,
    nickname: "버스킹 레전드 밴드",
    stageName: "어쿠스틱 밴드",
    bio: "20대 3인조 어쿠스틱 청춘 밴드. 한 편의 영화 같은 밴드곡 라이브!",
    location: { text: "경기 수원역 로데오거리", lat: 37.2659, lng: 127.0000 },
    songs: [
      { title: "Time of Our Life", artist: "DAY6", youtubeUrl: "https://www.youtube.com/watch?v=vnS_jn2uibs" },
      { title: "Yellow", artist: "Coldplay", youtubeUrl: "https://www.youtube.com/watch?v=yKNxeF4KMsY" }
    ]
  },
  {
    id: `${MOCK_PREFIX}4`,
    nickname: "힙합 루키 제트",
    stageName: "래퍼 제트",
    bio: "열정과 폭발적인 에너지를 가진 20대 열혈 래퍼. 팝송/케이팝 모두 제 스타일로 소화합니다.",
    location: { text: "서울 강남역 M스테이지", lat: 37.4979, lng: 127.0276 },
    songs: [
      { title: "Gangnam Style", artist: "PSY", youtubeUrl: "https://www.youtube.com/watch?v=9bZkp7q19f0" },
      { title: "Uptown Funk", artist: "Bruno Mars", youtubeUrl: "https://www.youtube.com/watch?v=OPf0YbXqDm0" }
    ]
  },
  {
    id: `${MOCK_PREFIX}5`,
    nickname: "감성발라더 이연우",
    stageName: "이연우",
    bio: "슬픈 이별 음악, 그리고 따뜻한 위로. 30대 감성으로 누구나 눈물짓게 만드는 독보적 라이브.",
    location: { text: "경기 일산 라페스타", lat: 37.6606, lng: 126.7689 },
    songs: [
      { title: "모든 날, 모든 순간", artist: "폴킴 (Paul Kim)", youtubeUrl: "https://www.youtube.com/watch?v=R3Fwdnj4A-k" },
      { title: "사건의 지평선 (Event Horizon)", artist: "윤하 (Younha)", youtubeUrl: "https://www.youtube.com/watch?v=bbWVNOWhq8M" }
    ]
  },
  {
    id: `${MOCK_PREFIX}6`,
    nickname: "팝페라 테너 클래식",
    stageName: "테너 류",
    bio: "클래식과 팝의 만남! 30대의 중후한 매력과 폭발적인 성량으로 거리를 무대로 만듭니다.",
    location: { text: "서울 대학로 마로니에공원", lat: 37.5823, lng: 127.0018 },
    songs: [
      { title: "Someone Like You", artist: "Adele", youtubeUrl: "https://www.youtube.com/watch?v=hLQl3WQQoQ0" },
      { title: "Shape of You", artist: "Ed Sheeran", youtubeUrl: "https://www.youtube.com/watch?v=JGwWNGJdvx8" }
    ]
  },
  {
    id: `${MOCK_PREFIX}7`,
    nickname: "시티팝 마스터 준",
    stageName: "마스터 준",
    bio: "해변가의 밤바다를 수놓는 아련한 시티팝 전문. 20대의 감각을 수혈받아 트렌디한 무대를 선보입니다.",
    location: { text: "부산 해운대 해수욕장", lat: 35.1587, lng: 129.1604 },
    songs: [
      { title: "Dynamite", artist: "BTS", youtubeUrl: "https://www.youtube.com/watch?v=gdZLi9oWNZg" },
      { title: "Peaches", artist: "Justin Bieber", youtubeUrl: "https://www.youtube.com/watch?v=tQ0yjYUFKAE" }
    ]
  },
  {
    id: `${MOCK_PREFIX}8`,
    nickname: "팝송 커버 여신 바다",
    stageName: "여신 바다",
    bio: "30대의 여유! 유튜브 1,000만 조회수의 화제성 입증! 글로벌 팝송부터 K팝 댄스곡까지 전부 커버합니다.",
    location: { text: "인천 부평 문화의거리", lat: 37.4895, lng: 126.7231 },
    songs: [
      { title: "bad guy", artist: "Billie Eilish", youtubeUrl: "https://www.youtube.com/watch?v=DyDfgMOUjCI" },
      { title: "DDU-DU DDU-DU", artist: "BLACKPINK", youtubeUrl: "https://www.youtube.com/watch?v=IHNzOHi8sJs" },
      { title: "Sugar", artist: "Maroon 5", youtubeUrl: "https://www.youtube.com/watch?v=09R8_2nJtjg" }
    ]
  },
  {
    id: `${MOCK_PREFIX}9`,
    nickname: "기타리스트 앤 잭",
    stageName: "잭 (Jack)",
    bio: "40대의 연륜이 묻어나는 환상적인 핑거스타일 기타 연주. 그리고 깊이 있는 보이스의 조화.",
    location: { text: "대구 동성로", lat: 35.8698, lng: 128.5936 },
    songs: [
      { title: "Shape of You", artist: "Ed Sheeran", youtubeUrl: "https://www.youtube.com/watch?v=JGwWNGJdvx8" },
      { title: "Yellow", artist: "Coldplay", youtubeUrl: "https://www.youtube.com/watch?v=yKNxeF4KMsY" }
    ]
  },
  {
    id: `${MOCK_PREFIX}10`,
    nickname: "만능 트로터 금잔디",
    stageName: "금잔디",
    bio: "나이는 숫자에 불과하다! 50대의 관록을 바탕으로 전 세대를 아우르는 트로트부터 모든 댄스곡까지!",
    location: { text: "부산 광안리 카페거리", lat: 35.1532, lng: 129.1189 },
    songs: [
      { title: "모든 날, 모든 순간", artist: "폴킴 (Paul Kim)", youtubeUrl: "https://www.youtube.com/watch?v=R3Fwdnj4A-k" },
      { title: "Gangnam Style", artist: "PSY", youtubeUrl: "https://www.youtube.com/watch?v=9bZkp7q19f0" },
      { title: "Good Day", artist: "IU", youtubeUrl: "https://www.youtube.com/watch?v=jeqdYqsrsA0" }
    ]
  }
];

function getPerformanceTimes(index) {
  const now = new Date();
  if (index < 3) { // LIVE NOW: 3 singers
    const start = new Date(now.getTime() - 30 * 60 * 1000); 
    const end = new Date(now.getTime() + 60 * 60 * 1000);
    return { start, end, status: 'live' };
  } else if (index < 7) { // Scheduled today: 4 singers
    const start = new Date(now.getTime() + (Math.floor(Math.random() * 8) + 2) * 60 * 60 * 1000); 
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    return { start, end, status: 'scheduled' };
  } else { // Scheduled tomorrow: 3 singers
    const start = new Date(now.getTime() + (Math.floor(Math.random() * 12) + 24) * 60 * 60 * 1000); 
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); 
    return { start, end, status: 'scheduled' };
  }
}

async function deleteData() {
  console.log('기존 구글 애드센스 승인 심사용 목업(가짜) 데이터를 삭제합니다...');
  
  const mockPerformances = await prisma.performance.findMany({
    where: { singerId: { startsWith: MOCK_PREFIX } }
  });
  const mockPerfIds = mockPerformances.map(p => p.id);

  if (mockPerfIds.length > 0) {
    await prisma.performanceSong.deleteMany({
      where: { performanceId: { in: mockPerfIds } }
    });
    await prisma.songRequest.deleteMany({
      where: { performanceId: { in: mockPerfIds } }
    });
    await prisma.performance.deleteMany({
      where: { id: { in: mockPerfIds } }
    });
  }

  await prisma.song.deleteMany({
    where: { singerId: { startsWith: MOCK_PREFIX } }
  });

  await prisma.singer.deleteMany({
    where: { id: { startsWith: MOCK_PREFIX } }
  });

  await prisma.pointTransaction.deleteMany({
    where: { profileId: { startsWith: MOCK_PREFIX } }
  });

  await prisma.profile.deleteMany({
    where: { id: { startsWith: MOCK_PREFIX } }
  });

  console.log('✅ 데이터가 깔끔하게 삭제되었습니다.');
}

async function generateData() {
  console.log('🚀 구글 애드센스 승인을 위한 목업(가짜) 데이터를 생성합니다...');
  await deleteData(); // Clean up first just in case

  for (let i = 0; i < mockSingers.length; i++) {
    const s = mockSingers[i];
    console.log(`[${i+1}/${mockSingers.length}] 생성 중: ${s.stageName}`);
    
    // 1. Create Profile
    try {
      await prisma.profile.create({
        data: {
          id: s.id,
          email: `mock${i+1}@example.com`,
          role: "singer",
          nickname: s.nickname,
          avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(s.stageName)}&background=random&color=fff&size=200`
        }
      });
      console.log(`  - Profile 생성 완료`);
    } catch (e) {
      console.error(`  - Profile 생성 실패:`, e.message);
    }

    // 2. Create Singer
    try {
      await prisma.singer.create({
        data: {
          id: s.id,
          stageName: s.stageName,
          bio: s.bio,
          qrCodePattern: `https://busking.minibig.pw/singer/${s.id}`,
          socialLinks: "",
          isVerified: true,
          fanCount: Math.floor(Math.random() * 400) + 50,
        }
      });
      console.log(`  - Singer 생성 완료`);
    } catch (e) {
      console.error(`  - Singer 생성 실패:`, e.message);
    }

    // 3. Create Songs (Repertoires)
    const songRecords = [];
    for (const songData of s.songs) {
      const song = await prisma.song.create({
        data: {
          singerId: s.id,
          title: songData.title,
          artist: songData.artist,
          youtubeUrl: songData.youtubeUrl,
          isRepertoire: true
        }
      });
      songRecords.push(song);
    }
    console.log(`  - Songs 생성 완료 (${songRecords.length}곡)`);

    // 4. Create Performance
    const times = getPerformanceTimes(i);
    for (let perfNum = 1; perfNum <= 1 + (i % 2); perfNum++) {
      let pStart = new Date(times.start.getTime() + (perfNum - 1) * 24 * 60 * 60 * 1000);
      let pEnd = new Date(times.end.getTime() + (perfNum - 1) * 24 * 60 * 60 * 1000);
      let pStatus = (pStart > new Date()) ? 'scheduled' : 'live';
      
      const titleSuffix = (pStatus === 'live') ? '라이브 방송 중!' : '다가오는 길거리 콘서트';
      
      const performance = await prisma.performance.create({
        data: {
          singerId: s.id,
          title: `[${s.stageName}] ${titleSuffix} 🎬`,
          locationText: s.location.text,
          locationLat: s.location.lat,
          locationLng: s.location.lng,
          startTime: pStart,
          endTime: pEnd,
          description: `환영합니다! ${s.stageName}의 공연입니다. 다양한 레퍼토리가 준비되어 있어요. 🎶`,
          chatEnabled: true,
          status: pStatus,
          chatCapacity: 500,
          expectedAudience: Math.floor(Math.random() * 100) + 15,
        }
      });
      
      // 레디스(채팅서버)에 채팅방 상태를 open으로 등록
      const statusKey = `live_status:${performance.id}`;
      await redisClient.set(statusKey, 'open', 'EX', 86400 * 3); // 3일간 유지

      // Add songs to performance
      let order = 1;
      for (const sr of songRecords) {
        await prisma.performanceSong.create({
          data: {
            performanceId: performance.id,
            songId: sr.id,
            order: order++,
            status: pStatus === 'live' ? (order === 1 ? 'playing' : 'pending') : 'pending' // Just to make it realistic
          }
        });
      }
    }
    console.log(`  - Performances & PerformanceSongs 생성 완료`);
  }
  
  console.log('✅ 데이터가 모두 성공적으로 생성되었습니다. 사이트를 확인해보세요!');
}

const action = process.argv[2];

if (action === 'generate') {
  generateData()
    .catch(e => { console.error("Error creating data:", e) })
    .finally(() => { prisma.$disconnect(); redisClient.quit(); });
} else if (action === 'delete') {
  deleteData()
    .catch(e => { console.error("Error deleting data:", e) })
    .finally(() => { prisma.$disconnect(); redisClient.quit(); });
} else {
  console.log(`사용법: 
데이터 생성: node scripts/generateMockData.js generate
데이터 삭제: node scripts/generateMockData.js delete`);
  prisma.$disconnect();
  redisClient.quit();
}
