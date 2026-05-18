import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    /** Dev server: reliable React hydration for client components (SW off per PRD). Production build is verified separately. */
    command: 'npm run dev',
    url: baseURL,
    /** Always start a fresh dev server so tests hit the current build (avoids stale :3000). */
    reuseExistingServer: false,
    timeout: 180_000,
  },
})
