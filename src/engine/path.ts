import { PathSmoothOptions, EngineConfig } from '../types/engine';
import { TyphoonStatus } from '../types/typhoon';
import { destinationPoint } from '../utils/geo';

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

function bearingVector(direction: number, speed: number): { east: number; north: number } {
  const rad = degToRad(direction);
  return {
    east: speed * Math.sin(rad),
    north: speed * Math.cos(rad),
  };
}

function vectorBearing(east: number, north: number): number {
  return (radToDeg(Math.atan2(east, north)) + 360) % 360;
}

export function smoothPath(
  points: [number, number][],
  options: PathSmoothOptions
): [number, number][] {
  if (points.length < 2) return points;
  const result: [number, number][] = [];
  const { tension, segmentsPerPoint } = options;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    for (let t = 0; t < segmentsPerPoint; t++) {
      const s = t / segmentsPerPoint;
      const s2 = s * s;
      const s3 = s2 * s;

      const h1 = 2 * s3 - 3 * s2 + 1;
      const h2 = -2 * s3 + 3 * s2;
      const h3 = s3 - 2 * s2 + s;
      const h4 = s3 - s2;

      const tf = 1 - tension;
      const lng =
        p1[0] * h1 +
        p2[0] * h2 +
        (p2[0] - p0[0]) * h3 * tf * 0.5 +
        (p3[0] - p1[0]) * h4 * tf * 0.5;
      const lat =
        p1[1] * h1 +
        p2[1] * h2 +
        (p2[1] - p0[1]) * h3 * tf * 0.5 +
        (p3[1] - p1[1]) * h4 * tf * 0.5;

      result.push([lng, lat]);
    }
  }
  result.push(points[points.length - 1]);
  return result;
}

/**
 * 纬度自适应引导流
 *
 * 西北太平洋台风路径由纬度决定的四段式转向模型：
 *   5°-20°N: 信风带，向西偏北 (~280°)
 *  20°-30°N: 副高西南侧，向西北 (~315°)
 *  30°-40°N: 西风带南缘，向北偏东 (~350°)
 *  40°N+:    西风带，向东北 (~045°)
 *
 * 同时叠加 Beta 漂移（恒定向北分量 ~2 km/h）
 */
export function applySteeringFlow(
  lat: number,
  baseSpeed: number,
  config: EngineConfig
): { direction: number; speed: number } {
  let steeringDir: number;
  let steeringSpeed: number;

  const absLat = Math.abs(lat);

  if (absLat < 20) {
    steeringDir = 280;
    steeringSpeed = baseSpeed * 0.8 + 5;
  } else if (absLat < 30) {
    const t = (absLat - 20) / 10;
    steeringDir = 280 + t * 35;
    steeringSpeed = baseSpeed * (0.8 + t * 0.3) + 3;
  } else if (absLat < 40) {
    const t = (absLat - 30) / 10;
    steeringDir = 315 + t * 35;
    steeringSpeed = baseSpeed * (1.1 + t * 0.3);
  } else {
    steeringDir = 45;
    steeringSpeed = baseSpeed * 1.5;
  }

  const betaSpeed = 2;
  const steering = bearingVector(steeringDir, steeringSpeed);
  const beta = bearingVector(0, betaSpeed);

  const vx = steering.east + beta.east;
  const vy = steering.north + beta.north;

  const { subtropicalHighDirection, subtropicalHighStrength } = config;
  const highStrength = absLat >= 35 ? 0 : subtropicalHighStrength;
  const high = bearingVector(subtropicalHighDirection, highStrength);
  const finalVx = vx + high.east;
  const finalVy = vy + high.north;

  const newSpeed = Math.sqrt(finalVx * finalVx + finalVy * finalVy);
  const newDirection = vectorBearing(finalVx, finalVy);

  return { direction: newDirection, speed: Math.round(newSpeed * 10) / 10 };
}

/**
 * 科里奥利偏转
 *
 * 台风移动受科里奥利力影响，北半球向右偏转。
 * 偏转强度 = sin(lat) × 速度 × 系数
 * 赤道附近 (lat < 5°) 偏转趋近于 0。
 */
export function applyCoriolisDeflection(
  direction: number,
  speed: number,
  lat: number,
  config: EngineConfig
): number {
  const absLat = Math.abs(lat);
  if (absLat < 5) return direction;

  const coriolisFactor = Math.sin(degToRad(absLat)) * config.coriolisCoefficient;
  const deflection = coriolisFactor * speed * 0.5;

  // 北半球向右偏（direction 增加），南半球向左偏（direction 减少）
  const sign = lat >= 0 ? 1 : -1;
  return (direction + sign * deflection + 360) % 360;
}

/**
 * 前向推演预测路径
 * 基于当前台风状态和引擎配置，模拟未来 N 步的经纬度序列
 */
export function predictPath(
  status: TyphoonStatus,
  config: EngineConfig,
  steps: number
): [number, number][] {
  const points: [number, number][] = [[status.centerLng, status.centerLat]];
  let tempLng = status.centerLng;
  let tempLat = status.centerLat;
  let tempSpeed = status.movingSpeed;
  for (let i = 0; i < steps; i++) {
    const { direction: newDir, speed: newSpeed } = applySteeringFlow(tempLat, tempSpeed, config);
    const finalDir = applyCoriolisDeflection(newDir, newSpeed, tempLat, config);
    const [nextLng, nextLat] = advancePosition(tempLng, tempLat, finalDir, newSpeed, config.timeStep);
    tempLng = nextLng;
    tempLat = nextLat;
    tempSpeed = newSpeed;
    points.push([tempLng, tempLat]);
  }
  return points;
}

/**
 * 集合预报路径
 * 在副高方向、副高强度、移动速度上叠加随机扰动
 * 生成 ensembleSize 条不同路径用于显示概率范围
 */
export function predictPathEnsemble(
  status: TyphoonStatus,
  config: EngineConfig,
  steps: number,
  ensembleSize: number,
): [number, number][] {
  const allPaths: [number, number][][] = [];
  for (let e = 0; e < ensembleSize; e++) {
    const perturbed: EngineConfig = {
      ...config,
      subtropicalHighDirection: config.subtropicalHighDirection + (Math.random() - 0.5) * 40,
      subtropicalHighStrength: Math.max(0, config.subtropicalHighStrength + (Math.random() - 0.5) * 6),
    };
    const base = status.movingSpeed;
    const perturbedSpeed = Math.max(5, base + (Math.random() - 0.5) * base * 0.6);
    const points: [number, number][] = [[status.centerLng, status.centerLat]];
    let tempLng = status.centerLng;
    let tempLat = status.centerLat;
    let tempSpeed = perturbedSpeed;
    for (let i = 0; i < steps; i++) {
      const { direction: newDir, speed: newSpeed } = applySteeringFlow(tempLat, tempSpeed, perturbed);
      const finalDir = applyCoriolisDeflection(newDir, newSpeed, tempLat, perturbed);
      const [nextLng, nextLat] = advancePosition(tempLng, tempLat, finalDir, newSpeed, config.timeStep);
      tempLng = nextLng;
      tempLat = nextLat;
      tempSpeed = newSpeed;
      points.push([tempLng, tempLat]);
    }
    allPaths.push(points);
  }

  const memberCount = allPaths.length;
  const stepCount = allPaths[0].length;

  const coneLeft: [number, number][] = [];
  const coneRight: [number, number][] = [];

  for (let s = 0; s < stepCount; s++) {
    const lngs = allPaths.map((p) => p[s][0]).sort((a, b) => a - b);
    const lats = allPaths.map((p) => p[s][1]).sort((a, b) => a - b);
    const leftIdx = Math.floor(memberCount * 0.2);
    const rightIdx = Math.ceil(memberCount * 0.8) - 1;
    coneLeft.push([lngs[leftIdx], lats[leftIdx]]);
    coneRight.push([lngs[rightIdx], lats[rightIdx]]);
  }

  const cone: [number, number][] = [...coneLeft, ...coneRight.reverse(), coneLeft[0]];
  return cone;
}

export function advancePosition(
  currentLng: number,
  currentLat: number,
  direction: number,
  speedKmh: number,
  timeStepMs: number
): [number, number] {
  const hours = timeStepMs / 3600000;
  const distKm = speedKmh * hours;
  return destinationPoint(currentLng, currentLat, direction, distKm);
}
