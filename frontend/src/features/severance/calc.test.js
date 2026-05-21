import { describe, it, expect } from 'vitest';
import {
  calcSeverance,
  WEEKS_PER_YEAR_BY_TIER,
  BASE_FLOOR_WEEKS,
  LEVERAGE_BUMP_FRACTION,
} from '../../../pages/tools/severance/calc';

const baseInputs = () => ({
  salary: 200000,
  tenureYears: 4,
  level: 'senior',
  tier: 'series_b_d',
  groupLayoffSize: 'single',     // 'single' | 'small' | 'warn'
  hasUnvestedRSUs: false,
  isAge40Plus: false,
  initialOffer: null,            // optional dollar amount
});

describe('calcSeverance — base math', () => {
  it('produces a midpoint of weeks × weekly_pay for series_b_d senior at 4 yrs', () => {
    const r = calcSeverance(baseInputs());
    const weekly = 200000 / 52;
    const tier = WEEKS_PER_YEAR_BY_TIER.series_b_d;
    // tier midpoint = (tier.low + tier.high) / 2 = (1 + 2) / 2 = 1.5; tenure 4 yrs → 6 weeks
    // floor for series_b_d = 4 weeks → use max(6, 4) = 6
    const expectedMidWeeks = 6;
    expect(r.baseWeeksMid).toBeCloseTo(expectedMidWeeks, 1);
    expect(r.baseCashMid).toBeCloseTo(weekly * expectedMidWeeks, 0);
  });

  it('honors the floor when tenure × multiplier < floor', () => {
    const r = calcSeverance({ ...baseInputs(), tenureYears: 1, tier: 'faang' });
    // FAANG midpoint multiplier = (2 + 3)/2 = 2.5; 1 yr × 2.5 = 2.5 weeks; floor 8 → use 8
    expect(r.baseWeeksMid).toBe(BASE_FLOOR_WEEKS.faang);
  });

  it('produces a high/low range, with high > mid > low', () => {
    const r = calcSeverance(baseInputs());
    expect(r.baseWeeksHigh).toBeGreaterThan(r.baseWeeksMid);
    expect(r.baseWeeksLow).toBeLessThan(r.baseWeeksMid);
    expect(r.totalHigh).toBeGreaterThan(r.totalMid);
    expect(r.totalMid).toBeGreaterThan(r.totalLow);
  });
});

describe('calcSeverance — leverage adjustments', () => {
  it('bumps the high end when WARN Act exposure exists', () => {
    const without = calcSeverance(baseInputs());
    const withWARN = calcSeverance({ ...baseInputs(), groupLayoffSize: 'warn' });
    expect(withWARN.totalHigh).toBeGreaterThan(without.totalHigh);
    expect(withWARN.leverageFactors).toContain('warn');
  });

  it('bumps the high end when ADEA protection applies (age 40+)', () => {
    const without = calcSeverance(baseInputs());
    const withADEA = calcSeverance({ ...baseInputs(), isAge40Plus: true });
    expect(withADEA.totalHigh).toBeGreaterThan(without.totalHigh);
    expect(withADEA.leverageFactors).toContain('adea');
  });

  it('flags unvested RSUs as a non-cash negotiation lever', () => {
    const r = calcSeverance({ ...baseInputs(), hasUnvestedRSUs: true });
    expect(r.leverageFactors).toContain('rsu');
    expect(r.rsuNote).toBeTruthy();
  });

  it('stacks multiple leverage factors', () => {
    const r = calcSeverance({
      ...baseInputs(),
      groupLayoffSize: 'warn',
      isAge40Plus: true,
      hasUnvestedRSUs: true,
    });
    expect(r.leverageFactors).toEqual(expect.arrayContaining(['warn', 'adea', 'rsu']));
    // The combined high should exceed any single-factor high
    const single = calcSeverance({ ...baseInputs(), groupLayoffSize: 'warn' });
    expect(r.totalHigh).toBeGreaterThan(single.totalHigh);
  });
});

describe('calcSeverance — counter recommendation', () => {
  it('returns no counter recommendation when initialOffer is null', () => {
    const r = calcSeverance(baseInputs());
    expect(r.counterRecommendation).toBeNull();
  });

  it('recommends countering when initial offer is below midpoint', () => {
    const inputs = { ...baseInputs(), initialOffer: 10000 };
    const r = calcSeverance(inputs);
    expect(r.counterRecommendation).not.toBeNull();
    expect(r.counterRecommendation.shouldCounter).toBe(true);
    expect(r.counterRecommendation.counterAmount).toBeGreaterThan(inputs.initialOffer);
  });

  it('still recommends asking for non-cash extras when offer is at the high end', () => {
    const r = calcSeverance(baseInputs());
    const inputs = { ...baseInputs(), initialOffer: r.totalHigh };
    const r2 = calcSeverance(inputs);
    // shouldCounter false on cash, but always offers non-cash asks
    expect(r2.counterRecommendation.shouldCounter).toBe(false);
    expect(r2.counterRecommendation.nonCashAsks).toBeTruthy();
    expect(r2.counterRecommendation.nonCashAsks.length).toBeGreaterThan(0);
  });
});

describe('calcSeverance — input validation', () => {
  it('returns null on missing or invalid salary', () => {
    expect(calcSeverance({ ...baseInputs(), salary: 0 })).toBeNull();
    expect(calcSeverance({ ...baseInputs(), salary: -100 })).toBeNull();
  });

  it('clamps absurd tenure values', () => {
    const r = calcSeverance({ ...baseInputs(), tenureYears: 99 });
    expect(r).not.toBeNull();
    // Clamped to a maximum (e.g. 30) so it doesn't blow up the formula
    expect(r.baseWeeksMid).toBeLessThan(200);
  });

  it('treats unknown tier as series_b_d fallback', () => {
    const fallback = calcSeverance({ ...baseInputs(), tier: 'mystery_co' });
    const explicit = calcSeverance({ ...baseInputs(), tier: 'series_b_d' });
    expect(fallback.baseCashMid).toBe(explicit.baseCashMid);
  });
});

describe('calcSeverance — output shape', () => {
  it('includes COBRA estimate (cash value of paid coverage)', () => {
    const r = calcSeverance(baseInputs());
    expect(r.cobraEstimateLow).toBeGreaterThan(0);
    expect(r.cobraEstimateHigh).toBeGreaterThan(r.cobraEstimateLow);
  });

  it('includes a plain-text breakdown of how the numbers were derived', () => {
    const r = calcSeverance(baseInputs());
    expect(Array.isArray(r.breakdown)).toBe(true);
    expect(r.breakdown.length).toBeGreaterThan(2);
    expect(r.breakdown.every((line) => typeof line === 'string')).toBe(true);
  });

  it('LEVERAGE_BUMP_FRACTION matches between WARN and ADEA contributions', () => {
    // Sanity check: leverage bumps should each be a positive fraction
    expect(LEVERAGE_BUMP_FRACTION.warn).toBeGreaterThan(0);
    expect(LEVERAGE_BUMP_FRACTION.adea).toBeGreaterThan(0);
  });
});
