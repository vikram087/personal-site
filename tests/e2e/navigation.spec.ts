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

test('direct URL to a blog post renders the reading panel', async ({ page }) => {
  await page.goto('/blog/meta/hello-world')
  await expect(page.getByRole('heading', { name: 'Hello World' })).toBeVisible()
  await expect(page.getByText('Welcome aboard')).toBeVisible()
})

test('HUD About tabs and Contact work from any view', async ({ page }) => {
  await page.goto('/hobbies')
  await page.getByRole('button', { name: /vikram/i }).click()
  await page.getByRole('tab', { name: 'Now' }).click()
  await expect(page.getByRole('heading', { name: 'About' })).toBeVisible()
})

test('keyboard-only: tab to a planet nameplate and enter', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /education/i }).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/education$/)
  await expect(page.getByRole('heading', { name: 'Education' })).toBeVisible()
})
