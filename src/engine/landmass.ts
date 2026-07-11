/**
 * 西北太平洋陆地边界框检测
 *
 * 当台风中心进入下列任意方块时，判定为登陆。
 * 坐标为 GCJ-02 / WGS-84 均可（西北太平洋偏移约 0.01° 不影响判定）。
 */

interface BBox {
  name: string;
  west: number;
  east: number;
  south: number;
  north: number;
}

const LAND_BOXES: BBox[] = [
  { name: '菲律宾', west: 116, east: 126, south: 5, north: 20 },
  { name: '台湾', west: 119, east: 122, south: 22, north: 26 },
  { name: '中国大陆', west: 110, east: 122, south: 20, north: 45 },
  { name: '中国内陆', west: 105, east: 115, south: 20, north: 40 },
  { name: '日本', west: 129, east: 145, south: 30, north: 45 },
  { name: '朝鲜半岛', west: 124, east: 130, south: 34, north: 43 },
  { name: '越南沿海', west: 106, east: 110, south: 8, north: 23 },
];

export function isOverLand(lng: number, lat: number): boolean {
  for (const box of LAND_BOXES) {
    if (
      lng >= box.west && lng <= box.east &&
      lat >= box.south && lat <= box.north
    ) {
      return true;
    }
  }
  return false;
}
