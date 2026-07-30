import { test, expect } from '@playwright/test'

test('no WebGL → fallback notice with index link, content still reachable', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    HTMLCanvasElement.prototype.getContext = function (type: string, ...args: any[]) {
      if (typeof type === 'string' && type.includes('webgl')) return null
      return original.call(this, type, ...args)
    }
  })
  await page.goto('/')
  await expect(page.getByText(/3D unavailable/i)).toBeVisible()
  await page.getByRole('link', { name: /destination index/i }).click()
  await expect(page.getByRole('heading', { name: /all destinations/i })).toBeVisible()
  await page.getByRole('link', { name: 'Soccer' }).click()
  await expect(page.getByRole('heading', { name: 'Soccer' })).toBeVisible()
})
