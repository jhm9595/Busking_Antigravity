const { chromium } = require('playwright');
const readline = require('readline');

async function showError() {
    // 사용자가 화면을 볼 수 있도록 headless: false 로 실행합니다.
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // 데모 데이터를 활성화하기 위해 explore 페이지 먼저 살짝 거침
    await page.goto('http://localhost:3000/explore', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    console.log('에러가 발생한 데모 가수 프로필로 이동합니다...');
    await page.goto('http://localhost:3000/singer/demo-singer-001', { waitUntil: 'domcontentloaded' });
    
    console.log(`\n========================================================`);
    console.log(`🚨 [에러 확인 봇] 사용자 화면에 크롬 브라우저가 열렸습니다.`);
    console.log(`현재 페이지의 우측 하단을 보시면 Next.js 개발 모드의 '2 errors' 오버레이가 띄워져 있을 것입니다!`);
    console.log(`충분히 확인하셨다면 이 터미널에서 엔터를 치시거나, 저(안티그래비티)에게 확인했다고 말씀해 주세요!`);
    console.log(`========================================================\n`);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    // 사용자가 엔터를 치거나 명령을 줄 때까지 무한 대기 (브라우저 열어둠)
    await new Promise(resolve => {
        rl.question('', () => {
            rl.close();
            resolve();
        });
    });

    await browser.close();
    console.log('브라우저를 닫고 스크립트를 종료합니다.');
    process.exit(0);
}

showError();
