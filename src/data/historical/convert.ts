import { HistoricalTyphoon } from '../../types/historicalTyphoon';
import { LifeStage, TyphoonStatus, WindLevel } from '../../types/typhoon';
import { bearing, haversineDistance } from '../../utils/geo';
import { isOverLand } from '../../engine/landmass';
import { calculateAsymmetricRadii, calculateDynamicBaseRadii } from '../../engine/windCircle';

function estimatePressure(speed: number, pressure?: number): number {
  if (typeof pressure === 'number' && Number.isFinite(pressure)) return Math.round(pressure);
  return Math.round(Math.max(860, 1010 - speed * 1.9));
}

function estimateLifeStage(speed: number, index: number, total: number): LifeStage {
  if (speed < 1.6) return 'dissipated';
  if (index > total * 0.72 && speed < 17.2) return 'decaying';
  if (speed < 17.2) return 'forming';
  if (speed >= 41.5 && index > total * 0.25 && index < total * 0.72) return 'mature';
  if (index > total * 0.65) return 'decaying';
  return 'developing';
}

function estimateWindCircles(maxWindSpeed: number, movingDirection: number) {
  const radiusMaxWind = Math.max(18, Math.min(95, 24 + (maxWindSpeed - 17.2) * 0.7));
  const baseRadii = calculateDynamicBaseRadii(maxWindSpeed, radiusMaxWind);
  return calculateAsymmetricRadii({
    baseRadii,
    movingSpeed: 0,
    movingDirection,
    asymmetryFactor: 0.18,
  });
}

export function historicalToStatuses(typhoon: HistoricalTyphoon): TyphoonStatus[] {
  const points = [...typhoon.points]
    .filter((p) => Number.isFinite(p.lng) && Number.isFinite(p.lat) && Number.isFinite(p.maxWindSpeed))
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  let maxSpeedReached = 0;

  return points.map((point, index) => {
    const prev = points[index - 1];
    const next = points[index + 1];
    const directionTarget = next ?? prev ?? point;
    const movingDirection = typeof point.movingDirection === 'number'
      ? point.movingDirection
      : bearing(point.lng, point.lat, directionTarget.lng, directionTarget.lat);

    let movingSpeed = point.movingSpeed ?? 0;
    if (!point.movingSpeed && prev) {
      const hours = Math.max(1, (new Date(point.time).getTime() - new Date(prev.time).getTime()) / 3600000);
      movingSpeed = Math.round((haversineDistance(prev.lng, prev.lat, point.lng, point.lat) / hours) * 10) / 10;
    }

    maxSpeedReached = Math.max(maxSpeedReached, point.maxWindSpeed);
    const pressure = estimatePressure(point.maxWindSpeed, point.pressure);
    const radiusMaxWind = Math.max(18, Math.min(95, 24 + (point.maxWindSpeed - 17.2) * 0.7));

    return {
      id: typhoon.id,
      name: typhoon.name,
      timestamp: new Date(point.time).getTime(),
      centerLng: point.lng,
      centerLat: point.lat,
      pressure,
      maxWindSpeed: Math.round(point.maxWindSpeed * 10) / 10,
      effectiveMaxWindSpeed: Math.round((point.maxWindSpeed + movingSpeed * 0.3) * 10) / 10,
      windCircles: estimateWindCircles(point.maxWindSpeed, movingDirection),
      movingSpeed,
      movingDirection,
      radiusMaxWind,
      isOverLand: isOverLand(point.lng, point.lat),
      lifeStage: estimateLifeStage(point.maxWindSpeed, index, points.length),
      isFinished: index === points.length - 1,
      maxSpeedReached,
      activeEffects: [],
    };
  });
}

export function statusesToTrackPoints(statuses: TyphoonStatus[]) {
  return statuses.map((s) => ({
    timestamp: s.timestamp,
    lng: s.centerLng,
    lat: s.centerLat,
    pressure: s.pressure,
    maxWindSpeed: s.maxWindSpeed,
    windCircles: s.windCircles,
  }));
}

export function parseHistoricalJson(text: string): HistoricalTyphoon {
  const data = JSON.parse(text) as HistoricalTyphoon;
  if (!data.id || !data.name || !Array.isArray(data.points)) {
    throw new Error('JSON 格式无效：缺少 id、name 或 points');
  }
  return {
    ...data,
    source: data.source ?? 'CUSTOM',
    year: data.year ?? new Date(data.points[0]?.time ?? Date.now()).getUTCFullYear(),
  };
}

export function parseHistoricalCsv(text: string, fallbackName = '导入台风'): HistoricalTyphoon {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error('CSV 至少需要表头和一行数据');

  const headers = lines[0].split(',').map((h) => h.trim());
  const indexOf = (name: string) => headers.findIndex((h) => h.toLowerCase() === name.toLowerCase());
  const timeIdx = indexOf('time');
  const lngIdx = indexOf('lng');
  const latIdx = indexOf('lat');
  const pressureIdx = indexOf('pressure');
  const windIdx = indexOf('maxWindSpeed');

  if (timeIdx < 0 || lngIdx < 0 || latIdx < 0 || windIdx < 0) {
    throw new Error('CSV 表头需要包含 time,lng,lat,maxWindSpeed');
  }

  const points = lines.slice(1).map((line) => {
    const cols = line.split(',').map((c) => c.trim());
    return {
      time: cols[timeIdx],
      lng: Number(cols[lngIdx]),
      lat: Number(cols[latIdx]),
      pressure: pressureIdx >= 0 && cols[pressureIdx] ? Number(cols[pressureIdx]) : undefined,
      maxWindSpeed: Number(cols[windIdx]),
    };
  });

  const year = new Date(points[0].time).getUTCFullYear();
  return {
    id: `custom-${year}-${Date.now()}`,
    name: fallbackName,
    source: 'CUSTOM',
    year,
    points,
  };
}
