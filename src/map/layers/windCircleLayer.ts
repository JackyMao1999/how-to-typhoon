import { TyphoonStatus, WindLevel, WIND_LEVEL_COLORS } from '../../types/typhoon';
import { generateWindCirclePolygon } from '../../utils/geo';
import { wgs84ToGcj02Batch } from '../../utils/coord';

interface LayerGroup {
  fill: any;
  outline: any;
}

const layers = new Map<WindLevel, LayerGroup>();

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
  const levels = [WindLevel.LV7, WindLevel.LV10, WindLevel.LV12];

  for (const level of levels) {
    const radii = status.windCircles.find((wc) => wc.level === level);
    if (!radii) continue;

    const wgsPoints = generateWindCirclePolygon(
      status.centerLng,
      status.centerLat,
      { ne: radii.ne, nw: radii.nw, se: radii.se, sw: radii.sw }
    );
    const gcjPoints = wgs84ToGcj02Batch(wgsPoints);

    const color = WIND_LEVEL_COLORS[level];
    const opacity = OPACITY[level];
    const weight = STROKE_WEIGHT[level];

    const existing = layers.get(level);

    if (existing) {
      existing.fill.setPath(gcjPoints);
      existing.outline.setPath(gcjPoints);
      continue;
    }

    const fill = new window.AMap.Polygon({
      path: gcjPoints,
      fillColor: color,
      fillOpacity: opacity,
      strokeColor: color,
      strokeWeight: 0,
      strokeOpacity: 0,
    });

    const outline = new window.AMap.Polyline({
      path: gcjPoints,
      strokeColor: color,
      strokeWeight: weight,
      strokeOpacity: 0.6,
      strokeStyle: 'dashed',
      borderWeight: 0,
    });

    layers.set(level, { fill, outline });
    map.add([fill, outline]);
  }
}

export function setWindCirclesVisible(visible: boolean): void {
  for (const [, group] of layers) {
    if (visible) {
      group.fill.show();
      group.outline.show();
    } else {
      group.fill.hide();
      group.outline.hide();
    }
  }
}

export function removeWindCircleLayers(map: any): void {
  for (const [, group] of layers) {
    map.remove([group.fill, group.outline]);
  }
  layers.clear();
}
