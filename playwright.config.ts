import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  // Each test boots a full WebGL scene on a software rasterizer; more parallel
  // workers than this starves the frame loop and produces timeout flakes.
  workers: 2,
  expect: { timeout: 15_000 },
  use: { baseURL: 'http://localhost:3100' },
  webServer: {
    command: 'npm run build && npx serve out -l 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
