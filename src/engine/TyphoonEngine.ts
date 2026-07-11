import {
  TyphoonStatus,
  TrackPoint,
  WindCircleRadii,
  WindLevel,
} from '../types/typhoon';
import { EngineConfig } from '../types/engine';
import { calculateAsymmetricRadii, calculateDynamicBaseRadii } from './windCircle';
import { applySteeringFlow, applyCoriolisDeflection, advancePosition } from './path';
import { determineLifeStage, applyDecay, applyIntensityEvolution } from './lifecycle';
import { isOverLand } from './landmass';

export class TyphoonEngine {
  private config: EngineConfig;
  private baseRadii: Record<WindLevel, number>;

  constructor(config: EngineConfig, baseRadii: Record<WindLevel, number>) {
    this.config = config;
    this.baseRadii = baseRadii;
  }

  step(status: TyphoonStatus): {
    next: TyphoonStatus;
    trackPoint: TrackPoint | null;
    isOver: boolean;
  } {
    if (status.isFinished || status.lifeStage === 'dissipated') {
      return { next: { ...status, isFinished: true }, trackPoint: null, isOver: true };
    }

    const { direction: baseDir, speed: newSpeed } = applySteeringFlow(
      status.centerLat,
      status.movingSpeed,
      this.config
    );

    const finalDir = applyCoriolisDeflection(baseDir, newSpeed, status.centerLat, this.config);

    const [nextLng, nextLat] = advancePosition(
      status.centerLng,
      status.centerLat,
      finalDir,
      newSpeed,
      this.config.timeStep
    );

    const land = isOverLand(nextLng, nextLat);

    const living = applyIntensityEvolution(
      { ...status, centerLng: nextLng, centerLat: nextLat, isOverLand: land },
      this.config
    );

    const { maxWindSpeed, pressure, windSpeedMultiplier } = applyDecay(
      { ...status, centerLng: nextLng, centerLat: nextLat, maxWindSpeed: living.maxWindSpeed, pressure: living.pressure, isOverLand: land },
      this.config
    );

    const nextRadiusMaxWind = Math.round(
      Math.max(12, Math.min(this.config.extremeMode ? 95 : 80, status.radiusMaxWind + (newSpeed - status.movingSpeed) * 0.2 + (maxWindSpeed - status.maxWindSpeed) * 0.35))
    );
    const dynamicBaseRadii = calculateDynamicBaseRadii(maxWindSpeed, nextRadiusMaxWind);
    const baseRadii = this.config.extremeMode
      ? Object.fromEntries(
        Object.entries(dynamicBaseRadii).map(([level, radius]) => [level, Math.round((radius ?? 0) * 1.15)])
      )
      : dynamicBaseRadii;

    const windCircles = calculateAsymmetricRadii({
      baseRadii,
      movingSpeed: newSpeed,
      movingDirection: finalDir,
      asymmetryFactor: 0.2,
    });

    const scaledCircles: WindCircleRadii[] = windCircles.map((wc) => ({
      ...wc,
      ne: Math.round(wc.ne * windSpeedMultiplier),
      nw: Math.round(wc.nw * windSpeedMultiplier),
      se: Math.round(wc.se * windSpeedMultiplier),
      sw: Math.round(wc.sw * windSpeedMultiplier),
    }));

    const lifeStage = determineLifeStage(
      {
        ...status,
        centerLng: nextLng,
        centerLat: nextLat,
        maxWindSpeed,
        pressure,
        isOverLand: land,
      },
      this.config
    );

    const isFinished = lifeStage === 'dissipated' && this.config.autoStopOnDissipated;

    const effectiveMaxWindSpeed = Math.round((maxWindSpeed + newSpeed * 0.3) * 10) / 10;
    const maxSpeedReached = Math.max(status.maxSpeedReached, maxWindSpeed);

    const next: TyphoonStatus = {
      ...status,
      centerLng: nextLng,
      centerLat: nextLat,
      timestamp: status.timestamp + this.config.timeStep,
      pressure,
      maxWindSpeed,
      effectiveMaxWindSpeed,
      maxSpeedReached,
      windCircles: scaledCircles,
      movingSpeed: newSpeed,
      movingDirection: finalDir,
      radiusMaxWind: nextRadiusMaxWind,
      isOverLand: land,
      lifeStage,
      isFinished,
    };

    const trackPoint: TrackPoint = {
      timestamp: next.timestamp,
      lng: nextLng,
      lat: nextLat,
      pressure,
      maxWindSpeed,
      windCircles: scaledCircles,
    };

    return { next, trackPoint, isOver: isFinished };
  }

  updateConfig(partial: Partial<EngineConfig>): void {
    this.config = { ...this.config, ...partial };
  }

  getConfig(): EngineConfig {
    return { ...this.config };
  }
}
