import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScoutChat } from './ScoutChat';

const SAMPLE_MESSAGES = [
  { role: 'scout', content: 'Hey, sorry you\'re dealing with this. What\'s most pressing?', ts: '2026-05-20T10:00:00Z' },
  { role: 'user', content: 'my visa', ts: '2026-05-20T10:01:00Z' },
  { role: 'scout', content: 'On the H-1B side: 60 days from your last day...', ts: '2026-05-20T10:01:30Z' },
];

describe('ScoutChat', () => {
  it('renders every message in order', () => {
    render(<ScoutChat messages={SAMPLE_MESSAGES} onSendMessage={() => {}} isThinking={false} />);
    expect(screen.getByText(/sorry you're dealing with this/i)).toBeInTheDocument();
    expect(screen.getByText(/my visa/i)).toBeInTheDocument();
    expect(screen.getByText(/On the H-1B side/i)).toBeInTheDocument();
  });

  it('calls onSendMessage when send is clicked', () => {
    const onSendMessage = vi.fn();
    render(<ScoutChat messages={SAMPLE_MESSAGES} onSendMessage={onSendMessage} isThinking={false} />);
    const input = screen.getByPlaceholderText(/ask Scout/i);
    fireEvent.change(input, { target: { value: 'tell me more about AC-21' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    expect(onSendMessage).toHaveBeenCalledWith('tell me more about AC-21');
  });

  it('disables send when input is empty', () => {
    render(<ScoutChat messages={SAMPLE_MESSAGES} onSendMessage={() => {}} isThinking={false} />);
    const button = screen.getByRole('button', { name: /send/i });
    expect(button).toBeDisabled();
  });

  it('disables input + shows indicator while thinking', () => {
    render(<ScoutChat messages={SAMPLE_MESSAGES} onSendMessage={() => {}} isThinking={true} />);
    const input = screen.getByPlaceholderText(/ask Scout/i);
    expect(input).toBeDisabled();
    expect(screen.getByText(/scout is thinking/i)).toBeInTheDocument();
  });

  it('clears input after sending', () => {
    const onSendMessage = vi.fn();
    render(<ScoutChat messages={SAMPLE_MESSAGES} onSendMessage={onSendMessage} isThinking={false} />);
    const input = screen.getByPlaceholderText(/ask Scout/i);
    fireEvent.change(input, { target: { value: 'a question' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    expect(input.value).toBe('');
  });

  it('sends on Enter key in input', () => {
    const onSendMessage = vi.fn();
    render(<ScoutChat messages={SAMPLE_MESSAGES} onSendMessage={onSendMessage} isThinking={false} />);
    const input = screen.getByPlaceholderText(/ask Scout/i);
    fireEvent.change(input, { target: { value: 'enter test' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(onSendMessage).toHaveBeenCalledWith('enter test');
  });
});
