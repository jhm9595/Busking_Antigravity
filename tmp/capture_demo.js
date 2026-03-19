const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000';

const viewports = [
  { name: 'PC', width: 1280, height: 800 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Mobile', width: 375, height: 812 }
];

async function capture() {
  console.log('데이터베이스에서 데모 라이브 정보 세팅 중...');
  
  let livePerfId = null;
  try {
      const demoPerf = await prisma.performance.findFirst({
          where: { singerId: 'demo-singer-001', status: 'live' },
          orderBy: { startTime: 'desc' }
      });
      if (demoPerf) livePerfId = demoPerf.id;
  } catch (e) {
      console.log('DB 조회 에러:', e.message);
  }
  
  const SINGER_ID = 'demo-singer-001';

  const pages = [
    { name: '1_Home', url: '/' },
    { name: '2_ExploreMap', url: '/explore' },
    { name: '3_SingerProfile', url: `/singer/${SINGER_ID}` },
    { name: '4_AudienceLiveRoom', url: livePerfId ? `/live/${livePerfId}` : '/explore' },
    { name: '5_SingerDashboard', url: '/singer/dashboard' }
  ];

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const outputDir = path.join(__dirname, '..', 'public', 'screenshots');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`\n========================================================`);
  console.log(`🚀 [자동화 봇 실행] 사용자의 화면에 크롬 브라우저가 열렸습니다.`);
  console.log(`⚠️ 지금 열린 창에서 로그인을 진행하시거나 [Try Demo] 활동을 마쳐주세요.`);
  console.log(`========================================================\n`);
  
  await page.goto(`${BASE_URL}/`);
  
  console.log('⏳ [봇 대기중] 화면 준비가 끝나면 이 터미널에서 엔터를 치시거나, 저(안티그래비티)에게 "로그인 완료"라고 말씀해주세요!');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  await new Promise(resolve => {
    rl.question('', () => {
      rl.close();
      console.log('📸 확인되었습니다! 현재 세션으로 캡처를 시작합니다...');
      resolve();
    });
  });

  for (const pageInfo of pages) {
    if (pageInfo.url === '/explore' && !livePerfId) {
        console.log('라이브 방 정보가 없어 건너뜁니다:', pageInfo.name);
        continue;
    }
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      try {
        await page.goto(`${BASE_URL}${pageInfo.url}`, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(2500);

        const filename = `${pageInfo.name}_${vp.name}.png`;
        const filepath = path.join(outputDir, filename);
        
        await page.screenshot({ path: filepath, fullPage: true });
        console.log(`✔️ 캡처 완료: ${filename}`);
      } catch (e) {
        console.error(`❌ 에러 발생 (${pageInfo.name} - ${vp.name}): ${e.message}`);
      }
    }
  }

  await browser.close();
  await prisma.$disconnect();
  console.log('🎉 캡처가 모두 완료되었습니다!');
  process.exit(0);
}

capture();
