import { TyphoonStatus } from '../../types/typhoon';
import { destinationPoint } from '../../utils/geo';
import { wgs84ToGcj02Batch } from '../../utils/coord';

let polygon24: any = null;
let polygon48: any = null;

function generateCirclePoints(
  centerLng: number, centerLat: number,
  radiusKm: number, segments = 48
): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * 360;
    pts.push(destinationPoint(centerLng, centerLat, a, radiusKm));
  }
  return pts;
}

export function updateWarningLayers(
  map: any,
  status: TyphoonStatus,
  predCoords24: [number, number],
  predCoords48: [number, number],
): void {
  const speed = status.maxWindSpeed;
  const radius24 = Math.round(80 + (speed / 50) * 20);
  const radius48 = Math.round(145 + (speed / 50) * 25);

  const wgs24 = generateCirclePoints(predCoords24[0], predCoords24[1], radius24);
  const wgs48 = generateCirclePoints(predCoords48[0], predCoords48[1], radius48);
  const gcj24 = wgs84ToGcj02Batch(wgs24);
  const gcj48 = wgs84ToGcj02Batch(wgs48);

  if (polygon24) {
    polygon24.setPath(gcj24);
    polygon48.setPath(gcj48);
    return;
  }

  polygon24 = new window.AMap.Polygon({
    path: gcj24,
    fillColor: '#FFA500',
    fillOpacity: 0.2,
    strokeColor: '#FFA500',
    strokeWeight: 2,
    strokeOpacity: 0.7,
    strokeStyle: 'dashed',
  });

  polygon48 = new window.AMap.Polygon({
    path: gcj48,
    fillColor: '#0064FF',
    fillOpacity: 0.1,
    strokeColor: '#0064FF',
    strokeWeight: 2,
    strokeOpacity: 0.5,
    strokeStyle: 'dashed',
  });

  map.add([polygon24, polygon48]);
}

export function removeWarningLayers(map: any): void {
  if (polygon24) { map.remove(polygon24); polygon24 = null; }
  if (polygon48) { map.remove(polygon48); polygon48 = null; }
}

export function setWarningVisible(visible: boolean): void {
  if (polygon24) { visible ? polygon24.show() : polygon24.hide(); }
  if (polygon48) { visible ? polygon48.show() : polygon48.hide(); }
}
