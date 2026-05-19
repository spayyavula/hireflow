import { describe, it, expect } from 'vitest';
import { urlsetXml, sitemapIndexXml, deriveHubEntries } from './sitemap';

describe('urlsetXml', () => {
  it('builds a urlset with loc entries', () => {
    const xml = urlsetXml([
      { loc: 'https://jobssearch.work/' },
      { loc: 'https://jobssearch.work/features' },
    ]);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain('<loc>https://jobssearch.work/</loc>');
    expect(xml).toContain('<loc>https://jobssearch.work/features</loc>');
    expect(xml.trim().endsWith('</urlset>')).toBe(true);
  });
  it('escapes ampersands in loc URLs', () => {
    const xml = urlsetXml([{ loc: 'https://jobssearch.work/jobs?a=1&b=2' }]);
    expect(xml).toContain('a=1&amp;b=2');
    expect(xml).not.toContain('a=1&b=2');
  });
});

describe('sitemapIndexXml', () => {
  it('builds a sitemap index referencing child sitemaps', () => {
    const xml = sitemapIndexXml([
      'https://jobssearch.work/sitemap-static.xml',
      'https://jobssearch.work/sitemap-jobs.xml',
    ]);
    expect(xml).toContain('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain('<loc>https://jobssearch.work/sitemap-static.xml</loc>');
    expect(xml.trim().endsWith('</sitemapindex>')).toBe(true);
  });
});

describe('deriveHubEntries', () => {
  const jobs = (n, props) => Array.from({ length: n }, (_, i) => ({
    id: `job_${i}`, title: 't', required_skills: [], nice_skills: [], remote: false, location: '', ...props,
  }));
  it('emits a hub only when >=5 active jobs match', () => {
    const data = [
      ...jobs(5, { required_skills: ['React'] }),
      ...jobs(3, { required_skills: ['Vue'] }),
    ];
    const paths = deriveHubEntries(data);
    expect(paths).toContain('/jobs/react');
    expect(paths).not.toContain('/jobs/vue');
  });
  it('emits the remote hub when >=5 remote jobs exist', () => {
    const paths = deriveHubEntries(jobs(6, { remote: true }));
    expect(paths).toContain('/jobs/remote');
  });
  it('emits a location hub when >=5 jobs share a city', () => {
    const paths = deriveHubEntries(jobs(5, { location: 'Austin, TX' }));
    expect(paths).toContain('/jobs/location/austin-tx');
  });
});
