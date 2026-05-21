import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

// Custom 1200x630 OG card for /tools/severance. Designed for share-traffic
// on Blind / WhatsApp / Slack alumni groups: lead with the dollar-impact
// promise, follow with "free + no signup" to lower click friction.
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
          {
            type: 'div',
            props: {
              style: {
                fontSize: 22,
                color: '#ff6b5b',
                fontWeight: 700,
                letterSpacing: '0.06em',
              },
              children: 'HYRLY · FREE TOOL',
            },
          },
          {
            type: 'div',
            props: {
              style: { display: 'flex', flexDirection: 'column' },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 80,
                      fontWeight: 700,
                      color: '#0d0d0f',
                      lineHeight: 1.05,
                      letterSpacing: '-0.03em',
                    },
                    children: 'Tech Severance Calculator',
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 30,
                      color: '#5a5a66',
                      marginTop: 24,
                      lineHeight: 1.4,
                    },
                    children:
                      'Honest dollar range from your tier, level, tenure, and leverage factors. ' +
                      'Same numbers the Playbook uses. No signup.',
                  },
                },
              ],
            },
          },
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
                    style: { fontSize: 22, color: '#5a5a66' },
                    children: 'By Sreekanth Payyavula',
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: { fontSize: 22, color: '#0d0d0f', fontWeight: 600 },
                    children: 'hyrly.ai/tools/severance',
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
