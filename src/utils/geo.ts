const EARTH_RADIUS_KM = 6371;

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function haversineDistance(
  lng1: number, lat1: number,
  lng2: number, lat2: number
): number {
  const dLat = degToRad(lat2 - lat1);
  const dLng = degToRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(degToRad(lat1)) * Math.cos(degToRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function destinationPoint(
  lng: number, lat: number,
  bearingDeg: number, distKm: number
): [number, number] {
  const bearing = degToRad(bearingDeg);
  const φ1 = degToRad(lat);
  const λ1 = degToRad(lng);
  const R = EARTH_RADIUS_KM;
  const φ2 = Math.asin(
    Math.sin(φ1) * Math.cos(distKm / R) +
    Math.cos(φ1) * Math.sin(distKm / R) * Math.cos(bearing)
  );
  const λ2 =
    λ1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(distKm / R) * Math.cos(φ1),
      Math.cos(distKm / R) - Math.sin(φ1) * Math.sin(φ2)
    );
  return [radToDeg(λ2), radToDeg(φ2)];
}

export function bearing(
  lng1: number, lat1: number,
  lng2: number, lat2: number
): number {
  const φ1 = degToRad(lat1);
  const φ2 = degToRad(lat2);
  const Δλ = degToRad(lng2 - lng1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (radToDeg(Math.atan2(y, x)) + 360) % 360;
}

/**
 * 生成非对称风圈多边形（扇区间线性插值，消除折角）
 *
 * 每个 90° 扇区从「上个象限半径」平滑过渡到「当前象限半径」：
 *   NE 扇区 (315-45°):  prev=NW → curr=NE
 *   SE 扇区 (45-135°):  prev=NE → curr=SE
 *   SW 扇区 (135-225°): prev=SE → curr=SW
 *   NW 扇区 (225-315°): prev=SW → curr=NW
 */
export function generateWindCirclePolygon(
  centerLng: number,
  centerLat: number,
  radii: { ne: number; nw: number; se: number; sw: number },
  segments: number = 96
): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * 360;
    const t = (angle % 90) / 90;
    let radius: number;
    if (angle >= 315 || angle < 45) {
      radius = radii.nw * (1 - t) + radii.ne * t;
    } else if (angle >= 45 && angle < 135) {
      radius = radii.ne * (1 - t) + radii.se * t;
    } else if (angle >= 135 && angle < 225) {
      radius = radii.se * (1 - t) + radii.sw * t;
    } else {
      radius = radii.sw * (1 - t) + radii.nw * t;
    }
    const [lng2, lat2] = destinationPoint(centerLng, centerLat, angle, radius);
    points.push([lng2, lat2]);
  }
  return points;
}
