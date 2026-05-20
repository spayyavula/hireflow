import { test, expect } from '@playwright/test';

// Each public page resolves from its URL and renders a distinct <h1>.
// Headings updated 2026-05-20 to match the laid-off-engineer wedge
// (Option-A rewrite). The previous /career partner/, /everything you
// need to hire/, /the right plan for every team/, /been on both sides
// of the table/, /ideas board/ headings no longer exist.
const pages = [
  { path: '/',         heading: /just got laid off/i },
  { path: '/features', heading: /built for the first 90 days/i },
  { path: '/pricing',  heading: /^pricing$/i },
  { path: '/about',    heading: /built by one engineer/i },
  { path: '/roadmap',  heading: /^roadmap$/i },
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
  // substring-matching unrelated CTAs.
  await page.goto('/');
  await page.getByRole('link', { name: 'Features', exact: true }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: /built for the first 90 days/i }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Pricing', exact: true }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: /^pricing$/i }),
  ).toBeVisible();
});

test('footer exposes Terms, Privacy and Help links', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Terms' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Privacy' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Help' })).toBeVisible();
});
