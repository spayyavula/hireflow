import { describe, it, expect } from 'vitest';
import { jobUrlPath, jobIdFromPath } from './jobUrl';

describe('jobUrlPath', () => {
  it('builds a slugged path ending in the job id', () => {
    expect(jobUrlPath({ id: 'job_abc123', title: 'Senior React Developer' }))
      .toBe('/jobs/senior-react-developer-job_abc123');
  });
});

describe('jobIdFromPath', () => {
  it('extracts the trailing job id from a slugged path segment', () => {
    expect(jobIdFromPath('senior-react-developer-job_abc123')).toBe('job_abc123');
  });
  it('returns null when no job id is present', () => {
    expect(jobIdFromPath('remote')).toBeNull();
  });
});
