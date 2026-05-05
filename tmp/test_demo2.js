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

      console.log('2. Clicking "Try Demo" via evaluation...');
      await page.evaluate(() => {
          // Find the span containing the button text and click its parent Link
          const spans = Array.from(document.querySelectorAll('span'));
          const btnSpan = spans.find(s => s.textContent.includes('데모 체험하기') || s.textContent.includes('Try Demo'));
          if (btnSpan && btnSpan.closest('a')) {
              btnSpan.closest('a').click();
          } else {
              console.log('Button not found via querySelector');
          }
      });
      
      console.log('3. Waiting 5s for navigation & redirects...');
      await page.waitForTimeout(5000);

      console.log('4. Final URL:', page.url());

      // Attempt to find any visible error text
      const bodyText = await page.evaluate(() => document.body.innerText);
      events.push(`[BODY SNIPPET]\n${bodyText.substring(0, 300)}...`);

  } catch (error) {
      console.error('Error during test:', error);
  }

  console.log('\n--- Event Logs ---');
  events.forEach(e => console.log(e));

  await browser.close();
}

testDemoFlow();
