import { test, expect } from '@playwright/test'

test('director → planet → city → content', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('canvas')).toBeVisible()
  // Planet/city nameplates sit inside the ambiently-rotating 3D scene, so their
  // screen coordinates never satisfy Playwright's pointer-stability check (the
  // planet keeps a slow auto-rotate even while focused). dispatchEvent('click')
  // fires the same React onClick handler without depending on a stable hitbox.
  await page.getByRole('button', { name: /professional/i }).dispatchEvent('click')
  await expect(page).toHaveURL(/\/professional$/)
  await page.getByRole('button', { name: /^work/i }).dispatchEvent('click')
  await expect(page).toHaveURL(/\/professional\/work$/)
  await expect(page.getByRole('heading', { name: 'Work' })).toBeVisible()
})

test('direct URL to a hobby renders its panel', async ({ page }) => {
  await page.goto('/hobbies/soccer')
  await expect(page.getByRole('heading', { name: 'Soccer' })).toBeVisible()
  await expect(page.getByText(/first thing I say yes to/i)).toBeVisible()
})

test('blog planet shows the coming-soon panel while empty', async ({ page }) => {
  await page.goto('/blog')
  await expect(page.getByRole('heading', { name: 'Transmissions coming soon' })).toBeVisible()
})

test('HUD About panel opens from any view', async ({ page }) => {
  await page.goto('/hobbies')
  await page.getByRole('button', { name: /vikram/i }).click()
  await expect(page.getByRole('heading', { name: 'About' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'UC Davis' })).toHaveAttribute('href', '/education')
})

test('clicking empty space dismisses the view one level up', async ({ page }) => {
  await page.goto('/professional')
  await expect(page.locator('canvas')).toBeVisible()
  // Bottom-left corner: empty starfield, away from nameplates and HUD chrome.
  await page.mouse.click(40, 680)
  await expect(page).toHaveURL(/\/$/)
})

test('keyboard-only: tab to a planet nameplate and enter', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /education/i }).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/education$/)
  await expect(page.getByRole('heading', { name: 'Education' })).toBeVisible()
})
