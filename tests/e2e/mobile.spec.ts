import { test, expect } from '@playwright/test'

const VIEWPORT = { width: 390, height: 844 }
test.use({ viewport: VIEWPORT })

// The camera eases toward its fitted position; give the damping time to settle.
const CAMERA_SETTLE_MS = 3500

test('starmap shows every destination nameplate within the viewport', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.nameplate').first()).toBeVisible({ timeout: 15_000 })
  await page.waitForTimeout(CAMERA_SETTLE_MS)

  const plates = page.locator('.nameplate')
  const count = await plates.count()
  expect(count).toBeGreaterThanOrEqual(5) // education, professional, hobbies, blog, tower

  for (let i = 0; i < count; i++) {
    const box = await plates.nth(i).boundingBox()
    expect(box, `nameplate ${i} should render`).not.toBeNull()
    expect(box!.x, `nameplate ${i} left edge`).toBeGreaterThanOrEqual(0)
    expect(box!.y, `nameplate ${i} top edge`).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width, `nameplate ${i} right edge`).toBeLessThanOrEqual(VIEWPORT.width)
    expect(box!.y + box!.height, `nameplate ${i} bottom edge`).toBeLessThanOrEqual(VIEWPORT.height)
    expect(box!.height, `nameplate ${i} tap height`).toBeGreaterThanOrEqual(44)
  }
})

test('header buttons do not overlap the panel title on a content route', async ({ page }) => {
  await page.goto('/professional/work')
  const title = page.locator('.panel-header h1')
  await expect(title).toBeVisible()

  const navBox = await page.locator('nav[aria-label="Site controls"]').boundingBox()
  const titleBox = await title.boundingBox()
  expect(navBox).not.toBeNull()
  expect(titleBox).not.toBeNull()

  const intersects =
    navBox!.x < titleBox!.x + titleBox!.width &&
    navBox!.x + navBox!.width > titleBox!.x &&
    navBox!.y < titleBox!.y + titleBox!.height &&
    navBox!.y + navBox!.height > titleBox!.y
  expect(intersects, 'hud nav must not overlap panel title').toBe(false)
})

test('panel close button is right-aligned, tappable, and routes one level up', async ({ page }) => {
  await page.goto('/professional/work')
  const close = page.getByRole('button', { name: 'Close Work' })
  await expect(close).toBeVisible()

  const closeBox = await close.boundingBox()
  const titleBox = await page.locator('.panel-header h1').boundingBox()
  expect(closeBox).not.toBeNull()
  expect(titleBox).not.toBeNull()
  expect(closeBox!.height, 'close tap height').toBeGreaterThanOrEqual(44)
  // Right-justified: button sits at the header's right edge, past the title.
  expect(closeBox!.x, 'close sits right of the title').toBeGreaterThan(titleBox!.x + titleBox!.width)
  expect(closeBox!.x + closeBox!.width, 'close near right edge').toBeGreaterThan(VIEWPORT.width - 60)

  await close.click()
  await expect(page).toHaveURL(/\/professional$/)
})
