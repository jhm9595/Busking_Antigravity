const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const BASE_URL = 'http://localhost:3000';
const SINGER_ID = 'user_38Mwh293kkUWLJVgJNO4OOuFy6m'; 

// 캡처할 페이지 목록
const pages = [
  { name: '1_Home', url: '/' },
  { name: '2_ExploreMap', url: '/explore' },
  { name: '3_SingerProfile', url: `/singer/${SINGER_ID}` },
  { name: '4_SingerDashboard_Auth', url: '/singer/dashboard' },
  { name: '5_LiveManage_Auth', url: '/live/manage' }
];

const viewports = [
  { name: 'PC', width: 1280, height: 800 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Mobile', width: 375, height: 812 }
];

async function capture() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const outputDir = path.join(__dirname, '..', 'public', 'screenshots');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`\n========================================================`);
  console.log(`🚀 [자동화 봇 실행] 사용자의 화면에 크롬 브라우저가 열렸습니다.`);
  console.log(`⚠️ 지금 열린 창에서 직접 로그인을 진행해 주세요.`);
  console.log(`========================================================\n`);
  
  // 로그인 페이지로 이동
  await page.goto(`${BASE_URL}/sign-in`);
  
  console.log('⏳ [봇 대기중] 로그인이 완료되면 여기서 엔터(Enter) 키를 누르시거나, 안티그래비티에게 "로그인 완료!"라고 말씀해주세요.');

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
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      try {
        await page.goto(`${BASE_URL}${pageInfo.url}`, { waitUntil: 'networkidle', timeout: 15000 });
        // 데이터 로드를 위한 여유 시간 대기
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
  console.log('🎉 모든 유저/해상도별 캡처가 성공적으로 끝났습니다!');
  process.exit(0);
}

capture();
