import { TyphoonStatus } from '../../types/typhoon';
import { getLevelHexColor, getTyphoonLevel } from '../../engine';
import { wgs84ToGcj02Batch } from '../../utils/coord';

let polyline: any = null;
let glowPolyline: any = null;
let predPolyline: any = null;

export function updatePathLayer(map: any, gcjCoords: [number, number][]): void {
  if (gcjCoords.length < 2) return;

  if (polyline) {
    polyline.setPath(gcjCoords);
    glowPolyline?.setPath(gcjCoords);
    return;
  }

  polyline = new window.AMap.Polyline({
    path: gcjCoords,
    strokeColor: '#4FC3F7',
    strokeWeight: 2.5,
    strokeOpacity: 0.7,
    borderWeight: 0,
    lineJoin: 'round',
  });

  glowPolyline = new window.AMap.Polyline({
    path: gcjCoords,
    strokeColor: '#4FC3F7',
    strokeWeight: 6,
    strokeOpacity: 0.15,
    borderWeight: 0,
    lineJoin: 'round',
  });

  map.add([glowPolyline, polyline]);
}

export function updatePredictionLayer(map: any, gcjCoords: [number, number][]): void {
  if (gcjCoords.length < 2) return;

  if (predPolyline) {
    predPolyline.setPath(gcjCoords);
    return;
  }

  predPolyline = new window.AMap.Polyline({
    path: gcjCoords,
    strokeColor: '#FF8844',
    strokeWeight: 2,
    strokeOpacity: 0.8,
    strokeStyle: 'dashed',
    borderWeight: 0,
    lineJoin: 'round',
  });

  map.add(predPolyline);
}

export function removePathLayer(map: any): void {
  if (polyline) { map.remove(polyline); polyline = null; }
  if (glowPolyline) { map.remove(glowPolyline); glowPolyline = null; }
}

export function removePredictionLayer(map: any): void {
  if (predPolyline) { map.remove(predPolyline); predPolyline = null; }
}

export function getPathTooltip(
  fullHistory: TyphoonStatus[],
  gcjIdx: number,
): { time: string; text: string; color: string } | null {
  const entry = fullHistory[gcjIdx];
  if (!entry) return null;
  const level = getTyphoonLevel(entry.maxWindSpeed);
  const color = getLevelHexColor(entry.maxWindSpeed);
  const d = new Date(entry.timestamp);
  const time = d.toISOString().slice(0, 13).replace('T', ' ') + ':00';
  const stage = (() => {
    switch (level) {
      case 'td': return '热带低压';
      case 'ts': return '热带风暴';
      case 'sts': return '强热带风暴';
      case 'ty': return '台风';
      case 'sty': return '强台风';
      case 'sTY': return '超强台风';
      default: return '';
    }
  })();
  return { time, text: stage, color };
}

export function setPathVisible(visible: boolean): void {
  if (visible) { polyline?.show(); glowPolyline?.show(); }
  else { polyline?.hide(); glowPolyline?.hide(); }
}

export function setPredictionVisible(visible: boolean): void {
  if (visible) predPolyline?.show();
  else predPolyline?.hide();
}
