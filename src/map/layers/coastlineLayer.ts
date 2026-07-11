import L from 'leaflet';
import { GSHHG_COASTLINE } from '../../data/landmask/coastline';

const MAX_POLYGONS = 150;
const MIN_VERTICES = 10;
const COLOR = '#7dd3fc';
const WEIGHT = 1;
const OPACITY = 0.5;

const renderPolygons = GSHHG_COASTLINE
  .slice(0, MAX_POLYGONS)
  .filter(p => p.length >= MIN_VERTICES);

const layers = new Map<number, any>();
let currentMap: any = null;

export function updateCoastlineLayer(map: any): void {
  currentMap = map;
  if (!map) return;

  for (let i = 0; i < renderPolygons.length; i++) {
    const coords = renderPolygons[i];
    if (layers.has(i)) continue;

    const latlngs = (coords as [number, number][]).map(([lng, lat]) => [lat, lng] as [number, number]);

    const polyline = L.polyline(latlngs, {
      color: COLOR,
      weight: WEIGHT,
      opacity: OPACITY,
      interactive: false,
    }).addTo(map);

    layers.set(i, polyline);
  }
}

export function setCoastlineVisible(visible: boolean): void {
  if (!currentMap) return;
  for (const [, layer] of layers) {
    if (visible) layer.addTo(currentMap);
    else currentMap.removeLayer(layer);
  }
}

export function removeCoastlineLayer(): void {
  if (!currentMap) return;
  for (const [, layer] of layers) {
    currentMap.removeLayer(layer);
  }
  layers.clear();
}
