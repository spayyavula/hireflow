import { test, expect } from '@playwright/test';

// Live backend base — overridable so the suite can target a local backend.
const LIVE_BASE = process.env.VITE_API_URL ?? 'https://hireflow-api.vercel.app';
const BLOG_API = `${LIVE_BASE}/api/blog?page=1&per_page=5`;

// Proxy the app's relative /api calls to the live backend, so blog pages load
// real posts regardless of how the dev server received VITE_API_URL.
async function proxyApiToLive(page, request) {
  await page.route('/api/**', async (route) => {
    const url = route
      .request()
      .url()
      .replace(/^https?:\/\/[^/]+\/api/, `${LIVE_BASE}/api`);
    const response = await request.fetch(url);
    await route.fulfill({ response });
  });
}

test('blog list page renders the Pressroom hero', async ({ page }) => {
  // No proxy needed: the hero <h1> is static markup, independent of the API.
  await page.goto('/blog');
  await expect(
    page.getByRole('heading', { level: 1, name: /insights for your career journey/i }),
  ).toBeVisible();
});

test('blog list shows a post fetched from the backend', async ({ page, request }) => {
  const res = await request.get(BLOG_API);
  expect(res.ok(), `GET ${BLOG_API} failed with ${res.status()}`).toBeTruthy();
  const posts = await res.json();
  test.skip(posts.length === 0, 'no blog posts published');

  await proxyApiToLive(page, request);
  await page.goto('/blog');
  await expect(
    page.getByText(posts[0].title, { exact: false }).first(),
  ).toBeVisible({ timeout: 15000 });
});

test('a blog post page renders content from the backend', async ({ page, request }) => {
  const res = await request.get(BLOG_API);
  expect(res.ok(), `GET ${BLOG_API} failed with ${res.status()}`).toBeTruthy();
  const posts = await res.json();
  test.skip(posts.length === 0, 'no blog posts published');

  const post = posts[0];
  await proxyApiToLive(page, request);
  await page.goto(`/blog/${post.slug}`);
  await expect(
    page.getByRole('heading', { name: post.title }).first(),
  ).toBeVisible({ timeout: 15000 });
});
