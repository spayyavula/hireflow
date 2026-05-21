import { useState } from 'react';

export function ScoutChat({ messages, onSendMessage, isThinking }) {
  const [draft, setDraft] = useState('');
  const canSend = draft.trim().length > 0 && !isThinking;

  function handleSend() {
    if (!canSend) return;
    const text = draft.trim();
    setDraft('');
    onSendMessage(text);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div style={{
      maxWidth: 720, margin: '0 auto', padding: '24px 24px 32px',
      display: 'flex', flexDirection: 'column', minHeight: '70vh',
    }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              background: m.role === 'user' ? 'var(--ink)' : 'white',
              color: m.role === 'user' ? 'white' : 'var(--text-primary)',
              border: m.role === 'user' ? 'none' : '1px solid var(--border)',
              borderRadius: 16,
              padding: '14px 18px',
              fontSize: 15,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {m.content}
          </div>
        ))}
        {isThinking && (
          <div style={{
            alignSelf: 'flex-start', fontSize: 13, color: 'var(--text-muted)',
            fontStyle: 'italic', padding: '4px 8px',
          }}>
            Scout is thinking…
          </div>
        )}
      </div>

      <div style={{
        display: 'flex', gap: 8, alignItems: 'flex-end',
        background: 'white', borderRadius: 16, padding: 8,
        border: '1px solid var(--border)',
      }}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isThinking}
          placeholder="Ask Scout anything — visa, severance, finances, resume, what's next…"
          rows={1}
          style={{
            flex: 1, border: 'none', outline: 'none', resize: 'none',
            padding: '10px 12px', fontSize: 15, fontFamily: 'inherit',
            background: 'transparent', color: 'var(--ink)',
            minHeight: 24, maxHeight: 120,
          }}
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Send"
          style={{
            background: canSend ? 'var(--ink)' : 'var(--border)',
            color: 'white', border: 'none', borderRadius: 12,
            padding: '10px 18px', fontSize: 14, fontWeight: 700,
            cursor: canSend ? 'pointer' : 'not-allowed',
          }}
        >Send</button>
      </div>
    </div>
  );
}
