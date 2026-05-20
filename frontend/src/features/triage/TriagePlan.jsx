export function TriagePlan({ plan, onStartScout }) {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700,
          color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: 16,
        }}>Your week-1 priorities</h2>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {plan.summary}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
        {plan.actions.map((a) => (
          <div key={a.priority} style={{
            background: 'white', borderRadius: 16, padding: '20px 24px',
            border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(13,13,15,0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 10 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', background: 'var(--coral)',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 13, flexShrink: 0,
              }}>{a.priority}</div>
              <h3 style={{
                fontSize: 17, fontWeight: 700, color: 'var(--ink)', margin: 0, lineHeight: 1.35,
              }}>{a.title}</h3>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 10 }}>
              <strong style={{ color: 'var(--text-secondary)' }}>Why:</strong> {a.why}
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 10 }}>
              <strong style={{ color: 'var(--text-secondary)' }}>How:</strong> {a.how}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>~ {a.eta}</p>
          </div>
        ))}
      </div>

      <div style={{
        position: 'sticky', bottom: 16,
        background: 'var(--cream)', padding: '16px 24px', borderRadius: 16,
        border: '1px solid var(--border)', boxShadow: '0 -2px 12px rgba(13,13,15,0.06)',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 12px' }}>
          Want a coach to help you actually execute this plan?
        </p>
        <button
          onClick={() => onStartScout(plan)}
          style={{
            background: 'var(--ink)', color: 'white', padding: '14px 28px',
            borderRadius: 12, border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Talk to Scout AI about this →
        </button>
      </div>
    </div>
  );
}
