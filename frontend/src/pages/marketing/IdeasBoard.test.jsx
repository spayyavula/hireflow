import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import IdeasBoard from './IdeasBoard';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) })));
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});
afterEach(() => { vi.unstubAllGlobals(); });

describe('IdeasBoard', () => {
  it('renders without crashing', () => {
    render(<IdeasBoard onGetStarted={() => {}} onSignIn={() => {}} onNavigate={() => {}} currentPage="roadmap" user={null} />);
    expect(screen.getAllByRole('heading').length).toBeGreaterThan(0);
  });
});
