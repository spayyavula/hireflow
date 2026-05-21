import { useEffect } from 'react';
import GlobalStyles from '../../styles/GlobalStyles';
import PublicNav from '../../components/PublicNav';

const ITEMS = [
  // Shipped
  { title: 'Hyrly rebrand + canonical domain migration', status: 'shipped', when: 'May 2026',
    desc: 'JobsSearch -> Hyrly, jobssearch.work -> hyrly.ai, with 308 redirects + Google Indexing API migration.' },
  { title: 'Layoff Triage as homepage', status: 'shipped', when: 'May 2026',
    desc: 'Replaced the marketing landing with a 10-question Triage that hands off to Scout AI with full context.' },
  { title: 'Playbook v1 — five deep articles', status: 'shipped', when: 'May 2026',
    desc: '~11,000 words across H-1B 60-day rule, week-1 priorities, severance negotiation, COBRA vs marketplace, LinkedIn protocol.' },
  { title: 'Custom homepage OG image + trust line', status: 'shipped', when: 'May 2026',
    desc: 'Real founder credential under the CTA + designed @vercel/og card for social shares.' },

  // In progress
  { title: 'Scout AI hardening across 13 layoff domains', status: 'in_progress', when: 'May 2026',
    desc: 'Layoff-tuned coaching responses for visa, severance, finances, resume, networking, interview, career direction, plus chat-continuation UI + session memory.' },

  // Planned
  { title: 'Stripe billing for Hyrly Coach + Layoff Sprint', status: 'planned', when: 'June 2026',
    desc: 'Wires the Pricing page Reserve buttons to real checkout. Until it lands, signups go through sreekanth@hyrly.ai.' },
  { title: '5 more Playbook articles', status: 'planned', when: 'June 2026',
    desc: 'Recruiter outreach scripts, FAANG vs startup decision framework, freelance bridge income, mental-health resources, LinkedIn announcement template.' },
  { title: 'Free Severance Calculator at /tools/severance', status: 'planned', when: 'June 2026',
    desc: 'Standalone tool that ranks your severance package against current market benchmarks. SEO entry point for high-intent queries.' },
  { title: 'Per-article custom OG images for the Playbook', status: 'planned', when: 'June 2026',
    desc: 'One @vercel/og endpoint per article. Improves share-card conversion in private channels (Slack alumni groups, Blind, WhatsApp).' },
  { title: 'LinkedIn announcement template generator', status: 'planned', when: 'Q3 2026',
    desc: 'Input your role + situation, get back a personalized announcement post + recruiter DM templates that match the playbook voice.' },
];

const STATUS_LABELS = {
  shipped: 'Shipped',
  in_progress: 'In progress',
  planned: 'Planned',
};

const STATUS_COLORS = {
  shipped: 'var(--sage)',
  in_progress: 'var(--coral)',
  planned: 'var(--lavender)',
};

const StaticRoadmap = ({ onGetStarted, onSignIn, onNavigate, currentPage }) => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const counts = ITEMS.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <GlobalStyles />
      <PublicNav onGetStarted={onGetStarted} onSignIn={onSignIn} onNavigate={onNavigate} currentPage={currentPage} />

      {/* Hero */}
      <section style={{ padding: '80px 48px 32px', textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 'clamp(36px, 4.5vw, 52px)', fontWeight: 700,
          lineHeight: 1.1, color: 'var(--ink)', letterSpacing: '-0.03em', marginBottom: 16,
        }}>Roadmap</h1>
        <p style={{ fontSize: 17, color: 'var(--text-secondary)', maxWidth: 540, margin: '0 auto', lineHeight: 1.7 }}>
          A hand-curated list of what's shipped, what's in progress, and what's next. Not a community-vote board (yet) — this is the founder's plan, written honestly.
        </p>
      </section>

      {/* Counts strip */}
      <section style={{ padding: '0 48px 24px', maxWidth: 720, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
        {(['shipped', 'in_progress', 'planned']).map((key) => (
          <div key={key} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: STATUS_COLORS[key] }}>
              {counts[key] || 0}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>
              {STATUS_LABELS[key]}
            </div>
          </div>
        ))}
      </section>

      {/* Items */}
      <section style={{ padding: '32px 48px 80px', maxWidth: 880, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {ITEMS.map((item, i) => (
            <div key={i} style={{
              background: 'white', borderRadius: 16, padding: '20px 24px',
              border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                <span style={{
                  display: 'inline-block', padding: '3px 12px', borderRadius: 20,
                  fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                  background: `${STATUS_COLORS[item.status].replace('var(--', 'rgba(').replace(')', '')}`,
                  color: STATUS_COLORS[item.status],
                  border: `1px solid ${STATUS_COLORS[item.status]}`,
                }}>{STATUS_LABELS[item.status]}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.when}</span>
              </div>
              <h3 style={{
                fontFamily: "'Playfair Display', serif", fontSize: 19, fontWeight: 700,
                color: 'var(--ink)', margin: 0, marginBottom: 6, lineHeight: 1.35,
              }}>{item.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Idea-submission acknowledgement */}
      <section style={{ padding: '0 48px 48px', maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, fontStyle: 'italic' }}>
          Something you'd want built? Email <a href="mailto:sreekanth@hyrly.ai" style={{ color: 'var(--coral)', fontWeight: 600 }}>sreekanth@hyrly.ai</a>. The community-vote version of this page is in the codebase; it'll go live once there's a community.
        </p>
      </section>

      {/* CTA Banner */}
      <section style={{
        padding: '64px 48px', textAlign: 'center',
        background: 'var(--ink)', color: 'var(--cream)',
      }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 700,
          letterSpacing: '-0.02em', marginBottom: 16,
        }}>Want to be one of the first 100?</h2>
        <p style={{ fontSize: 16, color: 'rgba(250,248,245,0.6)', marginBottom: 28, maxWidth: 480, margin: '0 auto 28px' }}>
          Pricing locks in. Founder reads every reply.
        </p>
        <a href="/" style={{
          display: 'inline-block', padding: '14px 32px', borderRadius: 12, border: 'none',
          background: 'var(--coral)', color: 'white', fontSize: 16, fontWeight: 700,
          textDecoration: 'none', boxShadow: '0 4px 16px rgba(255,107,91,0.3)',
        }}>Start the Hyrly Triage →</a>
      </section>

      <footer style={{
        padding: '24px 48px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)',
        background: 'var(--ink)', borderTop: '1px solid rgba(250,248,245,0.06)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      }}>
        <span>© 2026 Hyrly.</span>
        <div style={{ display: 'flex', gap: 24 }}>
          <a href="/terms" style={{ color: 'rgba(250,248,245,0.45)', textDecoration: 'none', fontSize: 12 }}>Terms</a>
          <a href="/privacy" style={{ color: 'rgba(250,248,245,0.45)', textDecoration: 'none', fontSize: 12 }}>Privacy</a>
          <a href="/help" style={{ color: 'rgba(250,248,245,0.45)', textDecoration: 'none', fontSize: 12 }}>Help</a>
        </div>
      </footer>
    </div>
  );
};

export default StaticRoadmap;
