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
  const { seaSurfaceTemp, extremeMode, verticalWindShear, oceanHeatContent, midLevelHumidity } = config;
  const absLat = Math.abs(status.centerLat);
  const lifeStage = determineLifeStage(status, config);

  let speed = status.maxWindSpeed;
  let pressure = status.pressure;

  if (lifeStage === 'forming' || lifeStage === 'developing' || (extremeMode && lifeStage === 'mature')) {
    const shearPenalty = Math.max(0, verticalWindShear - 10) * 0.9;
    const humidityFactor = clamp((midLevelHumidity - 45) / 35, 0, 1.2);
    const heatBonus = oceanHeatContent * 10;
    const humidityBonus = (humidityFactor - 0.7) * 8;
    const normalPotential = 15 + Math.max(0, seaSurfaceTemp - 26) * 3 + Math.max(0, 30 - absLat) * 0.25 + heatBonus + humidityBonus - shearPenalty;
    const extremePotential = clamp(
      68 + Math.max(0, seaSurfaceTemp - 28) * 5 + Math.max(0, 22 - absLat) * 0.6 + oceanHeatContent * 8 + humidityBonus - shearPenalty * 0.7,
      62,
      78,
    );
    const target = Math.max(0, extremeMode ? extremePotential : normalPotential);
    const environmentRate = clamp(0.45 + oceanHeatContent * 0.55 + humidityFactor * 0.25 - Math.max(0, verticalWindShear - 12) * 0.035, 0.08, 1.35);
    const rate = (extremeMode ? EXTREME_INTENSIFY_RATE : INTENSIFY_RATE) * environmentRate;
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
  const { seaSurfaceTemp, landTemperature, frictionCoefficient, verticalWindShear, midLevelHumidity, oceanHeatContent } = config;
  const effectiveTemp = status.isOverLand ? landTemperature : seaSurfaceTemp;
  let multiplier = 1;

  if (effectiveTemp < SST_THRESHOLD) {
    multiplier *= Math.max(0.2, (effectiveTemp - 20) / (SST_THRESHOLD - 20));
  }

  if (status.isOverLand) {
    multiplier *= Math.max(0.1, 1 - frictionCoefficient * LAND_FRICTION_FACTOR);
  }

  if (verticalWindShear > 20) {
    multiplier *= Math.max(0.72, 1 - (verticalWindShear - 20) * 0.012);
  }

  if (midLevelHumidity < 55) {
    multiplier *= Math.max(0.78, 1 - (55 - midLevelHumidity) * 0.006);
  }

  if (!status.isOverLand && oceanHeatContent > 0.7) {
    multiplier *= 1 + (oceanHeatContent - 0.7) * 0.08;
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
