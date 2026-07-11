import { TyphoonStatus, WindLevel, WIND_LEVEL_COLORS } from '../../types/typhoon';
import { generateWindCirclePolygon } from '../../utils/geo';
import L from 'leaflet';

interface LayerGroup {
  fill: any;
  outline: any;
}

const layers = new Map<WindLevel, LayerGroup>();
let currentMap: any = null;

const OPACITY: Record<WindLevel, number> = {
  [WindLevel.LV7]: 0.08,
  [WindLevel.LV10]: 0.12,
  [WindLevel.LV12]: 0.15,
};

const STROKE_WEIGHT: Record<WindLevel, number> = {
  [WindLevel.LV7]: 1,
  [WindLevel.LV10]: 1.5,
  [WindLevel.LV12]: 2,
};

export function updateWindCircleLayers(map: any, status: TyphoonStatus): void {
  currentMap = map;

  for (const [, group] of layers) {
    map.removeLayer(group.fill);
    map.removeLayer(group.outline);
  }
  layers.clear();

  const levels = [WindLevel.LV7, WindLevel.LV10, WindLevel.LV12];

  for (const level of levels) {
    const radii = status.windCircles.find((wc) => wc.level === level);
    if (!radii) continue;

    const wgsPoints = generateWindCirclePolygon(
      status.centerLng,
      status.centerLat,
      { ne: radii.ne, nw: radii.nw, se: radii.se, sw: radii.sw }
    );
    const latlngs = wgsPoints.map(([lng, lat]) => [lat, lng] as [number, number]);

    const color = WIND_LEVEL_COLORS[level];
    const opacity = OPACITY[level];
    const weight = STROKE_WEIGHT[level];

    const fill = L.polygon(latlngs, {
      color: 'transparent',
      fillColor: color,
      fillOpacity: opacity,
      interactive: false,
    }).addTo(map);

    const outline = L.polyline(latlngs, {
      color: color,
      weight: weight,
      opacity: 0.6,
      dashArray: '8 6',
      interactive: false,
    }).addTo(map);

    layers.set(level, { fill, outline });
  }
}

export function setWindCirclesVisible(visible: boolean): void {
  if (!currentMap) return;
  for (const [, group] of layers) {
    if (visible) {
      if (!currentMap.hasLayer(group.fill)) group.fill.addTo(currentMap);
      if (!currentMap.hasLayer(group.outline)) group.outline.addTo(currentMap);
    } else {
      currentMap.removeLayer(group.fill);
      currentMap.removeLayer(group.outline);
    }
  }
}

export function removeWindCircleLayers(map: any): void {
  for (const [, group] of layers) {
    map.removeLayer(group.fill);
    map.removeLayer(group.outline);
  }
  layers.clear();
}
