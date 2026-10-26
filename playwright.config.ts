import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end tests against a running stack (`npm run infra:up && npm run dev`),
 * or any deployment via E2E_BASE_URL. Admin tests run when E2E_ADMIN_EMAIL and
 * E2E_ADMIN_PASSWORD are set.
 */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testIgnore: /admin/ },
  ],
})
