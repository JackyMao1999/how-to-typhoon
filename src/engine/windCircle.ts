import { WindLevel, WindCircleRadii, WIND_LEVEL_SPEED_RANGES } from '../types/typhoon';
import { AsymmetricWindCircleParams } from '../types/engine';

const LEVEL_RADIUS_FACTOR: Record<WindLevel, number> = {
  [WindLevel.LV7]: 8.5,
  [WindLevel.LV10]: 4.2,
  [WindLevel.LV12]: 2.4,
};

const LEVEL_MIN_RADIUS: Record<WindLevel, number> = {
  [WindLevel.LV7]: 80,
  [WindLevel.LV10]: 35,
  [WindLevel.LV12]: 18,
};

const LEVEL_MAX_RADIUS: Record<WindLevel, number> = {
  [WindLevel.LV7]: 520,
  [WindLevel.LV10]: 260,
  [WindLevel.LV12]: 140,
};

const QUADRANT_AZIMUTHS: [number, 'ne' | 'nw' | 'se' | 'sw'][] = [
  [45, 'ne'],
  [315, 'nw'],
  [135, 'se'],
  [225, 'sw'],
];

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function calculateDynamicBaseRadii(
  maxWindSpeed: number,
  radiusMaxWind: number,
): Partial<Record<WindLevel, number>> {
  const radii: Partial<Record<WindLevel, number>> = {};

  for (const level of [WindLevel.LV7, WindLevel.LV10, WindLevel.LV12]) {
    const [threshold] = WIND_LEVEL_SPEED_RANGES[level];
    if (maxWindSpeed < threshold) continue;

    const excess = maxWindSpeed - threshold;
    const base = radiusMaxWind + excess * LEVEL_RADIUS_FACTOR[level];
    radii[level] = Math.round(clamp(base, LEVEL_MIN_RADIUS[level], LEVEL_MAX_RADIUS[level]));
  }

  return radii;
}

export function calculateAsymmetricRadii(
  params: AsymmetricWindCircleParams
): WindCircleRadii[] {
  const { baseRadii, movingDirection, asymmetryFactor } = params;
  const dirRad = degToRad(movingDirection);

  const levels = [WindLevel.LV7, WindLevel.LV10, WindLevel.LV12];
  return levels.map((level) => {
    const base = baseRadii[level];
    if (!base || base <= 0) return null;
    const radii: Record<string, number> = {};

    for (const [azimuth, key] of QUADRANT_AZIMUTHS) {
      const azimuthRad = degToRad(azimuth);
      const factor = 1 + asymmetryFactor * Math.cos(azimuthRad - dirRad);
      radii[key] = Math.round(base * factor);
    }

    return {
      level,
      ne: radii.ne as number,
      nw: radii.nw as number,
      se: radii.se as number,
      sw: radii.sw as number,
    };
  }).filter((wc): wc is WindCircleRadii => wc !== null);
}
