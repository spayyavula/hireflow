import { describe, it, expect } from 'vitest';
import { QUESTIONS, QUESTION_IDS } from './questions';

describe('triage questions', () => {
  it('has exactly 10 questions', () => {
    expect(QUESTIONS).toHaveLength(10);
  });

  it('every question has id, prompt, options', () => {
    for (const q of QUESTIONS) {
      expect(q.id).toBeTypeOf('string');
      expect(q.id.length).toBeGreaterThan(0);
      expect(q.prompt).toBeTypeOf('string');
      expect(Array.isArray(q.options)).toBe(true);
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      for (const opt of q.options) {
        expect(opt.value).toBeTypeOf('string');
        expect(opt.label).toBeTypeOf('string');
      }
    }
  });

  it('question ids match the backend TriageAnswers schema field names', () => {
    // Hard-coded reference: keep in lockstep with backend/api/models/schemas.py TriageAnswers
    const expected = [
      'laid_off_when', 'role', 'level', 'company_tier', 'severance_runway',
      'visa_status', 'location_flexibility', 'resume_state', 'network_state', 'top_concern',
    ];
    expect(QUESTION_IDS).toEqual(expected);
  });

  it('exports QUESTION_IDS in the same order as QUESTIONS', () => {
    expect(QUESTION_IDS).toEqual(QUESTIONS.map((q) => q.id));
  });

  it('option values match the backend enum values', () => {
    const byId = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));
    const values = (id) => byId[id].options.map((o) => o.value);

    expect(values('laid_off_when')).toContain('today');
    expect(values('laid_off_when')).toContain('1-7d');
    expect(values('visa_status')).toContain('h1b');
    expect(values('severance_runway')).toContain('none');
    expect(values('top_concern')).toContain('direction');
  });
});
