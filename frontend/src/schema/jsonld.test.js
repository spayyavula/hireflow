import { describe, it, expect } from 'vitest';
import { jobPosting, organization, website, breadcrumbList, employmentType, validThrough } from './jsonld';

const SAMPLE = {
  id: 'job_abc123def456',
  title: 'Senior React Developer',
  company_name: 'TechVault',
  location: 'San Francisco, CA',
  description: 'Lead frontend architecture.',
  type: 'full-time',
  remote: true,
  salary_min: 160000,
  salary_max: 200000,
  created_at: '2026-03-01T00:00:00Z',
  required_skills: ['React'],
  nice_skills: ['Next.js'],
  status: 'active',
};

describe('employmentType', () => {
  it('maps backend job types to schema.org enums', () => {
    expect(employmentType('full-time')).toBe('FULL_TIME');
    expect(employmentType('part-time')).toBe('PART_TIME');
    expect(employmentType('contract')).toBe('CONTRACTOR');
    expect(employmentType('internship')).toBe('INTERN');
  });
  it('falls back to FULL_TIME for unknown types', () => {
    expect(employmentType('weird')).toBe('FULL_TIME');
  });
});

describe('validThrough', () => {
  it('derives created_at + 60 days as an ISO string', () => {
    expect(validThrough('2026-03-01T00:00:00Z')).toBe('2026-04-30T00:00:00.000Z');
  });
});

describe('jobPosting', () => {
  it('builds a JobPosting with required fields', () => {
    const ld = jobPosting(SAMPLE);
    expect(ld['@type']).toBe('JobPosting');
    expect(ld.title).toBe('Senior React Developer');
    expect(ld.datePosted).toBe('2026-03-01T00:00:00Z');
    expect(ld.validThrough).toBe('2026-04-30T00:00:00.000Z');
    expect(ld.employmentType).toBe('FULL_TIME');
    expect(ld.hiringOrganization).toEqual({ '@type': 'Organization', name: 'TechVault' });
    expect(ld.jobLocationType).toBe('TELECOMMUTE');
    expect(ld.directApply).toBe(true);
    expect(ld.baseSalary.value.minValue).toBe(160000);
    expect(ld.baseSalary.value.maxValue).toBe(200000);
  });
  it('omits baseSalary when both bounds are absent', () => {
    const ld = jobPosting({ ...SAMPLE, salary_min: null, salary_max: null });
    expect(ld.baseSalary).toBeUndefined();
  });
  it('omits jobLocationType when not remote', () => {
    const ld = jobPosting({ ...SAMPLE, remote: false });
    expect(ld.jobLocationType).toBeUndefined();
  });
});

describe('organization / website', () => {
  it('organization has a stable @id', () => {
    expect(organization()['@id']).toBe('https://hyrly.ai/#organization');
  });
  it('website includes a SearchAction', () => {
    expect(website().potentialAction['@type']).toBe('SearchAction');
  });
});

describe('breadcrumbList', () => {
  it('numbers positions from 1', () => {
    const ld = breadcrumbList([
      { name: 'Home', url: 'https://hyrly.ai/' },
      { name: 'Jobs', url: 'https://hyrly.ai/jobs' },
    ]);
    expect(ld['@type']).toBe('BreadcrumbList');
    expect(ld.itemListElement[0].position).toBe(1);
    expect(ld.itemListElement[1].position).toBe(2);
    expect(ld.itemListElement[1].item).toBe('https://hyrly.ai/jobs');
  });
});

import { itemList, faqPage } from './jsonld';

describe('itemList', () => {
  it('wraps jobs as an ItemList of JobPostings, positioned from 1', () => {
    const jobs = [
      { id: 'job_a', title: 'A', company_name: 'X', location: 'NYC', description: 'd', type: 'full-time', remote: false, created_at: '2026-03-01T00:00:00Z', required_skills: [], nice_skills: [] },
      { id: 'job_b', title: 'B', company_name: 'Y', location: 'LA', description: 'd', type: 'contract', remote: true, created_at: '2026-03-01T00:00:00Z', required_skills: [], nice_skills: [] },
    ];
    const ld = itemList(jobs);
    expect(ld['@type']).toBe('ItemList');
    expect(ld.itemListElement).toHaveLength(2);
    expect(ld.itemListElement[0].position).toBe(1);
    expect(ld.itemListElement[0].item['@type']).toBe('JobPosting');
    expect(ld.itemListElement[1].position).toBe(2);
  });
});

describe('faqPage', () => {
  it('builds a FAQPage from q/a pairs', () => {
    const ld = faqPage([{ q: 'Question?', a: 'Answer.' }]);
    expect(ld['@type']).toBe('FAQPage');
    expect(ld.mainEntity[0]['@type']).toBe('Question');
    expect(ld.mainEntity[0].name).toBe('Question?');
    expect(ld.mainEntity[0].acceptedAnswer.text).toBe('Answer.');
  });
});
