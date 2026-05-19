import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

const API_BASE = (process.env.VITE_API_URL || '').replace(/\/$/, '');

// Renders a 1200x630 card image for a job posting.
export default async function handler(request) {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();

  let job = null;
  try {
    const res = await fetch(`${API_BASE}/api/jobs/${id}`);
    if (res.ok) job = await res.json();
  } catch {
    job = null;
  }

  const title = job ? job.title : 'JobsSearch';
  const subtitle = job
    ? `${job.company_name || ''}${job.location ? ' · ' + job.location : ''}`
    : 'AI-powered job search and hiring';

  return new ImageResponse(
    {
      type: 'div',
      props: {
        style: {
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          justifyContent: 'center', padding: '80px', background: '#faf8f5',
        },
        children: [
          { type: 'div', props: { style: { fontSize: 60, fontWeight: 700, color: '#0d0d0f', lineHeight: 1.1 }, children: title } },
          { type: 'div', props: { style: { fontSize: 32, color: '#5a5a66', marginTop: 24 }, children: subtitle } },
          { type: 'div', props: { style: { fontSize: 28, color: '#ff6b5b', fontWeight: 700, marginTop: 'auto' }, children: 'JobsSearch' } },
        ],
      },
    },
    { width: 1200, height: 630 },
  );
}
