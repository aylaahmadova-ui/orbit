import { Person, StrengthConfig, StrengthBreakdown, ContactFrequency, Category } from '../types';

export const DEFAULT_STRENGTH_CONFIG: StrengthConfig = {
  weights: {
    base: 0.60,
    frequency: 0.25,
    recency: 0.15
  },
  frequencyScores: {
    daily: 1.0,
    weekly: 0.75,
    monthly: 0.5,
    yearly: 0.25,
    rarely: 0.1
  },
  categoryFloors: {
    partner: 0.70,
    family: 0.55,
    close_friend: 0.0,
    friend: 0.0,
    colleague: 0.0,
    acquaintance: 0.0
  },
  minRadius: 120,
  maxRadius: 700
};

export function calculateStrength(
  person: Person,
  config: StrengthConfig = DEFAULT_STRENGTH_CONFIG,
  now: Date = new Date()
): StrengthBreakdown {
  // 1. Base score (closeness 1..5 mapped to 0..1)
  const clampedCloseness = Math.max(1, Math.min(5, person.closeness));
  const base = (clampedCloseness - 1) / 4;

  // 2. Frequency score
  const freqKey: ContactFrequency = person.contactFrequency || 'monthly';
  const frequency = config.frequencyScores[freqKey] ?? 0.5;

  // 3. Recency score
  let recency = 1.0;
  if (person.lastContact) {
    const contactDate = new Date(person.lastContact);
    if (!isNaN(contactDate.getTime())) {
      const diffMs = Math.max(0, now.getTime() - contactDate.getTime());
      const daysSince = diffMs / (1000 * 60 * 60 * 24);
      recency = Math.exp(-daysSince / 90);
    }
  }

  // 4. Category floor
  const categoryKey: Category = person.category;
  const categoryFloor = config.categoryFloors[categoryKey] ?? 0.0;

  // 5. Raw weighted sum
  const rawStrength =
    config.weights.base * base +
    config.weights.frequency * frequency +
    config.weights.recency * recency;

  // 6. Final clamped strength
  const finalStrength = Math.min(1.0, Math.max(categoryFloor, rawStrength));

  // 7. Target radial distance (stronger = closer to origin)
  const targetRadius = config.maxRadius - finalStrength * (config.maxRadius - config.minRadius);

  return {
    base,
    frequency,
    recency,
    categoryFloor,
    rawStrength,
    finalStrength,
    targetRadius
  };
}
