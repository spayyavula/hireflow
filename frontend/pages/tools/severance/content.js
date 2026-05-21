// Single source of truth for the /tools/severance page: form-option labels
// + FAQ Q&A used in BOTH the visible page UI (+Page.jsx) and the FAQPage
// JSON-LD (+Head.jsx). Google requires the rendered Q&A and the structured
// data to match exactly for rich-result eligibility.

export const LEVEL_OPTIONS = [
  { value: 'junior',          label: 'Junior (L3 / Software Engineer I)' },
  { value: 'mid',             label: 'Mid-level (L4 / Software Engineer II)' },
  { value: 'senior',          label: 'Senior (L5 / Senior Engineer)' },
  { value: 'staff_plus',      label: 'Staff+ (L6 / Staff or Principal Engineer)' },
  { value: 'director_plus',   label: 'Director or above' },
];

export const TIER_OPTIONS = [
  { value: 'faang',           label: 'FAANG / Big tech (Meta, Google, Apple, Amazon, Microsoft, Netflix)' },
  { value: 'public',          label: 'Public company (other than FAANG)' },
  { value: 'series_b_d',      label: 'Series B-D startup' },
  { value: 'pre_series_b',    label: 'Pre-Series B (seed/Series A) startup' },
  { value: 'other',           label: 'Other / non-tech' },
];

export const GROUP_LAYOFF_OPTIONS = [
  { value: 'single',          label: 'Just me (or a small handful)' },
  { value: 'small',           label: 'Small group (10-49 people at my site)' },
  { value: 'warn',            label: '50+ at one site (WARN Act applies)' },
];

export const FAQS = [
  {
    q: 'How do I calculate severance pay after a tech layoff?',
    a: 'There is no federal mandate for severance pay in the US — packages are discretionary. The market norm at tech companies is roughly 1-3 weeks of base salary per year of tenure, with a floor (typically 4-8 weeks for big tech, 2-4 weeks for startups) and a ceiling around 26 weeks regardless of tenure. RSU acceleration, COBRA contribution, and pro-rated bonuses are layered on top. This calculator gives you a range based on tier, level, tenure, and leverage factors so you can sanity-check what you\'re offered.',
  },
  {
    q: 'What\'s a typical severance package for a tech engineer?',
    a: 'For a senior engineer (L5) with 4 years at a Series B-D startup, the cash base is usually 6-12 weeks of pay ($25-50k at a $200k salary). FAANG ranges are notably higher (12-20+ weeks at the same tenure due to higher per-year multipliers and an 8-week floor). Add 3-6 months of COBRA contribution, possible RSU acceleration through quarter-end, and a pro-rated bonus if you\'re past mid-year. The calculator on this page produces a tier- and tenure-specific estimate.',
  },
  {
    q: 'Should I accept the first severance offer?',
    a: 'Almost never — at least not in the first 48-72 hours. Companies expect counter-offers and HR usually has authority to improve packages within a defined band; about 60-70% of laid-off engineers don\'t counter, which is the asymmetry you can benefit from. Read the agreement carefully (especially the non-compete and release-of-claims sections), and if any of the leverage factors below apply, hire an employment attorney for $400-800 to review — typical ROI is 5-20×.',
  },
  {
    q: 'How much severance is negotiable?',
    a: 'The cash duration is usually the least flexible piece; the non-cash terms are where most negotiations actually move the dial. High-leverage asks: RSU acceleration through end of current quarter (often $20-80k+ at senior+), pro-rated bonus, extended COBRA contribution (3-6 months), extended post-termination ISO exercise window (90 days → 7-10 years costs the company nothing), and removal of non-compete clauses. Cash itself is usually negotiable by 2-4 weeks if any of the major leverage factors apply.',
  },
  {
    q: 'Does RSU acceleration count as severance?',
    a: 'Legally it\'s separate — equity acceleration is a modification to your existing equity grant, not severance pay. But for negotiation purposes you should think of it as part of your total package. At senior+ levels with meaningful unvested equity, accelerating one quarter of vesting often unlocks $20-80k+ of value. Always ask for it; the marginal cost to the company is small relative to the cash value you receive.',
  },
  {
    q: 'What is the WARN Act and how does it affect my severance?',
    a: 'The Worker Adjustment and Retraining Notification (WARN) Act requires employers with 100+ employees to give 60 days\' notice before a "mass layoff" — defined as 50+ employees at a single site. If your layoff is WARN-eligible and the company didn\'t give the full 60 days\' notice, you\'re entitled to pay and benefits for the notice period the company skipped. This is a statutory entitlement, not a negotiation; it stacks on top of any severance package. California, New York, New Jersey, and Illinois have stricter state-level versions (mini-WARN) that lower the headcount threshold.',
  },
];
