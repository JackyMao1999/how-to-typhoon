import { GSHHG_COASTLINE } from '../data/landmask/coastline';
import { isOverLandFromGrid, getLandGridData } from '../data/landmask/grid';
import { pointInPolygon, pointInAnyPolygon } from '../data/landmass/pointInPolygon';

let gridData: Uint8Array | null = null;
function getGrid(): Uint8Array {
  if (!gridData) gridData = getLandGridData();
  return gridData;
}

export function isOverLand(lng: number, lat: number): boolean {
  if (isOverLandFromGrid(lng, lat)) return true;
  for (let i = 0; i < GSHHG_COASTLINE.length && i < 100; i++) {
    if (pointInPolygon(lng, lat, GSHHG_COASTLINE[i])) return true;
  }
  return false;
}

// Heuristic continent/ocean naming by bounding box
export function getContinent(lng: number, lat: number): string | null {
  if (!isOverLand(lng, lat)) return null;
  if (lat < -35 && lng > 110 && lng < 155) return 'Oceania';
  if (lng > 35 && lng < 70 && lat > 0 && lat < 40) return 'Asia';
  if (lng > 70 && lng < 180 && lat > -15 && lat < 60) return 'Asia';
  if (lng > -10 && lng < 40 && lat > 0 && lat < 40) return 'Africa';
  if (lng > -10 && lng < 40 && lat > 35 && lat < 75) return 'Europe';
  if (lng > -180 && lng < -80 && lat > 10 && lat < 60) return 'North America';
  if (lng > -90 && lng < -30 && lat > -60 && lat < 10) return 'South America';
  if (lng < -90 && lat > -80 && lat < -50) return 'South America';
  if (lng > -10 && lng < 70 && lat < 0 && lat > -35) return 'Africa';
  if (lng > -180 && lng < -20 && lat > 60) return 'North America';
  return null;
}

export function getOcean(lng: number, lat: number): string | null {
  if (lng > 100 && lng < 180 && lat > -70 && lat < 70) return 'Pacific';
  if (lng > -180 && lng < -70 && lat > -70 && lat < 70) return 'Pacific';
  if (lng > -70 && lng < 30 && lat > -70 && lat < 70) return 'Atlantic';
  if (lng > 30 && lng < 100 && lat > -70 && lat < 30) return 'Indian';
  if (lat > 65) return 'Arctic';
  return null;
}

export interface LocationInfo {
  type: 'land' | 'ocean';
  continent: string | null;
  ocean: string | null;
  locationName: string;
}

const OCEAN_CN: Record<string, string> = {
  Pacific: '太平洋',
  Atlantic: '大西洋',
  Indian: '印度洋',
  Arctic: '北冰洋',
};

export function getLocationInfo(lng: number, lat: number): LocationInfo {
  if (isOverLand(lng, lat)) {
    const continent = getContinent(lng, lat);
    if (continent) {
      return { type: 'land', continent, ocean: null, locationName: continent };
    }
    if (lat > 55 && lng > -180 && lng < -20) return { type: 'land', continent: 'North America', ocean: null, locationName: 'North America' };
    return { type: 'land', continent: null, ocean: null, locationName: '陆地' };
  }

  const ocean = getOcean(lng, lat);
  if (ocean) {
    return { type: 'ocean', continent: null, ocean, locationName: OCEAN_CN[ocean] || ocean };
  }
  return { type: 'ocean', continent: null, ocean: null, locationName: '海洋' };
}
