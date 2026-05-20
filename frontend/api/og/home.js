import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

// Renders the 1200x630 OG card for the homepage. Designed for the
// Layoff-Triage ICP — high-leverage in the private-share channels
// (Blind, Slack alumni groups, WhatsApp, Reddit DMs).
export default async function handler() {
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
          // Top bar: small Hyrly wordmark.
          {
            type: 'div',
            props: {
              style: {
                fontSize: 24,
                color: '#ff6b5b',
                fontWeight: 700,
                letterSpacing: '0.02em',
              },
              children: 'HYRLY',
            },
          },
          // Center block: hero question + contrarian subhead + body.
          {
            type: 'div',
            props: {
              style: { display: 'flex', flexDirection: 'column' },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 88,
                      fontWeight: 700,
                      color: '#0d0d0f',
                      lineHeight: 1.05,
                      letterSpacing: '-0.03em',
                    },
                    children: 'Just got laid off?',
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 46,
                      fontWeight: 400,
                      fontStyle: 'italic',
                      color: '#5a5a66',
                      marginTop: 12,
                      letterSpacing: '-0.01em',
                    },
                    children: "Don't update your resume yet.",
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 28,
                      color: '#5a5a66',
                      marginTop: 36,
                      lineHeight: 1.4,
                    },
                    children:
                      'Free 10-question triage. 3 minutes. No signup. ' +
                      'Get your week-1 priorities ranked.',
                  },
                },
              ],
            },
          },
          // Bottom bar: domain.
          {
            type: 'div',
            props: {
              style: {
                fontSize: 24,
                color: '#0d0d0f',
                fontWeight: 600,
              },
              children: 'hyrly.ai',
            },
          },
        ],
      },
    },
    { width: 1200, height: 630 },
  );
}
