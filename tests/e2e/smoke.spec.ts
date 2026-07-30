import { test, expect } from '@playwright/test'

test('scene renders without console errors and canvas is live', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  await page.goto('/')
  await expect(page.locator('canvas')).toBeVisible()
  await page.waitForTimeout(2000)
  await page.screenshot({ path: 'test-results/director-smoke.png' })
  expect(errors).toEqual([])
})
