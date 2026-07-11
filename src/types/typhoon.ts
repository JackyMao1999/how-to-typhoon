export enum WindLevel {
  LV7 = 7,
  LV10 = 10,
  LV12 = 12,
}

export const WIND_LEVEL_COLORS: Record<WindLevel, string> = {
  [WindLevel.LV7]: '#4FC3F7',
  [WindLevel.LV10]: '#FFD54F',
  [WindLevel.LV12]: '#EF5350',
};

export const WIND_LEVEL_NAMES: Record<WindLevel, string> = {
  [WindLevel.LV7]: '七级风圈',
  [WindLevel.LV10]: '十级风圈',
  [WindLevel.LV12]: '十二级风圈',
};

export const WIND_LEVEL_SPEED_RANGES: Record<WindLevel, [number, number]> = {
  [WindLevel.LV7]: [13.9, 17.1],
  [WindLevel.LV10]: [17.2, 24.5],
  [WindLevel.LV12]: [24.5, 32.7],
};

export interface WindCircleRadii {
  level: WindLevel;
  ne: number;
  nw: number;
  se: number;
  sw: number;
}

export interface TrackPoint {
  timestamp: number;
  lng: number;
  lat: number;
  pressure: number;
  maxWindSpeed: number;
  windCircles: WindCircleRadii[];
}

export type LifeStage = 'forming' | 'developing' | 'mature' | 'decaying' | 'dissipated';

export const LIFE_STAGE_LABELS: Record<LifeStage, string> = {
  forming: '生成期',
  developing: '发展期',
  mature: '成熟期',
  decaying: '衰减期',
  dissipated: '消散期',
};

export interface TyphoonStatus {
  id: string;
  name: string;
  timestamp: number;
  centerLng: number;
  centerLat: number;
  pressure: number;
  maxWindSpeed: number;
  effectiveMaxWindSpeed: number;
  windCircles: WindCircleRadii[];
  movingSpeed: number;
  movingDirection: number;
  radiusMaxWind: number;
  isOverLand: boolean;
  lifeStage: LifeStage;
  isFinished: boolean;
  maxSpeedReached: number;
}

export interface WindGridPoint {
  lng: number;
  lat: number;
  windSpeed: number;
  windDirection: number;
  windLevel: number;
}

export enum TyphoonLevel {
  TD = 'td',
  TS = 'ts',
  STS = 'sts',
  TY = 'ty',
  STY = 'sty',
  SuperTY = 'sTY',
}

export interface TyphoonLevelConfig {
  name: string;
  shortName: string;
  color: [number, number, number];
  hexColor: string;
  eyeSpeedMul: number;
  glowSpeedMul: number;
}

export const TYPHOON_LEVEL_CONFIG: Record<TyphoonLevel, TyphoonLevelConfig> = {
  [TyphoonLevel.TD]:      { name: '热带低压',     shortName: '低压',   color: [0.31, 0.76, 0.97], hexColor: '#4FC3F7', eyeSpeedMul: 1,   glowSpeedMul: 1 },
  [TyphoonLevel.TS]:      { name: '热带风暴',     shortName: '风暴',   color: [0.80, 0.70, 0.20], hexColor: '#FFD54F', eyeSpeedMul: 1.5, glowSpeedMul: 1.5 },
  [TyphoonLevel.STS]:     { name: '强热带风暴',   shortName: '强风暴', color: [0.95, 0.60, 0.20], hexColor: '#FF9944', eyeSpeedMul: 2,   glowSpeedMul: 2 },
  [TyphoonLevel.TY]:      { name: '台风',         shortName: '台风',   color: [0.94, 0.33, 0.31], hexColor: '#EF5350', eyeSpeedMul: 3,   glowSpeedMul: 3 },
  [TyphoonLevel.STY]:     { name: '强台风',       shortName: '强台风', color: [0.67, 0.20, 0.80], hexColor: '#AA00FF', eyeSpeedMul: 4.5, glowSpeedMul: 5 },
  [TyphoonLevel.SuperTY]: { name: '超强台风',     shortName: '超强',   color: [0.85, 0.85, 0.95], hexColor: '#FFFFFF', eyeSpeedMul: 6,   glowSpeedMul: 8 },
};

export function getWindLevelName(level: WindLevel): string {
  return WIND_LEVEL_NAMES[level];
}

export function getWindLevelColor(level: WindLevel): string {
  return WIND_LEVEL_COLORS[level];
}
