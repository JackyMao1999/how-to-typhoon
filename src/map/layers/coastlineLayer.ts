import { GSHHG_COASTLINE } from '../../data/landmask/coastline';
import { wgs84ToGcj02Batch } from '../../utils/coord';

const MAX_POLYGONS_RENDER = 200;
const MIN_VERTICES = 10;
const COASTLINE_COLOR = '#7dd3fc';
const COASTLINE_WEIGHT = 1;
const COASTLINE_OPACITY = 0.6;

interface LayerEntry {
  polygon: any;
}

const layers = new Map<number, LayerEntry>();

// Pre-filter: only render polygons with enough vertices
const renderPolygons = GSHHG_COASTLINE
  .slice(0, MAX_POLYGONS_RENDER)
  .filter(p => p.length >= MIN_VERTICES);

export function updateCoastlineLayer(map: any): void {
  if (!map) return;

  for (let i = 0; i < renderPolygons.length; i++) {
    const coords = renderPolygons[i];
    const existing = layers.get(i);

    if (existing) {
      continue;
    }

    const gcjCoords = wgs84ToGcj02Batch(coords as [number, number][]);

    const polygon = new window.AMap.Polyline({
      path: gcjCoords,
      strokeColor: COASTLINE_COLOR,
      strokeWeight: COASTLINE_WEIGHT,
      strokeOpacity: COASTLINE_OPACITY,
      cursor: 'default',
    });

    map.add(polygon);
    layers.set(i, { polygon });
  }
}

export function setCoastlineVisible(visible: boolean): void {
  for (const [, entry] of layers) {
    if (visible) entry.polygon.show();
    else entry.polygon.hide();
  }
}

export function removeCoastlineLayer(): void {
  for (const [, entry] of layers) {
    // map removal handled externally
  }
  layers.clear();
}
