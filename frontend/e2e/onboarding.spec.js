import { test, expect } from '@playwright/test';
import { mockAuthSuccess, mockEmptySeekerProfile } from './helpers/mockApi.js';

// Register as a new seeker and land on the onboarding choice screen.
async function registerAsNewSeeker(page) {
  await mockAuthSuccess(page, { role: 'seeker' });
  await mockEmptySeekerProfile(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Get Started', exact: true }).click();
  await page.getByPlaceholder('Jane Smith').fill('Sam Seeker');
  await page.getByPlaceholder('you@example.com').fill('sam@example.com');
  await page.getByPlaceholder('••••••••').fill('password123');
  await page.getByRole('button', { name: 'Job Seeker', exact: true }).click();
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
}

test('a new seeker reaches the onboarding choice screen', async ({ page }) => {
  await registerAsNewSeeker(page);
  await expect(
    page.getByRole('heading', { name: /how would you like to start/i }),
  ).toBeVisible();
});

test('seeker can open the resume-upload path', async ({ page }) => {
  await registerAsNewSeeker(page);
  await page.getByText('Upload Resume').click();
  await expect(
    page.getByRole('heading', { level: 1, name: /upload your resume/i }),
  ).toBeVisible();
});

test('seeker can open the build-from-scratch path', async ({ page }) => {
  await registerAsNewSeeker(page);
  await page.getByText('Build from Scratch').click();
  await expect(
    page.getByRole('heading', { name: /let's build your profile/i }),
  ).toBeVisible();
});
