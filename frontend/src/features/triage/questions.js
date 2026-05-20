// 10-question Layoff Triage. Order is the wizard order.
// Question ids and option values MUST stay in lockstep with the backend
// TriageAnswers Pydantic model in backend/api/models/schemas.py.

export const QUESTIONS = [
  {
    id: 'laid_off_when',
    prompt: 'When were you laid off?',
    options: [
      { value: 'today', label: 'Today or yesterday' },
      { value: '1-7d', label: '1–7 days ago' },
      { value: '8-30d', label: '8–30 days ago' },
      { value: '31-90d', label: '1–3 months ago' },
      { value: '90+d', label: 'More than 3 months ago' },
    ],
  },
  {
    id: 'role',
    prompt: 'What was your role?',
    options: [
      { value: 'engineer', label: 'Software engineer' },
      { value: 'em', label: 'Engineering manager' },
      { value: 'pm', label: 'Product manager' },
      { value: 'designer', label: 'Designer' },
      { value: 'data', label: 'Data / ML / Analytics' },
      { value: 'other', label: 'Other tech role' },
    ],
  },
  {
    id: 'level',
    prompt: 'What level were you at?',
    options: [
      { value: 'junior', label: 'Junior (0–3 yrs)' },
      { value: 'mid', label: 'Mid-level (3–7 yrs)' },
      { value: 'senior', label: 'Senior (7–15 yrs)' },
      { value: 'staff_plus', label: 'Staff+ / Director / VP (15+ yrs)' },
    ],
  },
  {
    id: 'company_tier',
    prompt: 'What kind of company were you at?',
    options: [
      { value: 'faang', label: 'FAANG / Big Tech' },
      { value: 'public', label: 'Other public tech company' },
      { value: 'series_b_d', label: 'Series B–D startup' },
      { value: 'pre_series_b', label: 'Pre-Series B startup' },
      { value: 'other', label: 'Other (consulting, agency, non-tech, etc.)' },
    ],
  },
  {
    id: 'severance_runway',
    prompt: 'How long is your runway?',
    subtitle: 'Counting severance + savings, how long before you NEED a paycheck?',
    options: [
      { value: 'none', label: 'No severance, tight savings' },
      { value: 'lt_8w', label: 'Less than 8 weeks' },
      { value: '8_16w', label: '8–16 weeks (2–4 months)' },
      { value: '16w_plus', label: '16+ weeks' },
    ],
  },
  {
    id: 'visa_status',
    prompt: 'What\'s your work-authorization status in the US?',
    options: [
      { value: 'citizen_gc', label: 'US citizen or green card' },
      { value: 'h1b', label: 'H-1B — need a new sponsor' },
      { value: 'opt', label: 'F-1 OPT / STEM OPT' },
      { value: 'other_temp', label: 'Other temporary visa' },
    ],
  },
  {
    id: 'location_flexibility',
    prompt: 'How flexible is your location?',
    options: [
      { value: 'same_metro', label: 'Same metro only' },
      { value: 'us_relocate', label: 'Open to relocating in the US' },
      { value: 'remote_us', label: 'Remote US only' },
      { value: 'international', label: 'Open to international' },
    ],
  },
  {
    id: 'resume_state',
    prompt: 'How current is your resume?',
    options: [
      { value: 'up_to_date', label: 'Up to date — ready to send' },
      { value: 'needs_rewrite', label: 'Needs a rewrite' },
      { value: 'not_started', label: 'Haven\'t started' },
      { value: 'unsure', label: 'Not sure' },
    ],
  },
  {
    id: 'network_state',
    prompt: 'How\'s your network?',
    options: [
      { value: 'warm_intros', label: 'Have warm intros lined up' },
      { value: 'cold_contacts', label: 'Have contacts but mostly cold' },
      { value: 'limited', label: 'Limited — small network' },
      { value: 'rebuild', label: 'Need to rebuild from scratch' },
    ],
  },
  {
    id: 'top_concern',
    prompt: 'What\'s the #1 thing keeping you up at night?',
    options: [
      { value: 'finances', label: 'Finances / runway' },
      { value: 'visa', label: 'Visa clock' },
      { value: 'imposter', label: 'Imposter syndrome / confidence' },
      { value: 'direction', label: 'What I want to do next' },
      { value: 'family', label: 'Family / partner pressure' },
      { value: 'other', label: 'Something else' },
    ],
  },
];

export const QUESTION_IDS = QUESTIONS.map((q) => q.id);
