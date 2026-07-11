import { create } from 'zustand';
import {
  TyphoonStatus,
  TrackPoint,
  WindLevel,
  LifeStage,
} from '../types/typhoon';
import { DEFAULT_ENGINE_CONFIG, DEFAULT_BASE_RADII, EngineConfig } from '../types/engine';
import { TyphoonEngine, TyphoonSimulation, computeSeaTemp, computeLandTemp, computeFriction, computeVerticalWindShear, computeOceanHeatContent, computeMidLevelHumidity, computeStormSize, computeFormationPotential, determineLifeStage } from '../engine';
import { Season, SEASON_OFFSET } from '../types/engine';
import { HistoricalTyphoon } from '../types/historicalTyphoon';
import { BUILTIN_HISTORICAL_TYPHOONS } from '../data/historical/samples';
import { historicalToStatuses, statusesToTrackPoints } from '../data/historical/convert';
import { PREDEFINED_REGIONS } from '../data/regions';
import { distanceToRegion, getAlertLevel } from '../types/region';
import { useUIStore } from './uiStore';

type AutoKey = 'seaSurfaceTemp' | 'landTemperature' | 'frictionCoefficient' | 'subtropicalHighStrength' | 'subtropicalHighDirection' | 'verticalWindShear' | 'oceanHeatContent' | 'midLevelHumidity' | 'stormSize';

type SeasonKey = 'spring' | 'summer' | 'autumn' | 'winter';

export interface TyphoonSession {
  id: string;
  name: string;
  initial: TyphoonStatus;
  fullHistory: TyphoonStatus[];
  finalLifeStage: LifeStage;
  totalSteps: number;
  savedAt: number;
}

let typhoonId = 1;

const TYPHOON_NAMES = ['海神', '山猫', '鲇鱼', '鹦鹉', '玉兔', '利奇马', '烟花', '梅花'];

function randomName(): string {
  return TYPHOON_NAMES[Math.floor(Math.random() * TYPHOON_NAMES.length)];
}

function createInitialStatus(lng?: number, lat?: number, config?: EngineConfig): TyphoonStatus {
  const id = typhoonId++;
  const name = randomName();
  const cLng = lng ?? 140;
  const cLat = lat ?? 18;

  let speed: number;
  if (config) {
    const fc = computeFormationPotential(config.seaSurfaceTemp, config.verticalWindShear, config.midLevelHumidity, config.oceanHeatContent, cLat, false);
    if (fc.overall < 0.2) speed = 5 + Math.random() * 3;
    else if (fc.overall < 0.4) speed = 8 + Math.random() * 4;
    else if (fc.overall < 0.6) speed = 12 + Math.random() * 4;
    else speed = 16 + Math.random() * 6;
  } else {
    speed = 12 + Math.random() * 3;
  }

  return {
    id: `TY2025-${String(id).padStart(2, '0')}`,
    name,
    timestamp: Date.now(),
    centerLng: cLng,
    centerLat: cLat,
    pressure: Math.round(1000 - speed * 1.2),
    maxWindSpeed: Math.round(speed * 10) / 10,
    effectiveMaxWindSpeed: Math.round((speed + 18 * 0.3) * 10) / 10,
    windCircles: [
      { level: WindLevel.LV7, ne: Math.round(100 + speed * 6), nw: Math.round(90 + speed * 6), se: Math.round(105 + speed * 6), sw: Math.round(95 + speed * 6) },
      { level: WindLevel.LV10, ne: Math.round(30 + speed * 2), nw: Math.round(25 + speed * 2), se: Math.round(32 + speed * 2), sw: Math.round(28 + speed * 2) },
      { level: WindLevel.LV12, ne: Math.round(10 + speed), nw: Math.round(8 + speed), se: Math.round(12 + speed), sw: Math.round(9 + speed) },
    ],
    movingSpeed: 18,
    movingDirection: 280,
    radiusMaxWind: 30,
    isOverLand: false,
    lifeStage: 'forming',
    isFinished: false,
    maxSpeedReached: Math.round(speed * 10) / 10,
  };
}

export function useDisplayState(): TyphoonStatus {
  const fullHistory = useTyphoonStore((s) => s.fullHistory);
  const replayIndex = useTyphoonStore((s) => s.replayIndex);
  const current = useTyphoonStore((s) => s.current);
  if (replayIndex >= 0 && fullHistory[replayIndex]) {
    return fullHistory[replayIndex];
  }
  return current;
}

interface TyphoonStore {
  current: TyphoonStatus;
  fullHistory: TyphoonStatus[];
  history: TrackPoint[];
  isRunning: boolean;
  isFinished: boolean;
  speed: number;
  replayIndex: number;
  replayPlaying: boolean;

  engine: TyphoonEngine;
  engineConfig: EngineConfig;
  simulation: TyphoonSimulation | null;
  autoOverrides: Record<AutoKey, boolean>;
  season: SeasonKey;

  typhoonSessions: TyphoonSession[];
  historicalTyphoons: HistoricalTyphoon[];

  init: () => void;
  tick: () => void;
  start: () => void;
  pause: () => void;
  setSpeed: (speed: number) => void;
  reset: () => void;
  spawnAt: (lng: number, lat: number) => void;
  updateEngineConfig: (partial: Partial<EngineConfig>) => void;
  modifyTyphoon: (partial: Partial<TyphoonStatus>) => void;
  setReplayIndex: (index: number) => void;
  toggleReplay: () => void;
  nextReplayStep: () => void;
  toggleAutoOverride: (key: AutoKey) => void;
  isAuto: (key: AutoKey) => boolean;
  saveCurrentSession: () => void;
  loadSession: (index: number) => void;
  loadHistoricalTyphoon: (id: string) => void;
  importHistoricalTyphoon: (data: HistoricalTyphoon) => void;
  setSeason: (season: SeasonKey) => void;
}

const DEFAULT_AUTO: Record<AutoKey, boolean> = {
  seaSurfaceTemp: true,
  landTemperature: true,
  frictionCoefficient: true,
  subtropicalHighStrength: true,
  subtropicalHighDirection: true,
  verticalWindShear: true,
  oceanHeatContent: true,
  midLevelHumidity: true,
  stormSize: true,
};

export const useTyphoonStore = create<TyphoonStore>((set, get) => {
  const engine = new TyphoonEngine(DEFAULT_ENGINE_CONFIG, DEFAULT_BASE_RADII);

  return {
    current: createInitialStatus(),
    fullHistory: [],
    history: [],
    isRunning: false,
    isFinished: false,
    speed: 1,
    replayIndex: -1,
    replayPlaying: false,
    engine,
    engineConfig: DEFAULT_ENGINE_CONFIG,
    simulation: null,
    autoOverrides: { ...DEFAULT_AUTO },
    season: 'summer',
    typhoonSessions: [],
    historicalTyphoons: BUILTIN_HISTORICAL_TYPHOONS,

    init: () => {
      const initial = createInitialStatus(undefined, undefined, get().engineConfig);
      const sim = new TyphoonSimulation(get().engine, initial);
      set({ current: initial, fullHistory: [initial], history: [], simulation: sim, isFinished: false, replayIndex: -1, replayPlaying: false, autoOverrides: { ...DEFAULT_AUTO } });
    },

    tick: () => {
      const { engine, current, fullHistory, history, isFinished, autoOverrides, season } = get();
      if (isFinished) return;

      const { centerLat, isOverLand } = current;

      const updates: Partial<EngineConfig> = {};
      if (autoOverrides.seaSurfaceTemp) updates.seaSurfaceTemp = computeSeaTemp(centerLat, season);
      if (autoOverrides.landTemperature) updates.landTemperature = computeLandTemp(centerLat, season);
      if (autoOverrides.frictionCoefficient) updates.frictionCoefficient = computeFriction(isOverLand);
      if (autoOverrides.verticalWindShear) updates.verticalWindShear = computeVerticalWindShear(centerLat, season);
      if (autoOverrides.oceanHeatContent) updates.oceanHeatContent = computeOceanHeatContent(updates.seaSurfaceTemp ?? get().engineConfig.seaSurfaceTemp, season);
      if (autoOverrides.midLevelHumidity) updates.midLevelHumidity = computeMidLevelHumidity(centerLat, season);
      if (autoOverrides.stormSize) updates.stormSize = computeStormSize(centerLat, current.maxWindSpeed);
      if (Object.keys(updates).length > 0) {
        engine.updateConfig(updates);
        set({ engineConfig: engine.getConfig() });
      }

      const { next, trackPoint, isOver } = engine.step(current);

      // 区域预警检测
      const ui = useUIStore.getState();
      const monitoredIds = ui.monitoredRegions;
      if (monitoredIds.length > 0) {
        const activeRegionIds = new Set(ui.alerts.map((a) => a.regionName));
        PREDEFINED_REGIONS.forEach((region) => {
          if (!monitoredIds.includes(region.id)) return;
          const dist = distanceToRegion(next.centerLng, next.centerLat, region);
          const levelInfo = getAlertLevel(dist);
          if (!levelInfo) return;
          const key = `${region.id}-${levelInfo.level}`;
          if (activeRegionIds.has(region.name)) return;
          ui.addAlert({
            id: `alert-${Date.now()}-${key}`,
            regionName: region.name,
            typhoonName: next.name,
            level: levelInfo.level,
            distance: dist,
            timestamp: Date.now(),
          });
        });
      }

      const newHistory = trackPoint ? [...history, trackPoint] : history;
      let newFull = [...fullHistory, next];

      // 内存保护: 最多保留 200 条，多余部分降采样为 6 小时间隔
      if (newFull.length > 200) {
        const keep = 168;
        const cutoff = newFull.length - keep;
        const old = newFull.slice(0, cutoff);
        const down: TyphoonStatus[] = [];
        for (let i = 0; i < old.length; i += 6) {
          down.push(old[i]);
        }
        newFull = [...down, ...newFull.slice(cutoff)];
      }

      set({
        current: next,
        history: newHistory,
        fullHistory: newFull,
        isFinished: isOver,
        isRunning: isOver ? false : get().isRunning,
        replayIndex: isOver ? 0 : get().replayIndex,
        replayPlaying: isOver ? true : get().replayPlaying,
      });
    },

    start: () => {
      const { isFinished } = get();
      if (isFinished) return;
      set({ isRunning: true, replayIndex: -1, replayPlaying: false });
    },

    pause: () => {
      set({ isRunning: false });
    },

    setSpeed: (speed: number) => {
      set({ speed });
    },

    reset: () => {
      const initial = createInitialStatus(undefined, undefined, get().engineConfig);
      set({
        current: initial, fullHistory: [initial], history: [],
        isRunning: false, isFinished: false, speed: 1,
        replayIndex: -1, replayPlaying: false, autoOverrides: { ...DEFAULT_AUTO },
      });
    },

    spawnAt: (lng: number, lat: number) => {
      get().saveCurrentSession();
      const s = get().typhoonSessions;
      if (s.length > 10) s.shift();

      const { engine: eng, engineConfig } = get();
      const initial = createInitialStatus(lng, lat, engineConfig);
      const sim = new TyphoonSimulation(eng, initial);
      set({
        current: initial, fullHistory: [initial], history: [],
        isRunning: false, isFinished: false, speed: 1,
        simulation: sim, replayIndex: -1, replayPlaying: false,
        autoOverrides: { ...DEFAULT_AUTO },
      });
    },

    updateEngineConfig: (partial: Partial<EngineConfig>) => {
      const { engine } = get();
      engine.updateConfig(partial);
      set({ engineConfig: engine.getConfig() });
    },

    modifyTyphoon: (partial: Partial<TyphoonStatus>) => {
      const { current } = get();
      set({ current: { ...current, ...partial } });
    },

    setReplayIndex: (index: number) => {
      const { fullHistory } = get();
      set({ replayIndex: Math.max(-1, Math.min(index, fullHistory.length - 1)) });
    },

    toggleReplay: () => {
      const { replayPlaying, fullHistory } = get();
      if (fullHistory.length === 0) return;
      set({ replayPlaying: !replayPlaying, replayIndex: get().replayIndex < 0 ? 0 : get().replayIndex });
    },

    nextReplayStep: () => {
      const { replayIndex, fullHistory } = get();
      if (replayIndex < 0 || replayIndex >= fullHistory.length - 1) {
        set({ replayPlaying: false });
        return;
      }
      set({ replayIndex: replayIndex + 1 });
    },

    toggleAutoOverride: (key: AutoKey) => {
      const { autoOverrides, engineConfig } = get();
      const next = { ...autoOverrides, [key]: !autoOverrides[key] };
      if (!next[key]) {
        engine.updateConfig({ [key]: engineConfig[key] as any });
        set({ engineConfig: engine.getConfig() });
      }
      set({ autoOverrides: next });
    },

    isAuto: (key: AutoKey) => get().autoOverrides[key],

    saveCurrentSession: () => {
      const { current, fullHistory, typhoonSessions } = get();
      if (fullHistory.length < 2) return;
      const session: TyphoonSession = {
        id: current.id,
        name: current.name,
        initial: fullHistory[0],
        fullHistory: [...fullHistory],
        finalLifeStage: fullHistory[fullHistory.length - 1].lifeStage,
        totalSteps: fullHistory.length,
        savedAt: Date.now(),
      };
      set({ typhoonSessions: [...typhoonSessions, session] });
    },

    loadSession: (index: number) => {
      const { typhoonSessions } = get();
      const session = typhoonSessions[index];
      if (!session) return;
      const sim = new TyphoonSimulation(get().engine, session.initial);
      set({
        current: session.initial,
        fullHistory: session.fullHistory,
        history: [],
        isRunning: false,
        isFinished: false,
        speed: 1,
        simulation: sim,
        replayIndex: 0,
        replayPlaying: true,
        autoOverrides: { ...DEFAULT_AUTO },
      });
    },

    loadHistoricalTyphoon: (id: string) => {
      const typhoon = get().historicalTyphoons.find((item) => item.id === id);
      if (!typhoon) return;

      const statuses = historicalToStatuses(typhoon);
      if (statuses.length === 0) return;

      const initial = statuses[0];
      const sim = new TyphoonSimulation(get().engine, initial);
      set({
        current: initial,
        fullHistory: statuses,
        history: statusesToTrackPoints(statuses),
        isRunning: false,
        isFinished: true,
        speed: 1,
        simulation: sim,
        replayIndex: 0,
        replayPlaying: true,
        autoOverrides: { ...DEFAULT_AUTO },
      });
    },

    importHistoricalTyphoon: (data: HistoricalTyphoon) => {
      const imported = {
        ...data,
        id: data.id || `custom-${Date.now()}`,
        source: data.source || 'CUSTOM',
      };
      set((state) => ({
        historicalTyphoons: [imported, ...state.historicalTyphoons.filter((item) => item.id !== imported.id)],
      }));
      get().loadHistoricalTyphoon(imported.id);
    },

    setSeason: (season: SeasonKey) => {
      const { engineConfig, autoOverrides } = get();
      const updates: Partial<EngineConfig> = { season };
      if (autoOverrides.seaSurfaceTemp) {
        updates.seaSurfaceTemp = computeSeaTemp(get().current.centerLat, season);
      }
      if (autoOverrides.landTemperature) {
        updates.landTemperature = computeLandTemp(get().current.centerLat, season);
      }
      engine.updateConfig(updates);
      set({ season, engineConfig: engine.getConfig() });
    },
  };
});
