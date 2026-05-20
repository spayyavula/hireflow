import { describe, it, expect } from 'vitest';
import { getArticles, getArticleBySlug } from './playbookContent';

describe('playbookContent loader', () => {
  it('returns the H-1B seed article in the article list', () => {
    const articles = getArticles();
    const h1b = articles.find((a) => a.slug === 'h1b-60-day-grace-period');
    expect(h1b).toBeTruthy();
    expect(h1b.title).toMatch(/H-1B 60-Day/);
    expect(h1b.dek).toBeTypeOf('string');
    expect(h1b.dek.length).toBeGreaterThan(0);
    expect(h1b.published_at).toBe('2026-05-20');
    expect(h1b.eta_min).toBe(9);
  });

  it('sorts articles recent-first by published_at', () => {
    const articles = getArticles();
    for (let i = 1; i < articles.length; i++) {
      expect(articles[i - 1].published_at >= articles[i].published_at).toBe(true);
    }
  });

  it('getArticleBySlug returns the article with rendered HTML body', () => {
    const a = getArticleBySlug('h1b-60-day-grace-period');
    expect(a).toBeTruthy();
    expect(a.slug).toBe('h1b-60-day-grace-period');
    expect(a.html).toBeTypeOf('string');
    expect(a.html.length).toBeGreaterThan(1000);
    expect(a.html).toMatch(/<h2[^>]*>What the 60-day rule actually says/);
    expect(a.html).toMatch(/<strong>This is not legal advice/);
    expect(a.html).not.toContain('{{SITE}}');
    expect(a.html).toMatch(/https:\/\/hyrly\.ai\//);
  });

  it('getArticleBySlug returns null for unknown slug', () => {
    expect(getArticleBySlug('does-not-exist')).toBeNull();
  });

  it('every article has the required frontmatter fields', () => {
    for (const a of getArticles()) {
      expect(a.title).toBeTypeOf('string');
      expect(a.slug).toBeTypeOf('string');
      expect(a.published_at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(a.eta_min).toBeTypeOf('number');
      expect(Array.isArray(a.keywords)).toBe(true);
    }
  });
});
