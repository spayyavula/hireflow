import { test, expect } from '@playwright/test';

const BLOG_API = 'https://hireflow-api.vercel.app/api/blog?page=1&per_page=5';
const LIVE_BASE = 'https://hireflow-api.vercel.app';

test('blog list page renders the Pressroom hero', async ({ page }) => {
  await page.goto('/blog');
  await expect(
    page.getByRole('heading', { level: 1, name: /insights for your career journey/i }),
  ).toBeVisible();
});

test('blog list shows a post fetched from the backend', async ({ page, request }) => {
  const res = await request.get(BLOG_API);
  expect(res.ok()).toBeTruthy();
  const posts = await res.json();
  test.skip(posts.length === 0, 'no blog posts published');

  // Proxy the app's /api calls to the live backend so the blog list loads real posts.
  await page.route('/api/**', async (route) => {
    const url = route.request().url().replace(/^https?:\/\/[^/]+\/api/, LIVE_BASE + '/api');
    const response = await request.fetch(url);
    route.fulfill({ response });
  });

  await page.goto('/blog');
  await expect(page.getByText(posts[0].title, { exact: false }).first()).toBeVisible({ timeout: 15000 });
});

test('a blog post page renders content from the backend', async ({ page, request }) => {
  const res = await request.get(BLOG_API);
  expect(res.ok()).toBeTruthy();
  const posts = await res.json();
  test.skip(posts.length === 0, 'no blog posts published');

  const post = posts[0];

  // Proxy the app's /api calls to the live backend so the post page loads real content.
  await page.route('/api/**', async (route) => {
    const url = route.request().url().replace(/^https?:\/\/[^/]+\/api/, LIVE_BASE + '/api');
    const response = await request.fetch(url);
    route.fulfill({ response });
  });

  await page.goto(`/blog/${post.slug}`);
  await expect(
    page.getByRole('heading', { name: post.title }).first(),
  ).toBeVisible({ timeout: 15000 });
});
