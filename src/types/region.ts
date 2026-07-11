export interface Region {
  id: string;
  name: string;
  west: number;
  east: number;
  south: number;
  north: number;
}

export interface AlertMessage {
  id: string;
  regionName: string;
  typhoonName: string;
  level: 'blue' | 'yellow' | 'orange' | 'red';
  distance: number;
  timestamp: number;
  message?: string;
}

export function distanceToRegion(
  lng: number,
  lat: number,
  region: Region,
): number {
  const dlng = lng < region.west ? region.west - lng : lng > region.east ? lng - region.east : 0;
  const dlat = lat < region.south ? region.south - lat : lat > region.north ? lat - region.north : 0;
  if (dlng === 0 && dlat === 0) return 0;
  const kmPerDeg = 111;
  return Math.round(Math.sqrt(dlng * dlng + dlat * dlat) * kmPerDeg);
}

export function getAlertLevel(distance: number): { level: 'blue' | 'yellow' | 'orange' | 'red'; label: string } | null {
  if (distance < 80) return { level: 'red', label: '红色紧急' };
  if (distance < 150) return { level: 'orange', label: '橙色警戒' };
  if (distance < 250) return { level: 'yellow', label: '黄色预警' };
  if (distance < 400) return { level: 'blue', label: '蓝色注意' };
  return null;
}

export const ALERT_LEVEL_COLORS: Record<string, string> = {
  blue: '#4FC3F7',
  yellow: '#FFD54F',
  orange: '#FF9944',
  red: '#EF5350',
};
