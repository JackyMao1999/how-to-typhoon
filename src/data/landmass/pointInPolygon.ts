export type Polygon2D = [number, number][];

export function pointInPolygon(px: number, py: number, polygon: Polygon2D): boolean {
  let inside = false;
  const len = polygon.length;
  for (let i = 0, j = len - 1; i < len; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

export function pointInAnyPolygon(px: number, py: number, polygons: Polygon2D[]): boolean {
  for (const poly of polygons) {
    if (pointInPolygon(px, py, poly)) return true;
  }
  return false;
}

export function findPolygonContaining(px: number, py: number, polygons: Record<string, Polygon2D>): string | null {
  for (const [name, poly] of Object.entries(polygons)) {
    if (pointInPolygon(px, py, poly)) return name;
  }
  return null;
}
