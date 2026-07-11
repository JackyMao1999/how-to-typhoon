import { TyphoonStatus, WindLevel } from '../types/typhoon';
import { haversineDistance, bearing } from '../utils/geo';
import { degToRad, radToDeg } from '../utils/geo';

const EYE_WALL_RATIO = 0.15;

export interface WindVector {
  speed: number;
  direction: number;
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
  const maxRadius = Math.max(
    ...typhoon.windCircles.map((wc) => Math.max(wc.ne, wc.nw, wc.se, wc.sw)),
  );

  if (d > maxRadius || d < 0.5) return { speed: 0, direction: 0 };

  const eyeWallRadius = maxRadius * EYE_WALL_RATIO;
  const maxWind = typhoon.maxWindSpeed;

  let speed: number;
  if (d < eyeWallRadius) {
    speed = (d / eyeWallRadius) * maxWind * 0.7;
  } else {
    const t = (d - eyeWallRadius) / (maxRadius - eyeWallRadius);
    speed = maxWind * (1 - t * 0.85);
    speed = Math.max(0, speed);
  }

  const brg = bearing(typhoon.centerLng, typhoon.centerLat, lng, lat);
  const tangential = (brg + 90) % 360;
  const inflow = 30;
  const direction = (tangential + inflow) % 360;

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
