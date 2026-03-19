const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000';

const viewports = [
  { name: 'PC', width: 1280, height: 800 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Mobile', width: 375, height: 812 }
];

async function capture() {
  console.log('새로 업데이트된 데모 모드를 기반으로 전 자동 캡처를 시작합니다...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const outputDir = path.join(__dirname, '..', 'public', 'screenshots');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 데모 데이터 부트스트랩을 위해 /explore를 먼저 방문
  try {
      await page.goto(`${BASE_URL}/explore`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(4000); // 데모 생성 대기
  } catch(e) {}

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

  // 캡처할 페이지 목록
  const pages = [
    { name: '1_Home', url: '/' },
    { name: '2_ExploreMap_Demo', url: '/explore' },
    { name: '3_SingerProfile_Demo', url: `/singer/${SINGER_ID}` },
    { name: '4_AudienceLiveRoom_Demo', url: livePerfId ? `/live/${livePerfId}` : '/explore' }
  ];

  for (const pageInfo of pages) {
    if (pageInfo.name.includes('LiveRoom') && !livePerfId) {
        console.log('라이브 방 정보가 없어 건너뜁니다:', pageInfo.name);
        continue;
    }
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      try {
        await page.goto(`${BASE_URL}${pageInfo.url}`, { waitUntil: 'domcontentloaded' });
        // 데이터 로드를 위한 충분한 여유 시간
        await page.waitForTimeout(3000);

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
  console.log('🎉 캡처가 모두 안전하게 완료되었습니다!');
  process.exit(0);
}

capture();
