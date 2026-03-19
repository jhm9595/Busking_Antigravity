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
  console.log('재캡처(로딩 지연 문제 해결) 봇을 시작합니다...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const outputDir = path.join(__dirname, '..', 'public', 'screenshots');

  // 데모 부트스트랩
  try {
      await page.goto(`${BASE_URL}/explore`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(6000); 
  } catch(e) {}

  let livePerfId = null;
  try {
      const demoPerf = await prisma.performance.findFirst({
          where: { singerId: 'demo-singer-001', status: 'live' },
          orderBy: { startTime: 'desc' }
      });
      if (demoPerf) livePerfId = demoPerf.id;
  } catch (e) {}

  // 문제가 된 화면(로딩이 긴 화면)만 재캡쳐
  const pages = [
    { name: '2_ExploreMap_Demo', url: '/explore' },
    { name: '4_AudienceLiveRoom_Demo', url: livePerfId ? `/live/${livePerfId}` : null }
  ];

  for (const pageInfo of pages) {
    if (!pageInfo.url) {
        console.log('URL이 없어 건너뜁니다:', pageInfo.name);
        continue;
    }

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      try {
        await page.goto(`${BASE_URL}${pageInfo.url}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        console.log(`[대기중] ${pageInfo.name} 데이터와 지도/소켓 UI가 100% 렌더링되도록 12초간 강제 대기...`);
        // 충분한 렌더링 대기 시간 보장 (지도 로딩, 데이터 Fetch 등)
        await page.waitForTimeout(12000); 

        const filename = `${pageInfo.name}_${vp.name}.png`;
        const filepath = path.join(outputDir, filename);
        
        await page.screenshot({ path: filepath, fullPage: true });
        console.log(`✔️ 재캡처 완료 (성공): ${filename}`);
      } catch (e) {
        console.error(`❌ 에러 발생 (${pageInfo.name} - ${vp.name}): ${e.message}`);
      }
    }
  }

  await browser.close();
  await prisma.$disconnect();
  console.log('🎉 덜 찍힌 화면들(지도, 라이브룸)의 고화질 재캡처가 성공적으로 끝났습니다!');
  process.exit(0);
}

capture();
