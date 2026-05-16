import { defineConfig, devices } from '@playwright/test';

// The frontend and backend deploy separately. Point the dev server's app at the
// live backend so blog tests exercise the real read-only API. Auth/onboarding
// tests mock the API via route interception regardless of this URL.
const BACKEND_URL = 'https://hireflow-api.vercel.app';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { VITE_API_URL: BACKEND_URL },
  },
});
