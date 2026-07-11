import { TyphoonStatus, WindLevel } from '../types/typhoon';
import { haversineDistance, bearing } from '../utils/geo';

type Quadrant = 'ne' | 'nw' | 'se' | 'sw';

export interface WindVector {
  speed: number;
  direction: number;
}

function quadrantForBearing(brg: number): Quadrant {
  if (brg >= 0 && brg < 90) return 'ne';
  if (brg >= 90 && brg < 180) return 'se';
  if (brg >= 180 && brg < 270) return 'sw';
  return 'nw';
}

function radiusAtBearing(typhoon: TyphoonStatus, brg: number): number {
  const outer = typhoon.windCircles.find((wc) => wc.level === WindLevel.LV7) ?? typhoon.windCircles[0];
  if (!outer) return 0;
  return outer[quadrantForBearing(brg)];
}

/**
 * 基于台风参数计算指定经纬度的风矢量
 *
 * 模型：
 *   - 眼墙内：风速线性增加（从 0 到最大）
 *   - 眼墙到风圈：风速线性衰减（从最大到 0）
 *   - 风向 = 切向（逆时针）+ 内流偏转（30° 向内）
 *   - 非对称：移动方向右侧风速 +15~20%
 */
export function computeWindAtPoint(
  lng: number,
  lat: number,
  typhoon: TyphoonStatus,
): WindVector {
  const d = haversineDistance(typhoon.centerLng, typhoon.centerLat, lng, lat);
  const brg = bearing(typhoon.centerLng, typhoon.centerLat, lng, lat);
  const maxRadius = radiusAtBearing(typhoon, brg);

  if (d > maxRadius || d < 0.5) return { speed: 0, direction: 0 };

  const eyeWallRadius = Math.max(8, Math.min(typhoon.radiusMaxWind, maxRadius * 0.35));
  const maxWind = typhoon.maxWindSpeed;

  let speed: number;
  if (d < eyeWallRadius) {
    speed = (d / eyeWallRadius) * maxWind * 0.7;
  } else {
    const t = (d - eyeWallRadius) / (maxRadius - eyeWallRadius);
    speed = maxWind * (1 - t * 0.85);
    speed = Math.max(0, speed);
  }

  const tangential = typhoon.centerLat >= 0
    ? (brg - 90 + 360) % 360
    : (brg + 90) % 360;
  const inflow = 30;
  const direction = typhoon.centerLat >= 0
    ? (tangential + inflow) % 360
    : (tangential - inflow + 360) % 360;

  const angleDiff = ((typhoon.movingDirection - brg + 360) % 360);
  if (angleDiff < 180) {
    speed *= 1.15;
  } else {
    speed *= 0.85;
  }

  return { speed: Math.round(speed * 10) / 10, direction };
}

export function computeWindGrid(
  centerLng: number,
  centerLat: number,
  extentDeg: number,
  steps: number,
  typhoon: TyphoonStatus,
): WindVector[][] {
  const grid: WindVector[][] = [];
  for (let r = 0; r < steps; r++) {
    const row: WindVector[] = [];
    for (let c = 0; c < steps; c++) {
      const lng = centerLng - extentDeg / 2 + (c / (steps - 1)) * extentDeg;
      const lat = centerLat - extentDeg / 2 + (r / (steps - 1)) * extentDeg;
      row.push(computeWindAtPoint(lng, lat, typhoon));
    }
    grid.push(row);
  }
  return grid;
}
