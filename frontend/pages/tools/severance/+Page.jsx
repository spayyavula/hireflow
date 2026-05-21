import { useState, useMemo } from 'react';
import GlobalStyles from '../../../src/styles/GlobalStyles';
import PublicNav from '../../../src/components/PublicNav';
import { ScoutChat } from '../../../src/features/scout/ScoutChat';
import api from '../../../src/api';
import { marketingNavProps } from '../../../src/lib/vikeNav';
import { calcSeverance } from './calc';
import {
  LEVEL_OPTIONS, TIER_OPTIONS, GROUP_LAYOFF_OPTIONS, FAQS,
} from './content';

const fmtUSD = (n) =>
  n == null ? '—' : '$' + Math.round(n).toLocaleString('en-US');

const DEFAULT_INPUTS = {
  salary: 200000,
  tenureYears: 4,
  level: 'senior',
  tier: 'series_b_d',
  groupLayoffSize: 'single',
  hasUnvestedRSUs: false,
  isAge40Plus: false,
  initialOffer: null,
};

export default function SeveranceCalculatorPage() {
  const navProps = marketingNavProps('home');
  const [stage, setStage] = useState('calc');
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState(null);
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);

  const result = useMemo(() => calcSeverance(inputs), [inputs]);

  function update(field, value) {
    setInputs((prev) => ({ ...prev, [field]: value }));
  }

  async function handleStartScout() {
    setStage('submitting');
    setError(null);
    try {
      const resp = await api.createScoutSession(null, 'severance');
      setSessionId(resp.session_id);
      setMessages(resp.messages);
      setStage('scout');
    } catch (err) {
      setError(err.message || 'Scout request failed');
      setStage('calc');
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
          <Hero />
          <CalculatorCard inputs={inputs} update={update} />
          <ResultCard result={result} />
          <FooterCTA stage={stage} onStartScout={handleStartScout} error={error} />
          <FAQSection />
        </>
      )}
    </div>
  );
}

function Hero() {
  return (
    <section style={{ maxWidth: 760, margin: '0 auto', padding: '64px 24px 24px', textAlign: 'center' }}>
      <p style={{
        fontSize: 13, color: 'var(--coral)', fontWeight: 700, letterSpacing: '0.08em',
        textTransform: 'uppercase', marginBottom: 16,
      }}>Free tool for laid-off engineers</p>
      <h1 style={{
        fontFamily: "'Playfair Display', serif", fontSize: 48, fontWeight: 700,
        color: 'var(--ink)', letterSpacing: '-0.03em', marginBottom: 12, lineHeight: 1.1,
      }}>Tech Severance Calculator</h1>
      <p style={{
        fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.65,
        maxWidth: 580, margin: '0 auto',
      }}>
        Estimate what your severance package <em>should</em> look like — based on company
        tier, level, tenure, and the leverage factors the playbook documents. Same numbers
        the article uses. No signup, no email, runs entirely in your browser.
      </p>
    </section>
  );
}

const fieldLabel = {
  fontSize: 13, fontWeight: 700, color: 'var(--ink)',
  display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em',
};
const fieldHint = {
  fontSize: 12, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4,
};
const inputStyle = {
  width: '100%', padding: '10px 12px', fontSize: 15, fontFamily: 'inherit',
  border: '1px solid var(--border)', borderRadius: 10, background: 'white',
  color: 'var(--ink)',
};

function CalculatorCard({ inputs, update }) {
  return (
    <section style={{ maxWidth: 760, margin: '0 auto', padding: '8px 24px 16px' }}>
      <div style={{
        background: 'white', border: '1px solid var(--border)',
        borderRadius: 16, padding: '28px',
      }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700,
          color: 'var(--ink)', marginBottom: 20,
        }}>Your situation</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <div>
            <label style={fieldLabel} htmlFor="salary">Base salary (USD/year)</label>
            <input
              id="salary"
              type="number"
              min="0"
              step="5000"
              value={inputs.salary}
              onChange={(e) => update('salary', Number(e.target.value))}
              style={inputStyle}
            />
            <div style={fieldHint}>Just base — exclude equity and bonus.</div>
          </div>

          <div>
            <label style={fieldLabel} htmlFor="tenure">Tenure at this company (years)</label>
            <input
              id="tenure"
              type="number"
              min="0"
              max="30"
              step="0.25"
              value={inputs.tenureYears}
              onChange={(e) => update('tenureYears', Number(e.target.value))}
              style={inputStyle}
            />
            <div style={fieldHint}>Use decimals for partial years (e.g. 3.5).</div>
          </div>

          <div>
            <label style={fieldLabel} htmlFor="level">Level</label>
            <select
              id="level"
              value={inputs.level}
              onChange={(e) => update('level', e.target.value)}
              style={inputStyle}
            >
              {LEVEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={fieldLabel} htmlFor="tier">Company tier</label>
            <select
              id="tier"
              value={inputs.tier}
              onChange={(e) => update('tier', e.target.value)}
              style={inputStyle}
            >
              {TIER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={fieldLabel} htmlFor="group">Layoff size at your site</label>
            <select
              id="group"
              value={inputs.groupLayoffSize}
              onChange={(e) => update('groupLayoffSize', e.target.value)}
              style={inputStyle}
            >
              {GROUP_LAYOFF_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <div style={fieldHint}>
              50+ at one site triggers federal WARN Act; California / NY / NJ / IL have stricter state-level versions.
            </div>
          </div>

          <div>
            <label style={{ ...fieldLabel, textTransform: 'none', fontWeight: 600, fontSize: 14, letterSpacing: 0, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={inputs.hasUnvestedRSUs}
                onChange={(e) => update('hasUnvestedRSUs', e.target.checked)}
                style={{ marginRight: 8 }}
              />
              I have unvested RSUs vesting soon
            </label>
          </div>

          <div>
            <label style={{ ...fieldLabel, textTransform: 'none', fontWeight: 600, fontSize: 14, letterSpacing: 0, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={inputs.isAge40Plus}
                onChange={(e) => update('isAge40Plus', e.target.checked)}
                style={{ marginRight: 8 }}
              />
              I'm age 40+ (ADEA protection)
            </label>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={fieldLabel} htmlFor="offer">Their initial offer (optional)</label>
            <input
              id="offer"
              type="number"
              min="0"
              step="1000"
              value={inputs.initialOffer ?? ''}
              placeholder="Skip if you haven't gotten an offer yet"
              onChange={(e) => update('initialOffer', e.target.value === '' ? null : Number(e.target.value))}
              style={inputStyle}
            />
            <div style={fieldHint}>Total cash value of what they offered. Used to flag whether to counter.</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ResultCard({ result }) {
  if (!result) {
    return (
      <section style={{ maxWidth: 760, margin: '0 auto', padding: '8px 24px' }}>
        <div style={{
          background: 'var(--cream)', border: '1px dashed var(--border)',
          borderRadius: 16, padding: '24px', textAlign: 'center', color: 'var(--text-muted)',
        }}>
          Enter a valid salary to see your estimate.
        </div>
      </section>
    );
  }

  const cr = result.counterRecommendation;

  return (
    <section style={{ maxWidth: 760, margin: '0 auto', padding: '8px 24px' }}>
      <div style={{
        background: 'white', border: '1px solid var(--border)',
        borderRadius: 16, padding: '28px', marginBottom: 16,
      }}>
        <p style={{
          fontSize: 12, color: 'var(--coral)', fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8,
        }}>Estimated cash range</p>
        <p style={{
          fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700,
          color: 'var(--ink)', letterSpacing: '-0.02em', margin: '0 0 6px',
        }}>
          {fmtUSD(result.totalLow)} – {fmtUSD(result.totalHigh)}
        </p>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
          Midpoint: <strong>{fmtUSD(result.totalMid)}</strong> · {result.baseWeeksLow.toFixed(1)}–{result.baseWeeksHigh.toFixed(1)} weeks of base pay
        </p>

        <h3 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700,
          color: 'var(--ink)', marginTop: 24, marginBottom: 8,
        }}>How this was calculated</h3>
        <ul style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.65, paddingLeft: 20, margin: 0 }}>
          {result.breakdown.map((line, i) => (
            <li key={i} style={{ marginBottom: 4 }}>{line}</li>
          ))}
        </ul>

        <h3 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700,
          color: 'var(--ink)', marginTop: 24, marginBottom: 8,
        }}>Plus benefits worth asking for</h3>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, marginTop: 0, marginBottom: 6 }}>
          COBRA contribution: usually 3-6 months covered, worth approximately {fmtUSD(result.cobraEstimateLow)}–{fmtUSD(result.cobraEstimateHigh)} of subsidized health coverage.
        </p>
        {result.rsuNote && (
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, marginTop: 8, marginBottom: 0 }}>
            <strong>RSU acceleration:</strong> {result.rsuNote}
          </p>
        )}
      </div>

      {cr && (
        <div style={{
          background: cr.shouldCounter ? '#fff4ef' : 'white',
          border: `1px solid ${cr.shouldCounter ? 'var(--coral)' : 'var(--border)'}`,
          borderRadius: 16, padding: '24px', marginBottom: 16,
        }}>
          <p style={{
            fontSize: 12, color: 'var(--coral)', fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8,
          }}>On their initial offer</p>
          {cr.shouldCounter ? (
            <>
              <p style={{ fontSize: 17, color: 'var(--ink)', fontWeight: 600, lineHeight: 1.5, margin: '0 0 8px' }}>
                Their offer is below the midpoint. A reasonable counter is around {fmtUSD(cr.counterAmount)}.
              </p>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                The cash gap is real — don't sign until you've countered. Ask for the non-cash items below regardless of where the cash conversation lands.
              </p>
            </>
          ) : (
            <p style={{ fontSize: 17, color: 'var(--ink)', fontWeight: 600, lineHeight: 1.5, margin: 0 }}>
              Cash number is solid. Focus the counter on the non-cash items below — they're typically free for the company to grant.
            </p>
          )}
          <ul style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.65, paddingLeft: 20, marginTop: 12, marginBottom: 0 }}>
            {cr.nonCashAsks.map((ask, i) => <li key={i}>{ask}</li>)}
          </ul>
        </div>
      )}
    </section>
  );
}

function FooterCTA({ stage, onStartScout, error }) {
  return (
    <section style={{
      maxWidth: 760, margin: '24px auto 0', padding: '32px 24px',
      borderTop: '1px solid var(--border)', textAlign: 'center',
    }}>
      <p style={{
        fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 400,
        fontStyle: 'italic', color: 'var(--text-primary)', marginBottom: 16,
      }}>Want help drafting the actual counter-offer email?</p>
      <button
        onClick={onStartScout}
        disabled={stage === 'submitting'}
        style={{
          background: 'var(--ink)', color: 'white', padding: '14px 32px',
          borderRadius: 12, border: 'none', fontSize: 15, fontWeight: 700,
          cursor: stage === 'submitting' ? 'wait' : 'pointer',
          boxShadow: '0 4px 16px rgba(13,13,15,0.12)',
        }}
      >
        {stage === 'submitting' ? 'Opening Scout…' : 'Talk to Scout about negotiating →'}
      </button>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 14 }}>
        Free. No signup. Or <a href="/playbook/negotiate-severance-tech-layoff" style={{ color: 'var(--coral)', fontWeight: 600 }}>read the full Playbook severance article</a> — same source for the numbers on this page.
      </p>
      {error && (
        <p style={{ marginTop: 16, color: 'var(--coral)', fontSize: 14 }}>{error}</p>
      )}
    </section>
  );
}

function FAQSection() {
  return (
    <section style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px 64px' }}>
      <h2 style={{
        fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700,
        color: 'var(--ink)', marginBottom: 24, letterSpacing: '-0.02em',
      }}>Frequently asked</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        {FAQS.map((f, i) => (
          <div key={i}>
            <h3 style={{
              fontSize: 16, fontWeight: 700, color: 'var(--ink)',
              marginBottom: 8, lineHeight: 1.4,
            }}>{f.q}</h3>
            <p style={{
              fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0,
            }}>{f.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
