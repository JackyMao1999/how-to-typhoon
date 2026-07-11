import { WindLevel, WindCircleRadii } from '../types/typhoon';
import { AsymmetricWindCircleParams } from '../types/engine';

const QUADRANT_AZIMUTHS: [number, 'ne' | 'nw' | 'se' | 'sw'][] = [
  [45, 'ne'],
  [315, 'nw'],
  [135, 'se'],
  [225, 'sw'],
];

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function calculateAsymmetricRadii(
  params: AsymmetricWindCircleParams
): WindCircleRadii[] {
  const { baseRadii, movingDirection, asymmetryFactor } = params;
  const dirRad = degToRad(movingDirection);

  const levels = [WindLevel.LV7, WindLevel.LV10, WindLevel.LV12];
  return levels.map((level) => {
    const base = baseRadii[level];
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
  });
}
