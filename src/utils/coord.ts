const PI = Math.PI;
const A = 6378245.0;
const EE = 0.00669342162296594323;

function transformLat(x: number, y: number): number {
  let ret = -100 + 2 * x + 3 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  ret += ((20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) * 2) / 3;
  ret += ((20 * Math.sin(y * PI) + 40 * Math.sin((y / 3) * PI)) * 2) / 3;
  ret += ((160 * Math.sin((y / 12) * PI) + 320 * Math.sin((y * PI) / 30)) * 2) / 3;
  return ret;
}

function transformLon(x: number, y: number): number {
  let ret = 300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  ret += ((20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) * 2) / 3;
  ret += ((20 * Math.sin(x * PI) + 40 * Math.sin((x / 3) * PI)) * 2) / 3;
  ret += ((150 * Math.sin((x / 12) * PI) + 300 * Math.sin((x / 30) * PI)) * 2) / 3;
  return ret;
}

export function wgs84ToGcj02(wgsLng: number, wgsLat: number): [number, number] {
  let dLat = transformLat(wgsLng - 105, wgsLat - 35);
  let dLon = transformLon(wgsLng - 105, wgsLat - 35);
  const radLat = (wgsLat / 180) * PI;
  let magic = Math.sin(radLat);
  magic = 1 - EE * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180) / (((A * (1 - EE)) / (magic * sqrtMagic)) * PI);
  dLon = (dLon * 180) / ((A / sqrtMagic) * Math.cos(radLat) * PI);
  return [wgsLng + dLon, wgsLat + dLat];
}

export function wgs84ToGcj02Batch(points: [number, number][]): [number, number][] {
  return points.map(([lng, lat]) => wgs84ToGcj02(lng, lat));
}

export function gcj02ToWgs84(gcjLng: number, gcjLat: number): [number, number] {
  const [wl, wg] = wgs84ToGcj02(gcjLng, gcjLat);
  const dl = wl - gcjLng;
  const dg = wg - gcjLat;
  return [gcjLng - dl, gcjLat - dg];
}
