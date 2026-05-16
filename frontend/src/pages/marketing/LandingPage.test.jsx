import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import LandingPage from './LandingPage';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) })));
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});
afterEach(() => { vi.unstubAllGlobals(); });

describe('LandingPage', () => {
  it('renders without crashing', () => {
    render(<LandingPage onGetStarted={() => {}} onSignIn={() => {}} onNavigate={() => {}} currentPage="landing" />);
    expect(screen.getAllByRole('heading').length).toBeGreaterThan(0);
  });
});
