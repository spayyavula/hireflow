import { useState } from 'react';
import GlobalStyles from '../../src/styles/GlobalStyles';
import PublicNav from '../../src/components/PublicNav';
import { ScoutChat } from '../../src/features/scout/ScoutChat';
import api from '../../src/api';
import { marketingNavProps } from '../../src/lib/vikeNav';
import { DECISION_POINTS, FAQS } from './content';

export default function LaidOffH1BPage() {
  const navProps = marketingNavProps('home');
  const [stage, setStage] = useState('hero');             // 'hero' | 'submitting' | 'scout'
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState(null);

  async function handleStartScout() {
    setStage('submitting');
    setError(null);
    try {
      const resp = await api.createScoutSession(null, 'visa');
      setSessionId(resp.session_id);
      setMessages(resp.messages);
      setStage('scout');
    } catch (err) {
      setError(err.message || 'Scout request failed');
      setStage('hero');
    }
  }

  async function handleSendScoutMessage(content) {
    setIsThinking(true);
    setError(null);
    const optimistic = [
      ...messages,
      { role: 'user', content, ts: new Date().toISOString() },
    ];
    setMessages(optimistic);
    try {
      const resp = await api.sendScoutMessage(sessionId, content);
      setMessages(resp.messages);
    } catch (err) {
      setError(err.message || 'Scout reply failed');
      setMessages(messages);
    } finally {
      setIsThinking(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <GlobalStyles />
      <PublicNav {...navProps} />

      {stage === 'scout' ? (
        <>
          <ScoutChat
            messages={messages}
            onSendMessage={handleSendScoutMessage}
            isThinking={isThinking}
          />
          {error && (
            <p style={{ textAlign: 'center', color: 'var(--coral)', fontSize: 14 }}>{error}</p>
          )}
        </>
      ) : (
        <>
          <Hero
            stage={stage}
            error={error}
            onStartScout={handleStartScout}
          />
          <DecisionPoints />
          <FAQSection />
          <FooterCTA stage={stage} onStartScout={handleStartScout} />
        </>
      )}
    </div>
  );
}

function Hero({ stage, error, onStartScout }) {
  return (
    <section style={{ maxWidth: 760, margin: '0 auto', padding: '64px 24px 48px', textAlign: 'center' }}>
      <p style={{
        fontSize: 13, color: 'var(--coral)', fontWeight: 700, letterSpacing: '0.08em',
        textTransform: 'uppercase', marginBottom: 16,
      }}>For US tech engineers on H-1B</p>
      <h1 style={{
        fontFamily: "'Playfair Display', serif", fontSize: 56, fontWeight: 700,
        color: 'var(--ink)', letterSpacing: '-0.03em', marginBottom: 12, lineHeight: 1.1,
      }}>Just got laid off on H-1B?</h1>
      <h2 style={{
        fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 400,
        color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: 28,
      }}>Your 60-day clock starts today.</h2>
      <p style={{
        fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.65,
        maxWidth: 600, margin: '0 auto 36px',
      }}>
        From your last day, you have 60 calendar days (not business days) to file a transfer
        petition, change to a different status, or leave the country. Day 61 starts unlawful
        presence — which has long-tail consequences you genuinely don't want to deal with.
        Here's what to do in week one, and a free conversation with Scout about your situation.
      </p>
      <button
        onClick={onStartScout}
        disabled={stage === 'submitting'}
        style={{
          background: 'var(--ink)', color: 'white', padding: '16px 36px',
          borderRadius: 12, border: 'none', fontSize: 16, fontWeight: 700,
          cursor: stage === 'submitting' ? 'wait' : 'pointer',
          boxShadow: '0 4px 16px rgba(13,13,15,0.12)',
          opacity: stage === 'submitting' ? 0.7 : 1,
        }}
      >
        {stage === 'submitting' ? 'Opening Scout…' : 'Talk to Scout about your visa →'}
      </button>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 16 }}>
        No signup. No email. Free. Powered by the same Scout AI that runs the homepage triage.
      </p>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
        Want the deep guide first? <a href="/playbook/h1b-60-day-grace-period" style={{ color: 'var(--coral)', fontWeight: 600 }}>Read the full Hyrly Playbook H-1B article →</a>
      </p>
      {error && (
        <p style={{ marginTop: 16, color: 'var(--coral)', fontSize: 14 }}>{error}</p>
      )}
    </section>
  );
}

function DecisionPoints() {
  return (
    <section style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px' }}>
      <h2 style={{
        fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700,
        color: 'var(--ink)', marginBottom: 8, letterSpacing: '-0.02em',
      }}>The five decisions that matter</h2>
      <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 32 }}>
        In order. Skim the headers; read the bodies you need.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {DECISION_POINTS.map((p, i) => (
          <article
            key={i}
            style={{
              background: 'white', border: '1px solid var(--border)',
              borderRadius: 16, padding: '24px 28px',
            }}
          >
            <div style={{
              fontSize: 12, color: 'var(--coral)', fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8,
            }}>{p.day}</div>
            <h3 style={{
              fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700,
              color: 'var(--ink)', marginBottom: 10, lineHeight: 1.25,
            }}>{p.title}</h3>
            <p style={{
              fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.65, margin: 0,
            }}>{p.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function FAQSection() {
  return (
    <section style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 24px' }}>
      <h2 style={{
        fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700,
        color: 'var(--ink)', marginBottom: 24, letterSpacing: '-0.02em',
      }}>Frequently asked</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {FAQS.map((f, i) => (
          <div key={i}>
            <h3 style={{
              fontSize: 17, fontWeight: 700, color: 'var(--ink)',
              marginBottom: 8, lineHeight: 1.4,
            }}>{f.q}</h3>
            <p style={{
              fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0,
            }}>{f.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FooterCTA({ stage, onStartScout }) {
  return (
    <footer style={{
      maxWidth: 760, margin: '32px auto 0', padding: '40px 24px 64px',
      borderTop: '1px solid var(--border)', textAlign: 'center',
    }}>
      <p style={{
        fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 400,
        fontStyle: 'italic', color: 'var(--text-primary)', marginBottom: 20,
      }}>Want this applied to your specific situation?</p>
      <button
        onClick={onStartScout}
        disabled={stage === 'submitting'}
        style={{
          background: 'var(--ink)', color: 'white', padding: '14px 32px',
          borderRadius: 12, border: 'none', fontSize: 15, fontWeight: 700,
          cursor: stage === 'submitting' ? 'wait' : 'pointer',
        }}
      >
        {stage === 'submitting' ? 'Opening Scout…' : 'Talk to Scout about your visa →'}
      </button>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 16 }}>
        Or <a href="/playbook/h1b-60-day-grace-period" style={{ color: 'var(--coral)', fontWeight: 600 }}>read the full Playbook article</a> — same source for the content on this page.
      </p>
    </footer>
  );
}
