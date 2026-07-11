import { Season, SEASON_OFFSET } from '../types/engine';

export function computeSeaTemp(lat: number, season: Season = 'summer'): number {
  const absLat = Math.abs(lat);
  const base = 29 - absLat * 0.16;
  const offset = SEASON_OFFSET[season].sea;
  return Math.round(Math.max(20, Math.min(32, base + offset)) * 10) / 10;
}

export function computeLandTemp(lat: number, season: Season = 'summer'): number {
  const absLat = Math.abs(lat);
  const base = 31 - absLat * 0.2;
  const offset = SEASON_OFFSET[season].land;
  return Math.round(Math.max(18, Math.min(34, base + offset)) * 10) / 10;
}

export function computeFriction(isOverLand: boolean): number {
  return isOverLand ? 0.7 : 0.1;
}
