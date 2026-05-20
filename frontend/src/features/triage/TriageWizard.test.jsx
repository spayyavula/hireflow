import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TriageWizard } from './TriageWizard';
import { QUESTIONS } from './questions';

describe('TriageWizard', () => {
  it('renders the first question initially', () => {
    render(<TriageWizard onComplete={() => {}} />);
    expect(screen.getByText(QUESTIONS[0].prompt)).toBeInTheDocument();
    expect(screen.getByText(/Question 1 of 10/i)).toBeInTheDocument();
  });

  it('advances to the next question when an option is clicked', () => {
    render(<TriageWizard onComplete={() => {}} />);
    fireEvent.click(screen.getByText(QUESTIONS[0].options[0].label));
    expect(screen.getByText(QUESTIONS[1].prompt)).toBeInTheDocument();
    expect(screen.getByText(/Question 2 of 10/i)).toBeInTheDocument();
  });

  it('renders a back button after question 1 that returns to the previous question', () => {
    render(<TriageWizard onComplete={() => {}} />);
    fireEvent.click(screen.getByText(QUESTIONS[0].options[0].label));  // advance
    fireEvent.click(screen.getByText(/Back/i));
    expect(screen.getByText(QUESTIONS[0].prompt)).toBeInTheDocument();
  });

  it('calls onComplete with all 10 answers when the last question is answered', () => {
    const onComplete = vi.fn();
    render(<TriageWizard onComplete={onComplete} />);
    // Click the first option of every question in sequence.
    for (let i = 0; i < QUESTIONS.length; i++) {
      fireEvent.click(screen.getByText(QUESTIONS[i].options[0].label));
    }
    expect(onComplete).toHaveBeenCalledOnce();
    const answers = onComplete.mock.calls[0][0];
    for (const q of QUESTIONS) {
      expect(answers[q.id]).toBe(q.options[0].value);
    }
  });
});
