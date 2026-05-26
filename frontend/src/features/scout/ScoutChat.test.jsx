import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScoutChat, getOpenerChips } from './ScoutChat';

vi.mock('@vercel/analytics', () => ({ track: vi.fn() }));
import { track } from '@vercel/analytics';

const SAMPLE_MESSAGES = [
  { role: 'scout', content: 'Hey, sorry you\'re dealing with this. What\'s most pressing?', ts: '2026-05-20T10:00:00Z' },
  { role: 'user', content: 'my visa', ts: '2026-05-20T10:01:00Z' },
  { role: 'scout', content: 'On the H-1B side: 60 days from your last day...', ts: '2026-05-20T10:01:30Z' },
];

const OPENER_ONLY = [
  {
    role: 'scout',
    content: 'For a Senior engineer, the most fixable thing this week is cash flow…',
    ts: '2026-05-22T11:20:00Z',
  },
];

describe('ScoutChat', () => {
  it('renders every message in order', () => {
    render(<ScoutChat messages={SAMPLE_MESSAGES} onSendMessage={() => {}} onBack={() => {}} isThinking={false} />);
    expect(screen.getByText(/sorry you're dealing with this/i)).toBeInTheDocument();
    expect(screen.getByText(/my visa/i)).toBeInTheDocument();
    expect(screen.getByText(/On the H-1B side/i)).toBeInTheDocument();
  });

  it('calls onSendMessage when send is clicked', () => {
    const onSendMessage = vi.fn();
    render(<ScoutChat messages={SAMPLE_MESSAGES} onSendMessage={onSendMessage} onBack={() => {}} isThinking={false} />);
    const input = screen.getByPlaceholderText(/ask Scout/i);
    fireEvent.change(input, { target: { value: 'tell me more about AC-21' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    expect(onSendMessage).toHaveBeenCalledWith('tell me more about AC-21');
  });

  it('disables send when input is empty', () => {
    render(<ScoutChat messages={SAMPLE_MESSAGES} onSendMessage={() => {}} onBack={() => {}} isThinking={false} />);
    const button = screen.getByRole('button', { name: /send/i });
    expect(button).toBeDisabled();
  });

  it('disables input + shows indicator while thinking', () => {
    render(<ScoutChat messages={SAMPLE_MESSAGES} onSendMessage={() => {}} onBack={() => {}} isThinking={true} />);
    const input = screen.getByPlaceholderText(/ask Scout/i);
    expect(input).toBeDisabled();
    expect(screen.getByText(/scout is thinking/i)).toBeInTheDocument();
  });

  it('clears input after sending', () => {
    const onSendMessage = vi.fn();
    render(<ScoutChat messages={SAMPLE_MESSAGES} onSendMessage={onSendMessage} onBack={() => {}} isThinking={false} />);
    const input = screen.getByPlaceholderText(/ask Scout/i);
    fireEvent.change(input, { target: { value: 'a question' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    expect(input.value).toBe('');
  });

  it('sends on Enter key in input', () => {
    const onSendMessage = vi.fn();
    render(<ScoutChat messages={SAMPLE_MESSAGES} onSendMessage={onSendMessage} onBack={() => {}} isThinking={false} />);
    const input = screen.getByPlaceholderText(/ask Scout/i);
    fireEvent.change(input, { target: { value: 'enter test' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(onSendMessage).toHaveBeenCalledWith('enter test');
  });

  it('linkifies URLs in scout messages and tracks playbook clicks', () => {
    track.mockClear();
    const messages = [{
      role: 'scout',
      content: 'See https://hyrly.ai/playbook/cobra-vs-marketplace-insurance for details. Also https://example.com works.',
      ts: '2026-05-22T11:20:00Z',
    }];
    render(<ScoutChat messages={messages} onSendMessage={() => {}} onBack={() => {}} isThinking={false} />);

    const playbookLink = screen.getByRole('link', { name: /playbook\/cobra/i });
    expect(playbookLink).toHaveAttribute('href', 'https://hyrly.ai/playbook/cobra-vs-marketplace-insurance');
    expect(playbookLink).toHaveAttribute('target', '_blank');
    expect(playbookLink).toHaveAttribute('rel', 'noopener noreferrer');

    const externalLink = screen.getByRole('link', { name: /example\.com/i });
    expect(externalLink).toHaveAttribute('href', 'https://example.com');

    fireEvent.click(playbookLink);
    expect(track).toHaveBeenCalledWith('playbook_link_clicked', { slug: 'cobra-vs-marketplace-insurance' });

    fireEvent.click(externalLink);
    expect(track).toHaveBeenCalledTimes(1);
  });

  it('does not linkify URLs in user messages', () => {
    const messages = [{ role: 'user', content: 'I saw https://hyrly.ai/playbook/severance', ts: '2026-05-22T11:20:00Z' }];
    render(<ScoutChat messages={messages} onSendMessage={() => {}} onBack={() => {}} isThinking={false} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('calls onBack when the back button is clicked', () => {
    const onBack = vi.fn();
    render(<ScoutChat messages={SAMPLE_MESSAGES} onSendMessage={() => {}} onBack={onBack} isThinking={false} />);
    fireEvent.click(screen.getByRole('button', { name: /back to plan/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  describe('topic chips', () => {
    it('renders 5 topic chips below the opener regardless of opener content', () => {
      render(<ScoutChat messages={OPENER_ONLY} onSendMessage={() => {}} onBack={() => {}} isThinking={false} />);
      expect(screen.getByRole('button', { name: /Visa & H-1B/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Severance$/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Finances$/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Resume & LinkedIn/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Career direction/ })).toBeInTheDocument();
    });

    it('tapping a chip sends a topic-keyword-rich message that routes via intent detection', () => {
      const onSendMessage = vi.fn();
      render(<ScoutChat messages={OPENER_ONLY} onSendMessage={onSendMessage} onBack={() => {}} isThinking={false} />);
      fireEvent.click(screen.getByRole('button', { name: /^Severance$/ }));
      expect(onSendMessage).toHaveBeenCalledWith('How do I negotiate severance?');
    });

    it('hides chips after the user has replied', () => {
      const messages = [
        ...OPENER_ONLY,
        { role: 'user', content: 'my visa', ts: '2026-05-22T11:21:00Z' },
      ];
      render(<ScoutChat messages={messages} onSendMessage={() => {}} onBack={() => {}} isThinking={false} />);
      expect(screen.queryByRole('button', { name: /^Severance$/ })).not.toBeInTheDocument();
    });

    it('hides chips while thinking (prevents double-tap)', () => {
      render(<ScoutChat messages={OPENER_ONLY} onSendMessage={() => {}} onBack={() => {}} isThinking={true} />);
      expect(screen.queryByRole('button', { name: /^Severance$/ })).not.toBeInTheDocument();
    });

    it('does not render chips on follow-up scout messages', () => {
      const messages = [
        ...OPENER_ONLY,
        { role: 'user', content: 'tell me about severance', ts: '2026-05-22T11:21:00Z' },
        { role: 'scout', content: 'Severance details…', ts: '2026-05-22T11:21:30Z' },
      ];
      render(<ScoutChat messages={messages} onSendMessage={() => {}} onBack={() => {}} isThinking={false} />);
      expect(screen.queryByRole('button', { name: /^Severance$/ })).not.toBeInTheDocument();
    });
  });
});

describe('getOpenerChips', () => {
  it('returns 5 chips for a single scout opener', () => {
    const chips = getOpenerChips([{ role: 'scout', content: 'hi' }], false);
    expect(chips).toHaveLength(5);
    expect(chips.map((c) => c.label)).toEqual(['Visa & H-1B', 'Severance', 'Finances', 'Resume & LinkedIn', 'Career direction']);
  });

  it('returns [] when there are multiple messages', () => {
    expect(getOpenerChips([{ role: 'scout', content: 'hi' }, { role: 'user', content: 'hey' }], false)).toEqual([]);
  });

  it('returns [] when thinking', () => {
    expect(getOpenerChips([{ role: 'scout', content: 'hi' }], true)).toEqual([]);
  });

  it('returns [] for empty messages', () => {
    expect(getOpenerChips([], false)).toEqual([]);
  });

  it('returns [] when first message is from user', () => {
    expect(getOpenerChips([{ role: 'user', content: 'hi' }], false)).toEqual([]);
  });
});
