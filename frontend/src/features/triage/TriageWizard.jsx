import { useEffect, useReducer } from 'react';
import { QUESTIONS } from './questions';

function reducer(state, action) {
  switch (action.type) {
    case 'answer': {
      const q = QUESTIONS[state.index];
      const answers = { ...state.answers, [q.id]: action.value };
      const next = state.index + 1;
      return { index: next, answers };
    }
    case 'back':
      return { ...state, index: Math.max(0, state.index - 1) };
    default:
      return state;
  }
}

export function TriageWizard({ onComplete }) {
  const [state, dispatch] = useReducer(reducer, { index: 0, answers: {} });

  // Trigger onComplete once when we step past the last question.
  useEffect(() => {
    if (state.index >= QUESTIONS.length) {
      onComplete(state.answers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.index]);

  if (state.index >= QUESTIONS.length) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
        Generating your plan…
      </div>
    );
  }

  const q = QUESTIONS[state.index];

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, fontWeight: 600 }}>
        Question {state.index + 1} of {QUESTIONS.length}
      </div>
      <h2 style={{
        fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700,
        color: 'var(--ink)', letterSpacing: '-0.01em', marginBottom: q.subtitle ? 8 : 24,
      }}>{q.prompt}</h2>
      {q.subtitle && (
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>{q.subtitle}</p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {q.options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => dispatch({ type: 'answer', value: opt.value })}
            style={{
              padding: '14px 18px', borderRadius: 12, border: '1px solid var(--border)',
              background: 'white', color: 'var(--ink)', fontSize: 15, fontWeight: 500,
              textAlign: 'left', cursor: 'pointer', transition: 'border-color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--coral)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {state.index > 0 && (
        <button
          onClick={() => dispatch({ type: 'back' })}
          style={{
            marginTop: 20, background: 'transparent', border: 'none', color: 'var(--text-muted)',
            fontSize: 13, cursor: 'pointer', padding: '4px 0',
          }}
        >
          ← Back
        </button>
      )}
    </div>
  );
}
