import { test, expect } from '@playwright/test';
import { mockAuthSuccess, mockAuthFailure } from './helpers/mockApi.js';

test('Get Started opens the registration form', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get Started', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible();
});

test('Sign In opens the login form', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
});

test('a recruiter can register and leaves the auth screen', async ({ page }) => {
  await mockAuthSuccess(page, { role: 'recruiter' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Get Started', exact: true }).click();
  await page.getByPlaceholder('Jane Smith').fill('Riya Recruiter');
  await page.getByPlaceholder('you@example.com').fill('riya@example.com');
  await page.getByPlaceholder('••••••••').fill('password123');
  await page.getByRole('button', { name: 'Recruiter', exact: true }).click();
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Create account' })).toBeHidden();
});

test('login shows an error when the backend rejects credentials', async ({ page }) => {
  await mockAuthFailure(page, 'Invalid email or password');
  await page.goto('/');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await page.getByPlaceholder('you@example.com').fill('wrong@example.com');
  await page.getByPlaceholder('••••••••').fill('badpassword');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByText('Invalid email or password')).toBeVisible();
});
