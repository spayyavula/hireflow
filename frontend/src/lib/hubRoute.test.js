import { describe, it, expect } from 'vitest';
import { parseHubPath, hubSlug, hubUrlPath, hubLabel, jobMatchesHub } from './hubRoute';

describe('parseHubPath', () => {
  it('parses every supported hub shape', () => {
    expect(parseHubPath('remote')).toEqual({ skill: null, city: null, remote: true });
    expect(parseHubPath('react')).toEqual({ skill: 'react', city: null, remote: false });
    expect(parseHubPath('location/austin')).toEqual({ skill: null, city: 'austin', remote: false });
    expect(parseHubPath('react/remote')).toEqual({ skill: 'react', city: null, remote: true });
    expect(parseHubPath('react/location/austin')).toEqual({ skill: 'react', city: 'austin', remote: false });
  });
  it('rejects job-detail paths and garbage', () => {
    expect(parseHubPath('senior-react-dev-job_abc123')).toBeNull();
    expect(parseHubPath('a/b/c/d')).toBeNull();
    expect(parseHubPath('location')).toBeNull();
    expect(parseHubPath('')).toBeNull();
  });
});

describe('hubSlug / hubUrlPath', () => {
  it('round-trips a descriptor', () => {
    const d = { skill: 'react', city: 'austin', remote: false };
    expect(hubSlug(d)).toBe('react/location/austin');
    expect(hubUrlPath(d)).toBe('/jobs/react/location/austin');
  });
  it('builds remote and skill+remote slugs', () => {
    expect(hubSlug({ skill: null, city: null, remote: true })).toBe('remote');
    expect(hubSlug({ skill: 'python', city: null, remote: true })).toBe('python/remote');
  });
});

describe('hubLabel', () => {
  it('reads naturally', () => {
    expect(hubLabel({ skill: 'react', city: 'austin', remote: false })).toBe('React jobs in Austin');
    expect(hubLabel({ skill: null, city: null, remote: true })).toBe('Remote jobs');
  });
});

describe('jobMatchesHub', () => {
  const job = { required_skills: ['React', 'TypeScript'], nice_skills: ['Next.js'], remote: true, location: 'Austin, TX' };
  it('matches on skill, remote, and city', () => {
    expect(jobMatchesHub(job, { skill: 'react', city: null, remote: false })).toBe(true);
    expect(jobMatchesHub(job, { skill: 'react', city: null, remote: true })).toBe(true);
    expect(jobMatchesHub(job, { skill: 'react', city: 'austin', remote: false })).toBe(true);
    expect(jobMatchesHub(job, { skill: 'python', city: null, remote: false })).toBe(false);
    expect(jobMatchesHub(job, { skill: null, city: 'denver', remote: false })).toBe(false);
  });
});

describe('hubRoute edge cases', () => {
  it('parseHubPath rejects a remote-then-skill ordering', () => {
    expect(parseHubPath('remote/react')).toBeNull();
  });
  it('hubLabel handles a skill-only descriptor and the bare fallback', () => {
    expect(hubLabel({ skill: 'python', city: null, remote: false })).toBe('Python jobs');
    expect(hubLabel({ skill: null, city: null, remote: false })).toBe('jobs');
  });
  it('jobMatchesHub rejects a non-remote job for a remote hub', () => {
    expect(jobMatchesHub({ remote: false, required_skills: [], nice_skills: [] },
      { skill: null, city: null, remote: true })).toBe(false);
  });
  it('jobMatchesHub tolerates missing skill/location fields', () => {
    expect(jobMatchesHub({}, { skill: null, city: null, remote: false })).toBe(true);
    expect(jobMatchesHub({ required_skills: [null, 42] }, { skill: 'react', city: null, remote: false })).toBe(false);
  });
});
