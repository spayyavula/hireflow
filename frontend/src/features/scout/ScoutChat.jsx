import { useState, useEffect, useRef } from 'react';
import { track } from '@vercel/analytics';

const URL_SPLIT_RE = /(https?:\/\/[^\s]+)/g;
const TRAIL_RE = /[.,;:!?)]+$/;
const PLAYBOOK_RE = /\/playbook\/([^/?#\s]+)/;

const TOPIC_CHIPS = [
  { label: 'Visa & H-1B', send: 'Tell me about my visa and the H-1B 60-day clock' },
  { label: 'Severance', send: 'How do I negotiate severance?' },
  { label: 'Finances', send: 'Walk me through finances — unemployment, COBRA, runway' },
  { label: 'Resume & LinkedIn', send: 'What should I do about my resume and LinkedIn?' },
  { label: 'Career direction', send: 'Help me think through career direction' },
];

function renderScoutContent(text) {
  return text.split(URL_SPLIT_RE).map((part, i) => {
    if (!part.startsWith('http')) return part;
    const trailMatch = part.match(TRAIL_RE);
    const trail = trailMatch ? trailMatch[0] : '';
    const url = trail ? part.slice(0, -trail.length) : part;
    const playbook = url.match(PLAYBOOK_RE);
    const onClick = playbook
      ? () => track('playbook_link_clicked', { slug: playbook[1] })
      : undefined;
    return (
      <span key={i}>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClick}
          style={{ color: 'var(--coral)', textDecoration: 'underline', wordBreak: 'break-all' }}
        >{url}</a>
        {trail}
      </span>
    );
  });
}

export function getOpenerChips(messages, isThinking) {
  if (isThinking) return [];
  if (!messages || messages.length !== 1) return [];
  if (messages[0]?.role !== 'scout') return [];
  return TOPIC_CHIPS;
}

export function ScoutChat({ messages, onSendMessage, onBack, isThinking }) {
  const [draft, setDraft] = useState('');
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const canSend = draft.trim().length > 0 && !isThinking;

  useEffect(() => {
    const el = messagesEndRef.current;
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages.length, isThinking]);

  useEffect(() => {
    const t = textareaRef.current;
    if (!t) return;
    t.style.height = 'auto';
    t.style.height = Math.min(t.scrollHeight, 160) + 'px';
  }, [draft]);

  function handleSend() {
    if (!canSend) return;
    const text = draft.trim();
    setDraft('');
    onSendMessage(text);
  }

  function handleChip(send) {
    if (isThinking) return;
    onSendMessage(send);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const chips = getOpenerChips(messages, isThinking);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100dvh',
      background: 'var(--cream)',
      position: 'fixed', inset: 0, zIndex: 50,
    }}>
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'white',
        flexShrink: 0,
        paddingTop: 'calc(10px + env(safe-area-inset-top))',
      }}>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to plan"
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text-secondary)', fontSize: 15, fontWeight: 600,
              padding: '8px 4px', fontFamily: 'inherit',
              minHeight: 44, display: 'flex', alignItems: 'center',
            }}
          >← Plan</button>
        ) : <span style={{ minWidth: 60 }} />}
        <span style={{
          fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 600,
          color: 'var(--ink)', letterSpacing: '-0.01em',
        }}>Scout</span>
        <span style={{ minWidth: 60 }} />
      </header>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{
          maxWidth: 720, margin: '0 auto',
          padding: '16px 16px 8px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '88%',
                background: m.role === 'user' ? 'var(--ink)' : 'white',
                color: m.role === 'user' ? 'white' : 'var(--text-primary)',
                border: m.role === 'user' ? 'none' : '1px solid var(--border)',
                borderRadius: 16,
                padding: '12px 16px',
                fontSize: 15,
                lineHeight: 1.55,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {m.role === 'scout' ? renderScoutContent(m.content) : m.content}
            </div>
          ))}
          {isThinking && (
            <div style={{
              alignSelf: 'flex-start', fontSize: 13, color: 'var(--text-muted)',
              fontStyle: 'italic', padding: '4px 8px',
            }}>Scout is thinking…</div>
          )}
          {chips.length > 0 && (
            <div
              role="group"
              aria-label="Suggested topics"
              style={{
                display: 'flex', flexWrap: 'wrap', gap: 8,
                alignSelf: 'flex-start', maxWidth: '100%',
                marginTop: 2,
              }}
            >
              {chips.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => handleChip(c.send)}
                  style={{
                    padding: '8px 14px', borderRadius: 18,
                    border: '1px solid var(--ink)',
                    background: 'white', color: 'var(--ink)',
                    fontSize: 14, fontWeight: 500, cursor: 'pointer',
                    fontFamily: 'inherit',
                    minHeight: 36,
                  }}
                >{c.label}</button>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div style={{
        flexShrink: 0,
        background: 'white',
        borderTop: '1px solid var(--border)',
        padding: '8px 12px',
        paddingBottom: 'calc(8px + env(safe-area-inset-bottom))',
      }}>
        <div style={{
          maxWidth: 720, margin: '0 auto',
          display: 'flex', gap: 8, alignItems: 'flex-end',
          background: 'white', borderRadius: 16,
          border: '1px solid var(--border)', padding: 6,
        }}>
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isThinking}
            placeholder="Ask Scout…"
            rows={1}
            style={{
              flex: 1, border: 'none', outline: 'none', resize: 'none',
              padding: '10px 12px',
              fontSize: 16,
              fontFamily: 'inherit',
              background: 'transparent', color: 'var(--ink)',
              minHeight: 24, maxHeight: 160, lineHeight: 1.4,
            }}
          />
          <button
            onClick={handleSend}
            disabled={!canSend}
            aria-label="Send"
            style={{
              background: canSend ? 'var(--ink)' : 'var(--border)',
              color: 'white', border: 'none', borderRadius: 12,
              padding: '0 18px', minHeight: 44, minWidth: 64,
              fontSize: 14, fontWeight: 700,
              cursor: canSend ? 'pointer' : 'not-allowed',
            }}
          >Send</button>
        </div>
      </div>
    </div>
  );
}
