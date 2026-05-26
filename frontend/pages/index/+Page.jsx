import { useState } from 'react';
import { track } from '@vercel/analytics';
import GlobalStyles from '../../src/styles/GlobalStyles';
import PublicNav from '../../src/components/PublicNav';
import { TriageWizard } from '../../src/features/triage/TriageWizard';
import { TriagePlan } from '../../src/features/triage/TriagePlan';
import { ScoutChat } from '../../src/features/scout/ScoutChat';
import api from '../../src/api';
import { marketingNavProps } from '../../src/lib/vikeNav';

const HERO_TITLE = 'Just got laid off?';
const HERO_SUBHEAD = 'Don\'t update your resume yet.';
const HERO_BODY =
  'Most laid-off engineers spend week 1 on tasks that don\'t matter and skip ' +
  'the ones that do. Answer 10 questions about your situation. Get your ' +
  'priorities ranked.';

export default function HomePage() {
  const navProps = marketingNavProps('home');
  const [stage, setStage] = useState('hero');           // 'hero' | 'wizard' | 'submitting' | 'plan' | 'scout'
  const [triageId, setTriageId] = useState(null);
  const [plan, setPlan] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState(null);

  async function handleWizardComplete(answers) {
    setStage('submitting');
    setError(null);
    try {
      const resp = await api.submitTriage(answers);
      setTriageId(resp.triage_id);
      setPlan(resp.plan);
      setStage('plan');
    } catch (err) {
      setError(err.message || 'Submission failed');
      setStage('hero');
    }
  }

  async function handleStartScout() {
    if (sessionId) {
      setStage('scout');
      return;
    }
    setStage('submitting');
    setError(null);
    try {
      const resp = await api.createScoutSession(triageId);
      setSessionId(resp.session_id);
      setMessages(resp.messages);
      setStage('scout');
      track('scout_opened', { triage_id: triageId });
    } catch (err) {
      setError(err.message || 'Scout request failed');
      setStage('plan');
    }
  }

  async function handleSendScoutMessage(content) {
    setIsThinking(true);
    setError(null);
    // Optimistic add of the user message
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
      // Roll back the optimistic update
      setMessages(messages);
    } finally {
      setIsThinking(false);
    }
  }

  if (stage === 'scout') {
    return (
      <>
        <GlobalStyles />
        <ScoutChat
          messages={messages}
          onSendMessage={handleSendScoutMessage}
          onBack={() => setStage('plan')}
          isThinking={isThinking}
        />
        {error && (
          <div style={{
            position: 'fixed', bottom: 80, left: 0, right: 0,
            textAlign: 'center', color: 'var(--coral)', fontSize: 14, zIndex: 60,
          }}>{error}</div>
        )}
      </>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <GlobalStyles />
      <PublicNav {...navProps} />

      {stage === 'hero' && (
        <section style={{ maxWidth: 720, margin: '0 auto', padding: '80px 24px 64px', textAlign: 'center' }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 56, fontWeight: 700,
            color: 'var(--ink)', letterSpacing: '-0.03em', marginBottom: 8, lineHeight: 1.1,
          }}>{HERO_TITLE}</h1>
          <h2 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 400,
            color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: 32,
          }}>{HERO_SUBHEAD}</h2>
          <p style={{
            fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.6,
            maxWidth: 540, margin: '0 auto 40px',
          }}>{HERO_BODY}</p>
          <button
            onClick={() => { track('triage_started'); setStage('wizard'); }}
            style={{
              background: 'var(--ink)', color: 'white', padding: '16px 36px',
              borderRadius: 12, border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(13,13,15,0.12)',
            }}
          >Start triage — 3 minutes →</button>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 16 }}>
            No signup. No email. Free.
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' }}>
            Built by an engineer who's been on the other side of these layoffs.
          </p>
          {error && (
            <p style={{ marginTop: 16, color: 'var(--coral)', fontSize: 14 }}>{error}</p>
          )}
        </section>
      )}

      {stage === 'wizard' && (
        <TriageWizard onComplete={handleWizardComplete} />
      )}

      {stage === 'submitting' && (
        <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-secondary)' }}>
          Working on it…
        </div>
      )}

      {stage === 'plan' && plan && (
        <TriagePlan plan={plan} onStartScout={handleStartScout} />
      )}

    </div>
  );
}
