import { TyphoonLevel, TYPHOON_LEVEL_CONFIG } from '../types/typhoon';

export function getTyphoonLevel(speed: number): TyphoonLevel {
  if (speed < 17.2) return TyphoonLevel.TD;
  if (speed < 24.5) return TyphoonLevel.TS;
  if (speed < 32.7) return TyphoonLevel.STS;
  if (speed < 41.5) return TyphoonLevel.TY;
  if (speed < 51.0) return TyphoonLevel.STY;
  return TyphoonLevel.SuperTY;
}

export function getLevelName(speed: number): string {
  return TYPHOON_LEVEL_CONFIG[getTyphoonLevel(speed)].name;
}

export function getLevelColor(speed: number): [number, number, number] {
  return TYPHOON_LEVEL_CONFIG[getTyphoonLevel(speed)].color;
}

export function getLevelHexColor(speed: number): string {
  return TYPHOON_LEVEL_CONFIG[getTyphoonLevel(speed)].hexColor;
}

export function getWindForce(speed: number): number {
  if (speed < 0.3) return 0;
  if (speed < 1.6) return 1;
  if (speed < 3.4) return 2;
  if (speed < 5.5) return 3;
  if (speed < 8.0) return 4;
  if (speed < 10.8) return 5;
  if (speed < 13.9) return 6;
  if (speed < 17.2) return 7;
  if (speed < 20.8) return 8;
  if (speed < 24.5) return 9;
  if (speed < 28.5) return 10;
  if (speed < 32.7) return 11;
  if (speed < 37.0) return 12;
  if (speed < 41.5) return 13;
  if (speed < 46.2) return 14;
  if (speed < 51.0) return 15;
  if (speed < 56.1) return 16;
  if (speed < 61.3) return 17;
  if (speed < 69.4) return 18;
  return 19;
}

export function getLevelIntensity(speed: number): number {
  const level = getTyphoonLevel(speed);
  switch (level) {
    case TyphoonLevel.TD:      return 0.0;
    case TyphoonLevel.TS:      return 0.2;
    case TyphoonLevel.STS:     return 0.4;
    case TyphoonLevel.TY:      return 0.6;
    case TyphoonLevel.STY:     return 0.8;
    case TyphoonLevel.SuperTY: return 1.0;
  }
}

export function getEyeSpeedMul(speed: number): number {
  return TYPHOON_LEVEL_CONFIG[getTyphoonLevel(speed)].eyeSpeedMul;
}

export function getGlowSpeedMul(speed: number): number {
  return TYPHOON_LEVEL_CONFIG[getTyphoonLevel(speed)].glowSpeedMul;
}
