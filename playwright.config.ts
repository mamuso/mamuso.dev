import { defineConfig } from '@playwright/test'

const port = Number(process.env.SMOKE_TEST_PORT || 3103)

export default defineConfig({
  testDir: './e2e',
  forbidOnly: !!process.env.CI,
  workers: 1,
  // Lets CI shards split individual tests rather than whole files.
  fullyParallel: true,
  retries: 0,
  // Stop before the CI job limit so the report still prints and uploads.
  globalTimeout: process.env.CI ? 15 * 60_000 : 0,
  // Includes browser-context setup, which can be slow after software WebGL on CI.
  // Individual assertions keep their existing 15-second budget.
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { open: 'never' }], ...(process.env.CI ? [['github'] as const] : [])],
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 900 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: {
    command: `pnpm start --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
    timeout: 30_000,
  },
})
