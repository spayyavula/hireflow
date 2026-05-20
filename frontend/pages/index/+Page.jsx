import { useState } from 'react';
import GlobalStyles from '../../src/styles/GlobalStyles';
import PublicNav from '../../src/components/PublicNav';
import { TriageWizard } from '../../src/features/triage/TriageWizard';
import { TriagePlan } from '../../src/features/triage/TriagePlan';
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
  const [plan, setPlan] = useState(null);
  const [scoutReply, setScoutReply] = useState(null);
  const [error, setError] = useState(null);

  async function handleWizardComplete(answers) {
    setStage('submitting');
    setError(null);
    try {
      const resp = await api.submitTriage(answers);
      setPlan(resp.plan);
      setStage('plan');
    } catch (err) {
      setError(err.message || 'Submission failed');
      setStage('hero');
    }
  }

  async function handleStartScout(p) {
    setStage('submitting');
    setError(null);
    try {
      const reply = await api.startScoutWithContext({
        summary: p.summary,
        suggestedFirstTopic: p.suggested_first_topic,
      });
      setScoutReply(reply);
      setStage('scout');
    } catch (err) {
      setError(err.message || 'Scout request failed');
      setStage('plan');
    }
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
            onClick={() => setStage('wizard')}
            style={{
              background: 'var(--ink)', color: 'white', padding: '16px 36px',
              borderRadius: 12, border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(13,13,15,0.12)',
            }}
          >Start triage — 3 minutes →</button>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 16 }}>
            No signup. No email. Free.
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

      {stage === 'scout' && scoutReply && (
        <div style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700,
            color: 'var(--ink)', marginBottom: 16,
          }}>Scout says:</h2>
          <div style={{
            background: 'white', borderRadius: 16, padding: 24,
            border: '1px solid var(--border)', whiteSpace: 'pre-wrap', lineHeight: 1.7,
          }}>{scoutReply.message || JSON.stringify(scoutReply, null, 2)}</div>
        </div>
      )}
    </div>
  );
}
