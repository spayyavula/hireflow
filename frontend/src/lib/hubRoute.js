import { toSlug } from './slug';
import { jobIdFromPath } from './jobUrl';

// A hub path tail is the part after '/jobs/'. Supported shapes:
//   remote | <skill> | location/<city> | <skill>/remote | <skill>/location/<city>
export function parseHubPath(pathTail) {
  if (jobIdFromPath(pathTail)) return null; // it's a job-detail URL, not a hub
  const parts = String(pathTail || '').split('/').filter(Boolean);
  if (parts.length === 0 || parts.length > 3) return null;

  let skill = null;
  let city = null;
  let remote = false;
  let i = 0;
  if (parts[i] !== 'remote' && parts[i] !== 'location') {
    skill = parts[i];
    i += 1;
  }
  if (parts[i] === 'remote') {
    remote = true;
    i += 1;
  } else if (parts[i] === 'location') {
    if (i + 1 >= parts.length) return null;
    city = parts[i + 1];
    i += 2;
  }
  if (i !== parts.length) return null;
  if (!skill && !city && !remote) return null;
  return { skill: skill || null, city: city || null, remote };
}

export function hubSlug({ skill, city, remote }) {
  const segs = [];
  if (skill) segs.push(skill);
  if (remote) segs.push('remote');
  if (city) segs.push('location', city);
  return segs.join('/');
}

export function hubUrlPath(descriptor) {
  return `/jobs/${hubSlug(descriptor)}`;
}

const titleCase = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());

export function hubLabel({ skill, city, remote }) {
  const prefix = remote ? 'Remote ' : '';
  const core = skill ? `${titleCase(skill)} jobs` : 'jobs';
  let label = `${prefix}${core}`;
  if (city) label += ` in ${titleCase(city)}`;
  return label;
}

export function jobMatchesHub(job, { skill, city, remote }) {
  if (remote && !job.remote) return false;
  if (skill) {
    const haystack = [...(job.required_skills || []), ...(job.nice_skills || [])]
      .map((s) => s.toLowerCase());
    if (!haystack.includes(skill.toLowerCase())) return false;
  }
  if (city) {
    if (!toSlug(job.location || '').includes(city.toLowerCase())) return false;
  }
  return true;
}
