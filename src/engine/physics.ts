import { EngineConfig } from '../types/engine';
import { TyphoonStatus } from '../types/typhoon';

export interface PhysicsDeltas {
  directionDelta: number;
  speedMultiplier: number;
  sstLocalDelta: number;
  intensityDelta: number;
}

const TERRAIN_REGIONS = [
  { name: '台湾中央山脉', west: 120.5, east: 121.8, south: 22.8, north: 25.3, factor: 0.7 },
  { name: '吕宋山脉', west: 120.5, east: 121.8, south: 16.0, north: 18.5, factor: 0.5 },
  { name: '日本阿尔卑斯', west: 137.0, east: 138.5, south: 35.5, north: 37.0, factor: 0.4 },
  { name: '海南五指山', west: 109.0, east: 110.5, south: 18.5, north: 19.5, factor: 0.3 },
  { name: '菲律宾中部', west: 123.0, east: 125.0, south: 12.0, north: 15.0, factor: 0.5 },
  { name: '朝鲜半岛', west: 126.5, east: 129.0, south: 35.5, north: 38.5, factor: 0.3 },
];

// 冷尾流 SST 网格缓存
const coldWakeGrid = new Map<string, number>();

function gridKey(lng: number, lat: number): string {
  const glng = Math.round(lng);
  const glat = Math.round(lat);
  return `${glng},${glat}`;
}

// 眼墙置换跟踪
const EWRC_MAP = new Map<string, { phase: number; timer: number; originalSpeed: number }>();

export function clearPhysicsState(): void {
  coldWakeGrid.clear();
  EWRC_MAP.clear();
}

export function accumDeltas(): PhysicsDeltas {
  return { directionDelta: 0, speedMultiplier: 1, sstLocalDelta: 0, intensityDelta: 0 };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// ─── 1. 大气环流突然调整 ───
export function applyRegimeShift(
  lat: number,
  absLat: number,
  config: EngineConfig,
): PhysicsDeltas {
  const delta = accumDeltas();
  if (!config.regimeShiftEnabled) return delta;

  if (absLat < 10 || absLat > 45) return delta;

  const roll = Math.random();
  let triggered = false;

  if (absLat >= 10 && absLat < 25) {
    // 低纬：副高减弱 → 方向变化 + 减速
    if (roll < 0.003) {
      const shift = 20 + Math.random() * 40;
      delta.directionDelta = (config.subtropicalHighDirection > 270 ? -shift : shift);
      delta.speedMultiplier = 0.5 + Math.random() * 0.3;
      triggered = true;
    }
  } else if (absLat >= 25 && absLat < 35) {
    // 中纬：西风槽 → 右转 + 加速
    if (roll < 0.005) {
      delta.directionDelta = 30 + Math.random() * 50;
      delta.speedMultiplier = 1.3 + Math.random() * 0.7;
      triggered = true;
    }
  } else {
    // 高纬：温带气旋化 → 加速右转
    if (roll < 0.004) {
      delta.directionDelta = 20 + Math.random() * 40;
      delta.speedMultiplier = 1.5 + Math.random() * 1.0;
      triggered = true;
    }
  }

  return delta;
}

// ─── 2. 藤原效应（虚拟涡旋旋转矢量） ───
export function applyFujiwhara(
  lat: number,
  lng: number,
  absLat: number,
  config: EngineConfig,
): PhysicsDeltas {
  const delta = accumDeltas();
  if (!config.fujiwharaEnabled) return delta;
  if (absLat < 10 || absLat > 25) return delta;

  if (Math.random() < 0.0015) {
    const dist = (500 + Math.random() * 1000) * (Math.random() > 0.5 ? 1 : -1);
    const rotation = dist > 0 ? -2.5 : 2.5;
    delta.directionDelta = rotation * (1.5 + Math.random());
    delta.speedMultiplier = 0.7 + Math.random() * 0.3;
  }

  return delta;
}

// ─── 3. 复杂地形阻拦 ───
export function applyTerrainBlocking(
  lng: number,
  lat: number,
  config: EngineConfig,
): PhysicsDeltas {
  const delta = accumDeltas();
  if (!config.terrainBlockingEnabled) return delta;

  for (const region of TERRAIN_REGIONS) {
    if (lng >= region.west && lng <= region.east && lat >= region.south && lat <= region.north) {
      const reduction = region.factor * (0.3 + Math.random() * 0.4);
      delta.speedMultiplier = 1 - reduction;
      delta.directionDelta = (Math.random() - 0.5) * 30;
      delta.intensityDelta = -reduction * 12;
      break;
    }
  }

  return delta;
}

// ─── 4. 冷尾流效应 ───
export function applyColdWake(
  status: TyphoonStatus,
  config: EngineConfig,
): PhysicsDeltas {
  const delta = accumDeltas();
  if (!config.coldWakeEnabled) return delta;

  const key = gridKey(status.centerLng, status.centerLat);
  const existing = coldWakeGrid.get(key) ?? 0;

  const speedFactor = Math.max(0.2, Math.min(1, status.movingSpeed / 25));
  const ohcFactor = 1 - config.oceanHeatContent * 0.6;
  const newDrop = Math.max(0, (1 - speedFactor) * 0.12 * ohcFactor);
  const totalDrop = Math.min(3.5, existing + newDrop);

  coldWakeGrid.set(key, totalDrop);
  delta.sstLocalDelta = -totalDrop;

  return delta;
}

export function getColdWakeSST(baseSST: number, delta: PhysicsDeltas): number {
  return Math.round(Math.max(20, Math.min(32, baseSST + delta.sstLocalDelta)) * 10) / 10;
}

// ─── 5. 内部结构演变与移速突变 ───
export function applyStructureChange(
  status: TyphoonStatus,
  config: EngineConfig,
): PhysicsDeltas {
  const delta = accumDeltas();
  if (!config.structureChangeEnabled) return delta;

  const id = status.id;
  const ewrc = EWRC_MAP.get(id);
  const speed = status.maxWindSpeed;

  // 眼墙置换
  if (speed > 50) {
    if (!ewrc && Math.random() < 0.005) {
      EWRC_MAP.set(id, { phase: 1, timer: 0, originalSpeed: speed });
    }
  }

  const activeEwrc = EWRC_MAP.get(id);
  if (activeEwrc) {
    activeEwrc.timer++;
    if (activeEwrc.phase === 1) {
      // 衰减阶段：2-4 步
      const decline = 0.15 + Math.random() * 0.1;
      delta.intensityDelta = -activeEwrc.originalSpeed * decline;
      if (activeEwrc.timer > 2 + Math.floor(Math.random() * 3)) {
        activeEwrc.phase = 2;
        activeEwrc.timer = 0;
      }
    } else if (activeEwrc.phase === 2) {
      // 恢复阶段：3-5 步
      const recovery = 0.1 + Math.random() * 0.15;
      delta.intensityDelta = activeEwrc.originalSpeed * recovery;
      if (activeEwrc.timer > 3 + Math.floor(Math.random() * 3)) {
        EWRC_MAP.delete(id);
      }
    }
  }

  // 移速突变
  if (Math.random() < 0.002) {
    const magnitude = 0.5 + Math.random() * 1.5;
    delta.speedMultiplier = Math.random() > 0.5 ? 1 + magnitude : 1 - magnitude * 0.3;
    delta.speedMultiplier = clamp(delta.speedMultiplier, 0.3, 3.0);
  }

  return delta;
}
