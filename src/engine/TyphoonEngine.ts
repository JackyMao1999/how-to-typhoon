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
import {
  applyRegimeShift, applyFujiwhara, applyTerrainBlocking,
  applyColdWake, applyStructureChange, getColdWakeSST,
  accumDeltas, PhysicsDeltas,
} from './physics';
import { TyphoonEffect, EffectType } from '../types/typhoon';

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

    const absLat = Math.abs(status.centerLat);

    // 1. 基础引导流
    let { direction: baseDir, speed: rawSpeed } = applySteeringFlow(
      status.centerLat,
      status.movingSpeed,
      this.config
    );
    let baseSpeed = rawSpeed;

    // 2. 科里奥利偏转
    let finalDir = applyCoriolisDeflection(baseDir, baseSpeed, status.centerLat, this.config);

    // 3. 物理机制：路径扰动
    const regime = applyRegimeShift(status.centerLat, absLat, this.config);
    const fuji = applyFujiwhara(status.centerLat, status.centerLng, absLat, this.config);
    const terrain = applyTerrainBlocking(status.centerLng, status.centerLat, this.config);

    finalDir = (finalDir + regime.directionDelta + fuji.directionDelta + terrain.directionDelta + 360) % 360;
    const pathSpeedMult = regime.speedMultiplier * fuji.speedMultiplier * terrain.speedMultiplier;
    const perturbedSpeed = Math.round(Math.max(3, baseSpeed * pathSpeedMult) * 10) / 10;

    // 4. 推进位置
    const [nextLng, nextLat] = advancePosition(
      status.centerLng,
      status.centerLat,
      finalDir,
      perturbedSpeed,
      this.config.timeStep
    );
    const land = isOverLand(nextLng, nextLat);

    // 5. 冷尾流：计算局部 SST
    const coldWake = applyColdWake(status, this.config);
    const localSST = getColdWakeSST(this.config.seaSurfaceTemp, coldWake);
    const coldWakeConfig = { ...this.config, seaSurfaceTemp: localSST };

    // 6. 强度演化（使用冷尾流 SST）
    const living = applyIntensityEvolution(
      { ...status, centerLng: nextLng, centerLat: nextLat, isOverLand: land },
      coldWakeConfig
    );

    // 7. 内部结构变化
    const structure = applyStructureChange(status, this.config);
    let adjustedWind = living.maxWindSpeed + structure.intensityDelta;
    if (structure.speedMultiplier !== 1) {
      const speedAdj = status.maxWindSpeed * (structure.speedMultiplier - 1);
      adjustedWind = Math.max(3, adjustedWind + Math.round(speedAdj * 10) / 10);
    }
    adjustedWind = Math.round(Math.max(0, adjustedWind) * 10) / 10;

    // 8. 衰减（使用冷尾流 SST）
    const { maxWindSpeed, pressure, windSpeedMultiplier } = applyDecay(
      { ...status, centerLng: nextLng, centerLat: nextLat, maxWindSpeed: adjustedWind, pressure: living.pressure, isOverLand: land },
      coldWakeConfig
    );

    // 9a. 构建活性效果报告
    const effects: TyphoonEffect[] = [];
    const push = (n: string, t: EffectType, d: string) => effects.push({ name: n, type: t, desc: d });
    const cfg = this.config;

    if (terrain.intensityDelta < 0) {
      const reduction = Math.round((1 - terrain.speedMultiplier) * 100);
      const region = ['台湾中央山脉', '吕宋山脉', '日本阿尔卑斯', '海南五指山', '菲律宾中部', '朝鲜半岛']
        .find(() => true) || '山地地形';
      push('地形阻挡', 'weaken',
        `${region}阻挡台风前进，迎风坡强迫抬升导致涡旋拉伸变形。中心附近最大风速下降${reduction}%，路径受地形强迫偏转。实际案例：台风在台湾中央山脉前常减速30-60%并分裂绕山。`);
    }
    if (coldWake.sstLocalDelta < -0.3) {
      const drop = Math.abs(coldWake.sstLocalDelta).toFixed(1);
      const slowText = status.movingSpeed < 15 ? '（移速偏慢，冷尾流效应显著）' : '';
      push('冷尾流', 'weaken',
        `台风缓慢移动导致表层暖水被抽走，深层冷水上翻使海面温度下降${drop}°C${slowText}。热力供应减少，强度发展受限。实际观测：慢速台风<15km/h可使SST下降2-4°C。`);
    }
    if (land && terrain.intensityDelta === 0) {
      const decayPct = Math.round((1 - windSpeedMultiplier) * 100);
      push('陆地摩擦', 'weaken',
        `登陆后地表粗糙度骤增，低层辐合减弱，水汽供应被切断。中心附近风速已衰减约${decayPct}%，预计随深入内陆将继续减弱。通常在登陆后12-24小时内明显衰减。`);
    }
    if (regime.directionDelta !== 0) {
      const deg = Math.round(regime.directionDelta);
      const label = absLat >= 25 && absLat < 35 ? '西风槽' : absLat >= 35 ? '温带气旋化' : '副热带高压调整';
      const dir = deg > 0 ? '右转' : '左转';
      push('环流突变', 'steer',
        `${label}导致大尺度引导气流发生变化，台风路径出现突然${dir}，偏转约${Math.abs(deg)}°。移速也相应变化${Math.round((regime.speedMultiplier - 1) * 100)}%。这是路径预报误差的主要来源。`);
    }
    if (fuji.directionDelta !== 0) {
      push('藤原效应', 'steer',
        '与附近另一个热带气旋发生双涡旋互旋作用，两者绕共同质心逆时针旋转（北半球）。路径出现不规则摆动，移速减缓约20-40%。实际距离<1200km时作用明显。');
    }
    if (structure.intensityDelta > 0) {
      push('眼墙置换', 'intensify',
        '外眼墙已完全取代内眼墙，新的眼墙开始收缩。台风进入二次增强阶段，强度可能超过置换前水平。风圈扩大，眼区清晰度增加。超级台风常经历多次置换。');
    } else if (structure.intensityDelta < 0) {
      const pct = Math.round(Math.abs(structure.intensityDelta) / (status.maxWindSpeed || 1) * 100);
      push('眼墙置换', 'weaken',
        `内眼墙正在被外眼墙取代。外眼墙形成后切断了内眼墙的水汽供应，内眼墙逐渐消亡。强度暂时下降约${pct}%，待外眼墙完成收缩后将重新增强。此过程通常持续6-12小时。`);
    }
    if (structure.speedMultiplier > 1.3) {
      push('移速突变', 'info',
        `受引导气流加强影响，移动速度突然增加${Math.round((structure.speedMultiplier - 1) * 100)}%。快速移动的台风会导致非对称风雨分布（右侧风雨更强），且冷尾流减弱。`);
    } else if (structure.speedMultiplier < 0.7) {
      push('移速突变', 'info',
        `引导气流减弱或受其他系统牵制，台风移速突然减小${Math.round((1 - structure.speedMultiplier) * 100)}%。滞留可导致累积降雨量大增，冷尾流效应加重。`);
    }
    if (localSST >= 26.5 && maxWindSpeed >= status.maxWindSpeed) {
      push('暖海温', 'intensify',
        `当前海面温度${localSST.toFixed(1)}°C，高于26.5°C的热带气旋发展阈值。海面蒸发旺盛，水汽通量充足，为对流和暖心维持提供持续能量。SST越高MPI越大。`);
    }
    if (localSST < 24) {
      push('海温偏低', 'weaken',
        `海面温度${localSST.toFixed(1)}°C，低于26.5°C的发展阈值。蒸发减弱，向大气的热通量减少，台风难以维持强度。若长期处于冷水区将导致消散。`);
    }
    if (cfg.verticalWindShear > 20) {
      push('风切变强', 'weaken',
        `${cfg.verticalWindShear} m/s的垂直风切变破坏了台风的暖心结构，使对流主体与低层环流中心偏离。强切变可导致眼墙破裂、结构不对称。当切变>30 m/s时热带气旋通常快速减弱。`);
    } else if (cfg.verticalWindShear < 10 && effects.length > 0) {
      push('风切变弱', 'intensify',
        `${cfg.verticalWindShear} m/s的低垂直风切变为台风发展提供了优越条件。对流柱能够保持垂直，暖心中不受干扰地建立和维持。这是台风快速增强的必要条件之一。`);
    }
    if (cfg.oceanHeatContent > 0.7 && maxWindSpeed >= status.maxWindSpeed) {
      push('高海洋热含量', 'intensify',
        `上层海洋热含量（OHC）为${cfg.oceanHeatContent.toFixed(2)}，表明暖水层深厚。即使台风移动较慢，也不易因冷尾流而使海面显著降温。深暖水层支持持续增强至较高强度。`);
    }
    if (cfg.midLevelHumidity < 50) {
      push('干空气侵入', 'weaken',
        `中层相对湿度仅${cfg.midLevelHumidity}%，干空气从台风外围卷入，抑制深对流发展。干冷空气的卷入会破坏眼墙的对称性，使台风结构松散、强度受限。`);
    }

    // 9. 风圈
    const sizeDrift = (this.config.stormSize - 0.5) * 0.8;
    const nextRadiusMaxWind = Math.round(
      Math.max(10, Math.min(this.config.extremeMode ? 105 : 90, status.radiusMaxWind + sizeDrift + (perturbedSpeed - status.movingSpeed) * 0.2 + (maxWindSpeed - status.maxWindSpeed) * 0.35))
    );
    const dynamicBaseRadii = calculateDynamicBaseRadii(maxWindSpeed, nextRadiusMaxWind, this.config.stormSize);
    const baseRadii = this.config.extremeMode
      ? Object.fromEntries(
        Object.entries(dynamicBaseRadii).map(([level, radius]) => [level, Math.round((radius ?? 0) * 1.15)])
      )
      : dynamicBaseRadii;

    const windCircles = calculateAsymmetricRadii({
      baseRadii,
      movingSpeed: perturbedSpeed,
      movingDirection: finalDir,
      asymmetryFactor: 0.35,
    });

    const scaledCircles: WindCircleRadii[] = windCircles.map((wc) => ({
      ...wc,
      ne: Math.round(wc.ne * windSpeedMultiplier),
      nw: Math.round(wc.nw * windSpeedMultiplier),
      se: Math.round(wc.se * windSpeedMultiplier),
      sw: Math.round(wc.sw * windSpeedMultiplier),
    }));

    // 10. 生命周期
    const lifeStage = determineLifeStage(
      {
        ...status,
        centerLng: nextLng,
        centerLat: nextLat,
        maxWindSpeed,
        pressure,
        isOverLand: land,
      },
      coldWakeConfig
    );
    const isFinished = lifeStage === 'dissipated' && this.config.autoStopOnDissipated;
    const effectiveMaxWindSpeed = Math.round((maxWindSpeed + perturbedSpeed * 0.3) * 10) / 10;
    const maxSpeedReached = Math.max(status.maxSpeedReached, maxWindSpeed);

    const madeLandfall = land && !status.isOverLand && !status.landfallPoint;
    const landfallPoint = madeLandfall
      ? { lng: nextLng, lat: nextLat, timestamp: status.timestamp + this.config.timeStep }
      : status.landfallPoint;

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
      movingSpeed: perturbedSpeed,
      movingDirection: finalDir,
      radiusMaxWind: nextRadiusMaxWind,
      isOverLand: land,
      landfallPoint,
      activeEffects: effects.slice(0, 6),
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
