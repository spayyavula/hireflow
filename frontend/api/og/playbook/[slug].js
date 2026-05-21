import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

// Static slug -> {title, dek} map. The article files are at
// frontend/content/playbook/*.md but edge functions can't import the
// Vite-glob loader. When a new article ships, add an entry here too.
// Keep titles to ~70 chars and deks to ~140 chars for the card to render
// nicely at 1200x630.
const ARTICLES = {
  'h1b-60-day-grace-period': {
    title: 'H-1B 60-Day Grace Period After a Tech Layoff',
    dek: 'What the 60-day rule actually says, what counts as a status change, and the exact decision points week-by-week.',
  },
  'just-got-laid-off-week-1-plan': {
    title: 'Just Got Laid Off? Your Week 1 Plan',
    dek: 'Most engineers spend week 1 on tasks that don\'t matter and skip the ones that do. Here\'s the priority-ranked sequence.',
  },
  'negotiate-severance-tech-layoff': {
    title: 'How to Negotiate Severance at a Tech Company',
    dek: 'The first offer is almost never the final number. What\'s actually negotiable, by how much, with scripts.',
  },
  'cobra-vs-marketplace-insurance': {
    title: 'COBRA vs Marketplace Insurance for Laid-Off Engineers',
    dek: 'The math most engineers get wrong by $5,000–$15,000. Three worked income-bracket examples.',
  },
  'linkedin-opentowork-after-layoff': {
    title: 'When (and How) to Post #OpenToWork After a Layoff',
    dek: 'The green-ring badge has flipped from helpful to harmful at senior+ levels. What works in 2024–2026.',
  },
};

export default async function handler(request) {
  const url = new URL(request.url);
  const slug = url.pathname.split('/').pop();
  const article = ARTICLES[slug] || {
    title: 'The Hyrly Playbook',
    dek: 'Hand-written guides on what to actually do after a tech layoff.',
  };

  return new ImageResponse(
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: '#faf8f5',
        },
        children: [
          // Top bar: kicker.
          {
            type: 'div',
            props: {
              style: {
                fontSize: 22,
                color: '#ff6b5b',
                fontWeight: 700,
                letterSpacing: '0.06em',
              },
              children: 'HYRLY PLAYBOOK',
            },
          },
          // Center: title + dek.
          {
            type: 'div',
            props: {
              style: { display: 'flex', flexDirection: 'column' },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 64,
                      fontWeight: 700,
                      color: '#0d0d0f',
                      lineHeight: 1.1,
                      letterSpacing: '-0.025em',
                    },
                    children: article.title,
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 28,
                      color: '#5a5a66',
                      marginTop: 28,
                      lineHeight: 1.45,
                    },
                    children: article.dek,
                  },
                },
              ],
            },
          },
          // Bottom: byline + domain.
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 22,
                      color: '#5a5a66',
                    },
                    children: 'By Sreekanth Payyavula',
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 22,
                      color: '#0d0d0f',
                      fontWeight: 600,
                    },
                    children: 'hyrly.ai',
                  },
                },
              ],
            },
          },
        ],
      },
    },
    { width: 1200, height: 630 },
  );
}
