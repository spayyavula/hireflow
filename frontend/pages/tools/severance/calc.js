// Severance estimate calculator for laid-off US tech employees.
// Pure deterministic math — no LLM, no API call. Same voice / numbers as the
// /playbook/negotiate-severance-tech-layoff article so the tool and the
// article reinforce each other.
//
// Inputs:
//   salary            (number, USD/year, gross base only — no equity/bonus)
//   tenureYears       (number, fractional years allowed)
//   level             ('junior' | 'mid' | 'senior' | 'staff_plus' | 'director_plus')
//   tier              ('faang' | 'public' | 'series_b_d' | 'pre_series_b' | 'other')
//   groupLayoffSize   ('single' | 'small' | 'warn')   warn = 50+ at one site
//   hasUnvestedRSUs   (boolean)
//   isAge40Plus       (boolean — ADEA/OWBPA protection)
//   initialOffer      (number | null, USD total cash if provided)
//
// Returns null on invalid input; otherwise:
//   { baseWeeksLow, baseWeeksMid, baseWeeksHigh,
//     baseCashLow, baseCashMid, baseCashHigh,
//     totalLow, totalMid, totalHigh,
//     cobraEstimateLow, cobraEstimateHigh,
//     rsuNote, leverageFactors, breakdown, counterRecommendation }

// Weeks-of-pay per year of tenure, by company tier.
// Ranges reflect the bands the playbook article cites: FAANG/big-tech runs
// notably more generous than series_b_d; pre-series-B floors are thinner.
export const WEEKS_PER_YEAR_BY_TIER = {
  faang:         { low: 2, high: 3 },
  public:        { low: 1.5, high: 2.5 },
  series_b_d:    { low: 1, high: 2 },
  pre_series_b:  { low: 0.5, high: 1.5 },
  other:         { low: 1, high: 2 },
};

// Minimum (floor) weeks of cash severance regardless of tenure.
export const BASE_FLOOR_WEEKS = {
  faang:        8,
  public:       6,
  series_b_d:   4,
  pre_series_b: 2,
  other:        4,
};

// Approximate monthly COBRA premium for a single laid-off engineer's
// medical coverage (employer-share + employee-share + 2% admin fee).
// Real numbers vary by plan; this is a defensible "talking-point" range.
const COBRA_MONTHLY = { low: 900, high: 1500 };

// Months of COBRA the *standard* package usually waives or reimburses.
const COBRA_MONTHS_LOW = 3;
const COBRA_MONTHS_HIGH = 6;

// Maximum tenure years we'll honor in the math (prevents 99-year inputs
// from producing nonsense; nobody's tenure-to-multiplier scales linearly
// past ~30 yrs anyway).
const TENURE_CLAMP_YEARS = 30;

// Leverage bumps — fraction of the cash-mid added to the *high* end of
// the range when the corresponding factor applies. WARN > ADEA because
// WARN comes with statutory damages exposure for the company.
export const LEVERAGE_BUMP_FRACTION = {
  warn: 0.25,
  adea: 0.15,
};

function _resolveTier(t) {
  return Object.prototype.hasOwnProperty.call(WEEKS_PER_YEAR_BY_TIER, t)
    ? t
    : 'series_b_d';
}

function _validate(inputs) {
  if (!inputs || typeof inputs !== 'object') return null;
  const salary = Number(inputs.salary);
  if (!Number.isFinite(salary) || salary <= 0) return null;
  return {
    salary,
    tenureYears: Math.min(
      TENURE_CLAMP_YEARS,
      Math.max(0, Number(inputs.tenureYears) || 0),
    ),
    level: inputs.level || 'senior',
    tier: _resolveTier(inputs.tier),
    groupLayoffSize: inputs.groupLayoffSize || 'single',
    hasUnvestedRSUs: !!inputs.hasUnvestedRSUs,
    isAge40Plus: !!inputs.isAge40Plus,
    initialOffer: inputs.initialOffer == null ? null : Number(inputs.initialOffer) || null,
  };
}

function _weeksRange(tenureYears, tier) {
  const mult = WEEKS_PER_YEAR_BY_TIER[tier];
  const floor = BASE_FLOOR_WEEKS[tier];
  const rawLow = tenureYears * mult.low;
  const rawHigh = tenureYears * mult.high;
  const rawMid = (rawLow + rawHigh) / 2;
  return {
    low: Math.max(floor * 0.75, rawLow),    // floor relaxed slightly for low end
    mid: Math.max(floor, rawMid),
    high: Math.max(floor * 1.25, rawHigh),  // high end gets headroom above floor
  };
}

function _counterRecommendation(initialOffer, totalMid, totalHigh) {
  if (initialOffer == null) return null;
  const shouldCounter = initialOffer < totalMid * 0.95;
  const counterAmount = shouldCounter
    ? Math.round(Math.max(totalMid, initialOffer * 1.2))
    : null;
  // Non-cash asks are universal — even if the cash number is solid, these
  // are typically free wins for the company to grant.
  const nonCashAsks = [
    'Extended COBRA contribution (3-6 months if not already included)',
    'Extended post-termination ISO exercise window (default 90 days → 7-10 years)',
    'RSU vesting acceleration through end of current quarter',
    'Mutually agreed reference statement + LinkedIn endorsement',
    'Pro-rated bonus if you\'re past 50% of the bonus year',
    'Removal of non-compete / non-solicitation clauses',
  ];
  return { shouldCounter, counterAmount, nonCashAsks };
}

export function calcSeverance(inputs) {
  const v = _validate(inputs);
  if (!v) return null;

  const weekly = v.salary / 52;
  const weeks = _weeksRange(v.tenureYears, v.tier);

  const baseCashLow = Math.round(weekly * weeks.low);
  const baseCashMid = Math.round(weekly * weeks.mid);
  const baseCashHigh = Math.round(weekly * weeks.high);

  // Leverage bumps adjust ONLY the high end (these are "ask for more" levers).
  let highBumpFraction = 0;
  const leverageFactors = [];
  if (v.groupLayoffSize === 'warn') {
    highBumpFraction += LEVERAGE_BUMP_FRACTION.warn;
    leverageFactors.push('warn');
  }
  if (v.isAge40Plus) {
    highBumpFraction += LEVERAGE_BUMP_FRACTION.adea;
    leverageFactors.push('adea');
  }
  if (v.hasUnvestedRSUs) {
    leverageFactors.push('rsu');  // RSU value is separate; flagged in the note
  }

  const totalLow = baseCashLow;
  const totalMid = baseCashMid;
  const totalHigh = Math.round(baseCashHigh * (1 + highBumpFraction));

  const cobraEstimateLow = COBRA_MONTHLY.low * COBRA_MONTHS_LOW;
  const cobraEstimateHigh = COBRA_MONTHLY.high * COBRA_MONTHS_HIGH;

  const rsuNote = v.hasUnvestedRSUs
    ? 'Equity acceleration is the highest-value non-cash ask. At senior+ levels, accelerating one quarter of vesting often unlocks $20-80k+ depending on grant size and current price. Always ask — the cost to the company is small relative to the cash equivalent.'
    : '';

  const tierMult = WEEKS_PER_YEAR_BY_TIER[v.tier];
  const floor = BASE_FLOOR_WEEKS[v.tier];
  const breakdown = [
    `Tier "${v.tier}" pays ${tierMult.low}-${tierMult.high} weeks per year of tenure.`,
    `${v.tenureYears} year(s) of tenure → ${(v.tenureYears * tierMult.low).toFixed(1)}-${(v.tenureYears * tierMult.high).toFixed(1)} weeks before floor.`,
    `Tier floor is ${floor} weeks regardless of tenure.`,
    `Final cash range: ${weeks.low.toFixed(1)}-${weeks.high.toFixed(1)} weeks × $${Math.round(weekly).toLocaleString()}/week = $${baseCashLow.toLocaleString()}-$${baseCashHigh.toLocaleString()}.`,
  ];
  if (leverageFactors.includes('warn')) {
    breakdown.push(`WARN Act exposure (50+ layoff at one site) adds ~${Math.round(LEVERAGE_BUMP_FRACTION.warn * 100)}% to the high end.`);
  }
  if (leverageFactors.includes('adea')) {
    breakdown.push(`ADEA/OWBPA protection (age 40+) adds ~${Math.round(LEVERAGE_BUMP_FRACTION.adea * 100)}% to the high end.`);
  }
  if (leverageFactors.includes('rsu')) {
    breakdown.push('Unvested RSUs — see equity-acceleration note; not included in the cash total.');
  }

  return {
    baseWeeksLow: weeks.low,
    baseWeeksMid: weeks.mid,
    baseWeeksHigh: weeks.high,
    baseCashLow,
    baseCashMid,
    baseCashHigh,
    totalLow,
    totalMid,
    totalHigh,
    cobraEstimateLow,
    cobraEstimateHigh,
    rsuNote,
    leverageFactors,
    breakdown,
    counterRecommendation: _counterRecommendation(
      v.initialOffer, totalMid, totalHigh,
    ),
  };
}
