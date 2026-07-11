import { Season, SEASON_OFFSET } from '../types/engine';

export function computeSeaTemp(lat: number, season: Season = 'summer'): number {
  const absLat = Math.abs(lat);
  const base = 28.5 - absLat * 0.18;
  const offset = SEASON_OFFSET[season].sea;
  return Math.round(Math.max(20, Math.min(32, base + offset)) * 10) / 10;
}

export function computeLandTemp(lat: number, season: Season = 'summer'): number {
  const absLat = Math.abs(lat);
  const base = 30 - absLat * 0.18;
  const offset = SEASON_OFFSET[season].land;
  return Math.round(Math.max(18, Math.min(34, base + offset)) * 10) / 10;
}

export function computeFriction(isOverLand: boolean): number {
  return isOverLand ? 0.7 : 0.1;
}

export function computeVerticalWindShear(lat: number, season: Season): number {
  const absLat = Math.abs(lat);
  const base = 7 + absLat * 0.25;
  const seasonalOffset = season === 'summer' ? -2 : season === 'winter' ? 5 : 1;
  return Math.round(Math.max(4, Math.min(35, base + seasonalOffset)) * 10) / 10;
}

export function computeOceanHeatContent(sst: number, season: Season): number {
  const offset = SEASON_OFFSET[season].sea;
  const base = Math.max(0, (sst - 22) / 12);
  const adjusted = base + offset * 0.025;
  return Math.round(Math.max(0.05, Math.min(1, adjusted)) * 100) / 100;
}

export function computeMidLevelHumidity(lat: number, season: Season): number {
  const absLat = Math.abs(lat);
  const base = 85 - absLat * 0.5;
  const seasonalOffset = season === 'summer' ? 5 : season === 'winter' ? -10 : 0;
  return Math.round(Math.max(35, Math.min(92, base + seasonalOffset)));
}

export function computeStormSize(lat: number, maxWindSpeed: number): number {
  const absLat = Math.abs(lat);
  const base = 0.35 + maxWindSpeed / 150 + absLat * 0.003;
  return Math.round(Math.max(0.15, Math.min(0.95, base)) * 100) / 100;
}

export interface FormationFactors {
  sstScore: number;
  shearScore: number;
  humidityScore: number;
  ohcScore: number;
  latScore: number;
  landScore: number;
  overall: number;
}

export function computeFormationPotential(
  sst: number,
  shear: number,
  humidity: number,
  ohc: number,
  lat: number,
  isLand: boolean,
): FormationFactors {
  const sstScore = Math.max(0, Math.min(1, (sst - 24) / 5));
  const shearScore = Math.max(0, Math.min(1, 1 - Math.max(0, shear - 5) / 20));
  const humidityScore = Math.max(0, Math.min(1, (humidity - 40) / 35));
  const ohcScore = ohc;
  const latAbs = Math.abs(lat);
  const latScore = Math.max(0, Math.min(1, 1 - Math.max(0, latAbs - 5) / 30));
  const landScore = isLand ? 0 : 1;

  const overall = Math.round(
    (sstScore * 0.30 + shearScore * 0.25 + humidityScore * 0.15 + ohcScore * 0.15 + latScore * 0.10 + landScore * 0.05) * 100,
  ) / 100;

  return { sstScore, shearScore, humidityScore, ohcScore, latScore, landScore, overall };
}

export function describeFormationBlockers(f: FormationFactors): string[] {
  const blockers: string[] = [];
  if (f.sstScore < 0.25) blockers.push(`海温偏低 (${(f.sstScore * 100).toFixed(0)}%)`);
  if (f.shearScore < 0.25) blockers.push(`风切变过强`);
  if (f.humidityScore < 0.2) blockers.push(`湿度过低`);
  if (f.ohcScore < 0.2) blockers.push(`热含量不足`);
  if (f.latScore < 0.2) blockers.push(`纬度过高`);
  if (f.landScore < 0.5) blockers.push(`陆地区域`);
  return blockers;
}
