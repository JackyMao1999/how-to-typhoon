import { WindLevel } from './typhoon';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface EngineConfig {
  subtropicalHighDirection: number;
  subtropicalHighStrength: number;
  coriolisCoefficient: number;
  seaSurfaceTemp: number;
  landTemperature: number;
  frictionCoefficient: number;
  timeStep: number;
  autoStopOnDissipated: boolean;
  maxLatitude: number;
  minLatitude: number;
  season: Season;
}

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  subtropicalHighDirection: 270,
  subtropicalHighStrength: 5,
  coriolisCoefficient: 1,
  seaSurfaceTemp: 28,
  landTemperature: 28,
  frictionCoefficient: 0.8,
  timeStep: 3600000,
  autoStopOnDissipated: true,
  maxLatitude: 45,
  minLatitude: 5,
  season: 'summer',
};

export interface PathSmoothOptions {
  method: 'catmull-rom';
  tension: number;
  segmentsPerPoint: number;
}

export const DEFAULT_PATH_SMOOTH_OPTIONS: PathSmoothOptions = {
  method: 'catmull-rom',
  tension: 0.3,
  segmentsPerPoint: 8,
};

export interface AsymmetricWindCircleParams {
  baseRadii: Record<WindLevel, number>;
  movingSpeed: number;
  movingDirection: number;
  asymmetryFactor: number;
}

export const DEFAULT_BASE_RADII: Record<WindLevel, number> = {
  [WindLevel.LV7]: 300,
  [WindLevel.LV10]: 100,
  [WindLevel.LV12]: 50,
};

export const SEASON_OFFSET: Record<Season, { sea: number; land: number }> = {
  spring: { sea: 0, land: 0 },
  summer: { sea: 2, land: 3 },
  autumn: { sea: 1, land: 1 },
  winter: { sea: -3, land: -2 },
};

export const SEASON_LABELS: Record<Season, string> = {
  spring: '春',
  summer: '夏',
  autumn: '秋',
  winter: '冬',
};
