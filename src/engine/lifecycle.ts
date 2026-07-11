import { LifeStage, TyphoonStatus } from '../types/typhoon';
import { EngineConfig } from '../types/engine';

const SST_THRESHOLD = 26.5;
const LAND_FRICTION_FACTOR = 0.12;
const INTENSIFY_RATE = 0.04;
const EXTREME_INTENSIFY_RATE = 0.08;
const STOP_WIND_SPEED = 1.6;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** 强度演化：forming/developing 阶段逐步提升风速 */
export function applyIntensityEvolution(
  status: TyphoonStatus,
  config: EngineConfig,
): { maxWindSpeed: number; pressure: number } {
  const { seaSurfaceTemp, extremeMode } = config;
  const absLat = Math.abs(status.centerLat);
  const lifeStage = determineLifeStage(status, config);

  let speed = status.maxWindSpeed;
  let pressure = status.pressure;

  if (lifeStage === 'forming' || lifeStage === 'developing' || (extremeMode && lifeStage === 'mature')) {
    const normalPotential = 15 + Math.max(0, seaSurfaceTemp - 26) * 3 + Math.max(0, 30 - absLat) * 0.25;
    const extremePotential = clamp(
      68 + Math.max(0, seaSurfaceTemp - 28) * 5 + Math.max(0, 22 - absLat) * 0.6,
      62,
      78,
    );
    const target = Math.max(speed, extremeMode ? extremePotential : normalPotential);
    const rate = extremeMode ? EXTREME_INTENSIFY_RATE : INTENSIFY_RATE;
    speed += (target - speed) * rate;
    speed = Math.round(speed * 10) / 10;
    pressure = Math.round(pressure - (speed - status.maxWindSpeed) * (extremeMode ? 1.8 : 1.2));
  }

  return { maxWindSpeed: speed, pressure };
}

export function determineLifeStage(
  status: TyphoonStatus,
  config: EngineConfig
): LifeStage {
  const { maxWindSpeed, pressure, isOverLand, centerLat, maxSpeedReached } = status;
  const { seaSurfaceTemp, landTemperature, maxLatitude, minLatitude } = config;

  const absLat = Math.abs(centerLat);

  if (maxWindSpeed < STOP_WIND_SPEED) return 'dissipated';

  if (absLat < minLatitude) return 'decaying';
  if (absLat > maxLatitude) return 'decaying';

  if (isOverLand) return 'decaying';
  if (maxWindSpeed < 17.2) {
    if (maxSpeedReached >= 17.2) return 'decaying';
    return 'forming';
  }
  if (maxWindSpeed < 32.7) return 'developing';
  if (pressure < 970) return 'mature';

  return 'developing';
}

export function applyDecay(
  status: TyphoonStatus,
  config: EngineConfig
): {
  maxWindSpeed: number;
  pressure: number;
  windSpeedMultiplier: number;
} {
  const { seaSurfaceTemp, landTemperature, frictionCoefficient } = config;
  const effectiveTemp = status.isOverLand ? landTemperature : seaSurfaceTemp;
  let multiplier = 1;

  if (effectiveTemp < SST_THRESHOLD) {
    multiplier *= Math.max(0.2, (effectiveTemp - 20) / (SST_THRESHOLD - 20));
  }

  if (status.isOverLand) {
    multiplier *= Math.max(0.1, 1 - frictionCoefficient * LAND_FRICTION_FACTOR);
  }

  const rawSpeed = status.maxWindSpeed * multiplier;
  const newSpeed = Math.round(rawSpeed * 10) / 10;
  const newPressure = Math.round(
    status.pressure + (status.maxWindSpeed - newSpeed) * 1.5
  );

  return {
    maxWindSpeed: newSpeed,
    pressure: newPressure,
    windSpeedMultiplier: multiplier,
  };
}
