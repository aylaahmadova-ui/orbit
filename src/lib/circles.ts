import { Circle } from '../types';

export interface CircleBand {
  min: number;
  center: number;
  max: number;
}

export const CIRCLE_BANDS: Record<Circle, CircleBand> = {
  core: { min: 120, center: 160, max: 200 },
  close: { min: 240, center: 300, max: 360 },
  regular: { min: 420, center: 480, max: 540 },
  distant: { min: 620, center: 680, max: 740 }
};

export function getTargetRadius(circle: Circle, drift: number = 0.5): number {
  const band = CIRCLE_BANDS[circle] || CIRCLE_BANDS.regular;
  const clampedDrift = Math.max(0, Math.min(1, drift));
  return band.min + clampedDrift * (band.max - band.min);
}

export function getCircleFromRadius(radius: number): { circle: Circle; drift: number } {
  // Threshold boundaries halfway between bands
  // core-close threshold = (200 + 240) / 2 = 220
  // close-regular threshold = (360 + 420) / 2 = 390
  // regular-distant threshold = (540 + 620) / 2 = 580

  let circle: Circle = 'regular';
  if (radius < 220) {
    circle = 'core';
  } else if (radius < 390) {
    circle = 'close';
  } else if (radius < 580) {
    circle = 'regular';
  } else {
    circle = 'distant';
  }

  const band = CIRCLE_BANDS[circle];
  const rawDrift = (radius - band.min) / (band.max - band.min);
  const drift = Math.max(0, Math.min(1, rawDrift));

  return { circle, drift };
}
