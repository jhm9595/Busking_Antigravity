// @ts-nocheck
import { expect, test } from '@playwright/test'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

async function forceEnglish(page) {
  await page.addInitScript(() => {
    localStorage.setItem('app-language', 'en')
  })
}

async function createDemoSession(request) {
  const response = await request.post(`${APP_URL}/api/demo`, {
    data: { action: 'reset' }
  })

  expect(response.status(), 'POST /api/demo must return 200 for demo mode bootstrap').toBe(200)
  const body = await response.json()

  expect(body?.singerId, 'demo response should include singerId').toBeTruthy()
  expect(Array.isArray(body?.performanceIds), 'demo response should include performanceIds[]').toBeTruthy()
  expect(body?.performanceIds?.length, 'demo response should include exactly 3 performance IDs').toBe(3)
  expect(body?.generatedAt, 'demo response should include generatedAt').toBeTruthy()

  return body
}

async function switchToListView(page) {
  await page.getByRole('button', { name: /list/i }).click()
}

test.describe('demo mode smoke', () => {
  test('landing page exposes a Try Demo CTA', async ({ page }) => {
    await forceEnglish(page)
    await page.goto(APP_URL)

    await expect(page.getByRole('link', { name: /try demo/i })).toBeVisible()
  })

  test('anonymous explore auto-bootstraps demo data', async ({ page }) => {
    await forceEnglish(page)
    await page.goto(`${APP_URL}/explore?demo=1`)

    await expect(page.getByText(/demo mode/i)).toBeVisible()
    await switchToListView(page)

    await expect(page.getByText(/live now/i)).toHaveCount(1)
    await expect(page.getByText(/scheduled/i)).toHaveCount(2)
  })

  test('clicking Try Demo should navigate to populated explore', async ({ page }) => {
    await forceEnglish(page)
    await page.goto(APP_URL)

    await page.getByRole('link', { name: /try demo/i }).click()
    await expect(page).toHaveURL(/\/explore/)
    await expect(page.getByText(/demo mode/i)).toBeVisible()
    await switchToListView(page)

    await expect(page.getByText(/live now/i)).toHaveCount(1)
    await expect(page.getByText(/scheduled/i)).toHaveCount(2)
  })

  test('performance times render in KST consistently across browser timezones', async ({ browser, request }) => {
    await createDemoSession(request)

    const seoulContext = await browser.newContext({ timezoneId: 'Asia/Seoul' })
    const laContext = await browser.newContext({ timezoneId: 'America/Los_Angeles' })

    try {
      const seoulPage = await seoulContext.newPage()
      const laPage = await laContext.newPage()

      await forceEnglish(seoulPage)
      await forceEnglish(laPage)

      await seoulPage.goto(`${APP_URL}/explore?demo=1`)
      await laPage.goto(`${APP_URL}/explore?demo=1`)

      await switchToListView(seoulPage)
      await switchToListView(laPage)

      await expect(seoulPage.getByText(/live now/i)).toHaveCount(1)
      await expect(laPage.getByText(/live now/i)).toHaveCount(1)

      const seoulTimes = await seoulPage.locator('span.font-mono').allTextContents()
      const laTimes = await laPage.locator('span.font-mono').allTextContents()

      expect(seoulTimes.length, 'explore should show demo performance times').toBeGreaterThanOrEqual(3)
      expect(laTimes.length, 'explore should show demo performance times').toBeGreaterThanOrEqual(3)

      for (const time of seoulTimes.slice(0, 3)) {
        expect(time, 'KST labels should include timezone marker').toMatch(/KST|UTC\+9|UTC\+09:00|GMT\+9/i)
      }

      expect(laTimes.slice(0, 3), 'KST display should not vary by browser timezone').toEqual(seoulTimes.slice(0, 3))
    } finally {
      await seoulContext.close()
      await laContext.close()
    }
  })

  test('demo mode reset control refreshes seeded fixtures', async ({ page, request }) => {
    await createDemoSession(request)
    await forceEnglish(page)
    await page.goto(`${APP_URL}/explore?demo=1`)
    await switchToListView(page)

    const beforeRes = await request.get(`${APP_URL}/api/performances`)
    expect(beforeRes.ok()).toBeTruthy()
    const beforeRows = await beforeRes.json()
    const beforeDemoIds = beforeRows.filter((row) => row.singerId === 'demo-singer-001').map((row) => row.id)

    const resetButton = page.getByRole('button', { name: /reset demo/i })
    await expect(resetButton).toBeVisible()
    await resetButton.click()
    await expect(page.getByRole('button', { name: /resetting/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /reset demo/i })).toBeVisible()

    await expect(page.getByText(/live now/i)).toHaveCount(1)
    await expect(page.getByText(/scheduled/i)).toHaveCount(2)

    const afterRes = await request.get(`${APP_URL}/api/performances`)
    expect(afterRes.ok()).toBeTruthy()
    const afterRows = await afterRes.json()
    const afterDemoIds = afterRows.filter((row) => row.singerId === 'demo-singer-001').map((row) => row.id)

    expect(afterDemoIds.length).toBe(3)
    expect(afterDemoIds).not.toEqual(beforeDemoIds)
  })
})
