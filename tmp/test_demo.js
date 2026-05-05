const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testDemoFlow() {
  console.log('Testing Try Demo Flow...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const events = [];
  page.on('console', msg => events.push(`[CONSOLE] ${msg.type()}: ${msg.text()}`));
  page.on('response', response => {
      // log redirect headers or failed requests
      if (response.status() >= 400 || [301, 302, 307, 308].includes(response.status())) {
          events.push(`[NETWORK] ${response.status()} ${response.url()}`);
          if (response.headers()['location']) {
              events.push(`   -> redirected to: ${response.headers()['location']}`);
          }
      }
  });

  try {
      console.log('1. Navigating to Home...');
      await page.goto('http://localhost:3000/');
      await page.waitForTimeout(2000);

      // Find the "Try Demo" button. Text might be localized '데모 체험하기' or 'Try Demo'
      const demoBtn = page.locator('a, button').filter({ hasText: /데모 체험하기|Try Demo/ }).first();
      
      console.log('2. Clicking "Try Demo" button...');
      await demoBtn.click();
      
      console.log('3. Waiting 5s for navigation & redirects...');
      await page.waitForTimeout(5000);

      console.log('4. Final URL:', page.url());

      // Try capturing a screenshot of the final page
      const filepath = path.join(__dirname, '..', 'public', 'screenshots', 'test_demo_flow_result.png');
      await page.screenshot({ path: filepath });
      console.log(`Saved screenshot to ${filepath}`);

  } catch (error) {
      console.error('Error during test:', error);
  }

  console.log('\n--- Event Logs ---');
  events.forEach(e => console.log(e));

  await browser.close();
}

testDemoFlow();
