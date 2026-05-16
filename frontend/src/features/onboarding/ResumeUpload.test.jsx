import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ResumeUpload from './ResumeUpload';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) })));
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});
afterEach(() => { vi.unstubAllGlobals(); });

describe('ResumeUpload', () => {
  it('renders the upload screen without crashing', () => {
    render(<ResumeUpload onComplete={() => {}} onBack={() => {}} />);
    expect(screen.getByRole('heading', { name: /upload your resume/i })).toBeTruthy();
  });
});
