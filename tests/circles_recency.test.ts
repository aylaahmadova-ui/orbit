import { describe, it, expect } from 'vitest';
import { getTargetRadius, getCircleFromRadius, CIRCLE_BANDS } from '../src/lib/circles';
import { getRecencyStage, getRecencyBrightness, isFading } from '../src/lib/recency';
import { Person, Circle } from '../src/types';

describe('Orbit v2: Circles & Recency Engine', () => {
  const baseDate = new Date('2026-10-01T00:00:00Z');

  describe('Dunbar Circles & Radius Mapping', () => {
    it('calculates correct radius targets for each circle and drift', () => {
      expect(getTargetRadius('core', 0.5)).toBe(160);
      expect(getTargetRadius('close', 0.5)).toBe(300);
      expect(getTargetRadius('regular', 0.5)).toBe(480);
      expect(getTargetRadius('distant', 0.5)).toBe(680);

      // Drift bounds (0..1)
      expect(getTargetRadius('core', 0.0)).toBe(CIRCLE_BANDS.core.min);
      expect(getTargetRadius('core', 1.0)).toBe(CIRCLE_BANDS.core.max);
    });

    it('detects circle band from drag radius', () => {
      expect(getCircleFromRadius(150).circle).toBe('core');
      expect(getCircleFromRadius(300).circle).toBe('close');
      expect(getCircleFromRadius(450).circle).toBe('regular');
      expect(getCircleFromRadius(700).circle).toBe('distant');
    });
  });

  describe('Recency Stages & Line Brightness', () => {
    it('determines recency stage based on days since contact', () => {
      const thisWeek = new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
      const thisMonth = new Date(baseDate.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const fewMonths = new Date(baseDate.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString();
      const overAYear = new Date(baseDate.getTime() - 400 * 24 * 60 * 60 * 1000).toISOString();

      expect(getRecencyStage(thisWeek, baseDate)).toBe('this_week');
      expect(getRecencyStage(thisMonth, baseDate)).toBe('this_month');
      expect(getRecencyStage(fewMonths, baseDate)).toBe('few_months');
      expect(getRecencyStage(overAYear, baseDate)).toBe('over_a_year');
      expect(getRecencyStage(undefined, baseDate)).toBe('over_a_year');
    });

    it('assigns brightness stages correctly', () => {
      const recent = new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();
      const old = new Date(baseDate.getTime() - 120 * 24 * 60 * 60 * 1000).toISOString();

      expect(getRecencyBrightness(recent, baseDate)).toBe(1.0);
      expect(getRecencyBrightness(old, baseDate)).toBe(0.25);
    });

    it('identifies fading people in Core or Close circles', () => {
      const coreFading: Person = {
        id: 'p1',
        name: 'Alex',
        circle: 'core',
        drift: 0.5,
        lastContact: new Date(baseDate.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString()
      };

      const coreActive: Person = {
        id: 'p2',
        name: 'Jordan',
        circle: 'core',
        drift: 0.5,
        lastContact: new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
      };

      const distantOld: Person = {
        id: 'p3',
        name: 'Taylor',
        circle: 'distant',
        drift: 0.5,
        lastContact: new Date(baseDate.getTime() - 100 * 24 * 60 * 60 * 1000).toISOString()
      };

      expect(isFading(coreFading, baseDate)).toBe(true);
      expect(isFading(coreActive, baseDate)).toBe(false);
      expect(isFading(distantOld, baseDate)).toBe(false); // Only Core/Close are flagged in fading list
    });
  });
});
