import { describe, it, expect } from 'vitest';
import { calculateStrength, DEFAULT_STRENGTH_CONFIG } from '../src/lib/strength';
import { Person } from '../src/types';

describe('Relationship Strength Calculation Engine', () => {
  const baseDate = new Date('2026-10-01T00:00:00Z');

  it('calculates strength correctly for a minimal person with default values', () => {
    const person: Person = {
      id: 'p1',
      name: 'Alex',
      category: 'friend',
      closeness: 3
    };

    const result = calculateStrength(person, DEFAULT_STRENGTH_CONFIG, baseDate);

    // base = (3-1)/4 = 0.5
    // frequency default = monthly (0.5)
    // recency default = 1.0 (no date)
    // rawStrength = 0.6*0.5 + 0.25*0.5 + 0.15*1.0 = 0.3 + 0.125 + 0.15 = 0.575
    // categoryFloor = 0
    // finalStrength = 0.575
    expect(result.base).toBeCloseTo(0.5);
    expect(result.frequency).toBeCloseTo(0.5);
    expect(result.recency).toBeCloseTo(1.0);
    expect(result.categoryFloor).toBe(0);
    expect(result.finalStrength).toBeCloseTo(0.575);
    // targetRadius = 700 - 0.575 * (700 - 120) = 700 - 333.5 = 366.5
    expect(result.targetRadius).toBeCloseTo(366.5);
  });

  it('enforces category floor for partner and family', () => {
    const partner: Person = {
      id: 'p2',
      name: 'Taylor',
      category: 'partner',
      closeness: 1, // lowest closeness
      contactFrequency: 'rarely', // 0.1
      lastContact: '2025-01-01T00:00:00Z' // old contact date
    };

    const result = calculateStrength(partner, DEFAULT_STRENGTH_CONFIG, baseDate);
    // partner category floor is 0.70
    expect(result.categoryFloor).toBe(0.70);
    expect(result.finalStrength).toBeGreaterThanOrEqual(0.70);
    expect(result.finalStrength).toBe(0.70);

    const family: Person = {
      id: 'p3',
      name: 'Mom',
      category: 'family',
      closeness: 1,
      contactFrequency: 'rarely'
    };

    const familyResult = calculateStrength(family, DEFAULT_STRENGTH_CONFIG, baseDate);
    // family category floor is 0.55
    expect(familyResult.categoryFloor).toBe(0.55);
    expect(familyResult.finalStrength).toBeGreaterThanOrEqual(0.55);
  });

  it('handles recency exponential decay properly', () => {
    const person90DaysAgo: Person = {
      id: 'p4',
      name: 'Sam',
      category: 'friend',
      closeness: 5,
      contactFrequency: 'daily',
      lastContact: new Date(baseDate.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
    };

    const result = calculateStrength(person90DaysAgo, DEFAULT_STRENGTH_CONFIG, baseDate);
    // exp(-90/90) = e^-1 ≈ 0.367879
    expect(result.recency).toBeCloseTo(Math.exp(-1));
  });

  it('calculates maximum strength (1.0) and minimum radius (120) for top closeness, daily contact, recent touch', () => {
    const personMax: Person = {
      id: 'p5',
      name: 'Bestie',
      category: 'close_friend',
      closeness: 5,
      contactFrequency: 'daily',
      lastContact: '2026-10-01T00:00:00Z'
    };

    const result = calculateStrength(personMax, DEFAULT_STRENGTH_CONFIG, baseDate);
    // base = 1.0, freq = 1.0, recency = 1.0 -> raw = 1.0
    expect(result.finalStrength).toBeCloseTo(1.0);
    expect(result.targetRadius).toBeCloseTo(120);
  });

  it('allows custom configuration weights', () => {
    const customConfig = {
      ...DEFAULT_STRENGTH_CONFIG,
      weights: { base: 1.0, frequency: 0.0, recency: 0.0 }
    };
    const person: Person = {
      id: 'p6',
      name: 'Custom',
      category: 'acquaintance',
      closeness: 4
    };
    const result = calculateStrength(person, customConfig, baseDate);
    // base = (4-1)/4 = 0.75
    expect(result.finalStrength).toBeCloseTo(0.75);
  });
});
