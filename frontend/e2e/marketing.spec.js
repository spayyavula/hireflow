import { test, expect } from '@playwright/test';

// Each public page resolves from its URL (App() seeds currentPage via
// getPageFromPath) and renders a distinct <h1>.
const pages = [
  { path: '/',         heading: /career partner/i },
  { path: '/features', heading: /everything you need to hire and get hired/i },
  { path: '/pricing',  heading: /the right plan for every team/i },
  { path: '/about',    heading: /been on both sides of the table/i },
  { path: '/roadmap',  heading: /ideas board/i },
];

for (const { path, heading } of pages) {
  test(`${path} renders its hero heading`, async ({ page }) => {
    await page.goto(path);
    await expect(
      page.getByRole('heading', { level: 1, name: heading }),
    ).toBeVisible();
  });
}

test('top-nav links navigate between marketing pages', async ({ page }) => {
  // PublicNav renders nav items as <a> links (role "link"). exact:true avoids
  // substring-matching unrelated CTAs like the body's "See Features" button.
  await page.goto('/');
  await page.getByRole('link', { name: 'Features', exact: true }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: /everything you need to hire/i }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Pricing', exact: true }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: /the right plan for every team/i }),
  ).toBeVisible();
});

test('footer exposes Terms, Privacy and Help links', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Terms' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Privacy' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Help' })).toBeVisible();
});
