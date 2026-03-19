const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000';

const deviceList = [
  { name: 'PC', config: devices['Desktop Chrome'] },
  { name: 'Tablet', config: devices['iPad Pro 11'] },
  { name: 'Mobile', config: devices['iPhone 13'] }
];

async function capture() {
  console.log('에러 수정 완료! 모든 스크린샷 초기화 후 완벽한 모바일/태블릿/PC 에뮬레이션 캡처 봇을 시작합니다...');
  
  const browser = await chromium.launch({ headless: true });
  
  const outputDir = path.join(__dirname, '..', 'public', 'screenshots');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const SINGER_ID = 'demo-singer-001';

  for (const { name: vpName, config } of deviceList) {
    const context = await browser.newContext(config);
    const page = await context.newPage();

    // 부트스트랩을 위해 한 번 거침
    try {
        await page.goto(`${BASE_URL}/explore`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000); 
    } catch(e) {}

    let livePerfId = null;
    try {
        const demoPerf = await prisma.performance.findFirst({
            where: { singerId: SINGER_ID, status: 'live' },
            orderBy: { startTime: 'desc' }
        });
        if (demoPerf) livePerfId = demoPerf.id;
    } catch (e) {}

    try {
        await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);
        await page.screenshot({ path: path.join(outputDir, `1_Home_Demo_${vpName}.png`), fullPage: true });
        console.log(`✔️ 1_Home 캡처 (${vpName})`);
    } catch(e) { console.error(e) }

    try {
        await page.goto(`${BASE_URL}/explore`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(4000); // 맵 로딩 대기
        await page.screenshot({ path: path.join(outputDir, `2_ExploreMap_Demo_${vpName}.png`), fullPage: true });
        console.log(`✔️ 2_ExploreMap 캡처 (${vpName})`);
    } catch(e) { console.error(e) }

    try {
        await page.goto(`${BASE_URL}/singer/${SINGER_ID}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);
        await page.screenshot({ path: path.join(outputDir, `3_SingerProfile_Demo_${vpName}.png`), fullPage: true });
        console.log(`✔️ 3_SingerProfile 캡처 (${vpName})`);

        // 예약(Booking) 팝업 열기
        // .sticky.top-20 안의 두 번째 버튼 클릭
        const bookingBtn = page.locator('.sticky.top-20 button').nth(1);
        if (await bookingBtn.count() > 0) {
            await bookingBtn.click({ force: true });
            await page.waitForTimeout(1000);
            await page.screenshot({ path: path.join(outputDir, `3.1_BookingModal_Demo_${vpName}.png`), fullPage: true });
            console.log(`✔️ 3.1_BookingModal 팝업 캡처 (${vpName})`);
        }
    } catch(e) { console.error(e) }

    if (livePerfId) {
        try {
            await page.goto(`${BASE_URL}/live/${livePerfId}`, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(8000); // 라이브 페이지 풀 렌더를 위해 대기
            await page.screenshot({ path: path.join(outputDir, `4_AudienceLiveRoom_Demo_${vpName}.png`), fullPage: true });
            console.log(`✔️ 4_AudienceLive 캡처 (${vpName})`);

            // 곡 신청 팝업 열기
            const reqBtn = page.locator('button:has(.lucide-music)').first();
            if (await reqBtn.count() > 0) {
                await reqBtn.click({ force: true });
                await page.waitForTimeout(1000);
                await page.screenshot({ path: path.join(outputDir, `4.1_SongRequestModal_Demo_${vpName}.png`), fullPage: true });
                console.log(`✔️ 4.1_SongRequestModal 팝업 캡처 (${vpName})`);
                await page.keyboard.press('Escape'); // 모달 닫기
                await page.waitForTimeout(500);
            }

            // 포인트 충전 모달(현재 Mobile UI에만 버튼이 표시됨)
            if (vpName === 'Mobile') {
                const chargeBtn = page.locator('.sm\\:hidden button').first();
                if (await chargeBtn.count() > 0) {
                    await chargeBtn.click({ force: true });
                    await page.waitForTimeout(1000);
                    await page.screenshot({ path: path.join(outputDir, `4.2_PointChargeModal_Demo_${vpName}.png`), fullPage: true });
                    console.log(`✔️ 4.2_PointChargeModal 팝업 캡처 (${vpName})`);
                }
            }
        } catch(e) { console.error(e) }
    }

    await context.close();
  }

  await browser.close();
  await prisma.$disconnect();
  console.log('🎉 에뮬레이션 기반 전체 캡처가 모두 안전하게 완료되었습니다!');
  process.exit(0);
}

capture();
