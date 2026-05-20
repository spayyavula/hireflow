import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TriagePlan } from './TriagePlan';

const SAMPLE_PLAN = {
  summary: "You're a Senior engineer, laid off in the last week...",
  suggested_first_topic: 'career_exploration',
  actions: [
    {
      priority: 1, title: 'Negotiate severance',
      why: 'First offer is never final.', how: 'Don\'t sign for 48 hours.', eta: '48 hours',
    },
    {
      priority: 2, title: 'File for unemployment',
      why: 'Processing takes 1-3 weeks.', how: 'Your state UI portal.', eta: '20 minutes',
    },
  ],
};

describe('TriagePlan', () => {
  it('renders the summary', () => {
    render(<TriagePlan plan={SAMPLE_PLAN} onStartScout={() => {}} />);
    expect(screen.getByText(/Senior engineer/)).toBeInTheDocument();
  });

  it('renders all action items in priority order', () => {
    render(<TriagePlan plan={SAMPLE_PLAN} onStartScout={() => {}} />);
    expect(screen.getByText('Negotiate severance')).toBeInTheDocument();
    expect(screen.getByText('File for unemployment')).toBeInTheDocument();
    expect(screen.getByText(/First offer is never final/)).toBeInTheDocument();
    expect(screen.getByText(/Your state UI portal/)).toBeInTheDocument();
  });

  it('calls onStartScout with the plan when the Scout CTA is clicked', () => {
    const onStartScout = vi.fn();
    render(<TriagePlan plan={SAMPLE_PLAN} onStartScout={onStartScout} />);
    fireEvent.click(screen.getByText(/Talk to Scout AI/i));
    expect(onStartScout).toHaveBeenCalledWith(SAMPLE_PLAN);
  });
});
