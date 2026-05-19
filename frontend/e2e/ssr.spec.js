import { test, expect } from '@playwright/test';

// Fetch raw HTML with NO JavaScript execution — this is what crawlers see.
test('homepage HTML contains real body content without JS', async ({ request }) => {
  const res = await request.get('/');
  expect(res.status()).toBe(200);
  const html = await res.text();
  expect(html).toMatch(/<h1[^>]*>/i);
  expect(html.toLowerCase()).toContain('jobssearch');
});

test('homepage HTML embeds Organization and WebSite JSON-LD', async ({ request }) => {
  const html = await (await request.get('/')).text();
  expect(html).toContain('"@type":"Organization"');
  expect(html).toContain('"@type":"WebSite"');
});

test('a job page server-renders body content and a JobPosting blob', async ({ request }) => {
  // Discover a real active job id from the backend the dev server is wired to.
  const apiBase = process.env.VITE_API_URL ?? 'https://hireflow-api.vercel.app';
  let jobs;
  try {
    jobs = await (await request.get(`${apiBase}/api/jobs?limit=1`)).json();
  } catch {
    jobs = [];
  }
  test.skip(!Array.isArray(jobs) || jobs.length === 0, 'no active jobs available to assert against');

  const job = jobs[0];
  const slug = job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const res = await request.get(`/jobs/${slug}-${job.id}`);
  expect(res.status()).toBe(200);
  const html = await res.text();
  expect(html).toContain(job.title);
  expect(html).toContain('"@type":"JobPosting"');
  expect(html).toContain('"directApply":true');
});
