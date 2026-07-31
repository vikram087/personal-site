import { test, expect } from '@playwright/test'

test('scene renders without console errors and canvas is live', async ({ page }) => {
  test.setTimeout(90_000)
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  await page.goto('/')
  await expect(page.locator('canvas')).toBeVisible()
  // The loading overlay must fully hand off: it stays up through texture
  // load + first rendered frame, then fades and unmounts. Headless software
  // WebGL renders those first frames very slowly, hence the long timeout.
  await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 60_000 })
  await page.waitForTimeout(2000)
  await page.screenshot({ path: 'test-results/director-smoke.png' })
  expect(errors).toEqual([])
})
