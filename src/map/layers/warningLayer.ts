import { TyphoonStatus } from '../../types/typhoon';
import { destinationPoint } from '../../utils/geo';
import { wgs84ToGcj02Batch } from '../../utils/coord';

let line24: any = null;
let line48: any = null;

function generateCirclePoints(
  centerLng: number,
  centerLat: number,
  radiusKm: number,
  segments: number = 64
): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * 360;
    points.push(destinationPoint(centerLng, centerLat, angle, radiusKm));
  }
  points.push(points[0]);
  return points;
}

export function updateWarningLayers(map: any, status: TyphoonStatus): void {
  const speed = status.movingSpeed;
  const radius24 = Math.round(speed * 24);
  const radius48 = Math.round(speed * 48);

  if (radius24 < 10) return;

  const wgs24 = generateCirclePoints(status.centerLng, status.centerLat, radius24);
  const wgs48 = generateCirclePoints(status.centerLng, status.centerLat, radius48);
  const gcj24 = wgs84ToGcj02Batch(wgs24);
  const gcj48 = wgs84ToGcj02Batch(wgs48);

  if (line24) {
    line24.setPath(gcj24);
    line48.setPath(gcj48);
    return;
  }

  line24 = new window.AMap.Polyline({
    path: gcj24,
    strokeColor: '#FF4444',
    strokeWeight: 2.5,
    strokeOpacity: 0.7,
    strokeStyle: 'dashed',
    borderWeight: 0,
  });

  line48 = new window.AMap.Polyline({
    path: gcj48,
    strokeColor: '#FF8844',
    strokeWeight: 2,
    strokeOpacity: 0.5,
    strokeStyle: 'dashed',
    borderWeight: 0,
  });

  map.add([line24, line48]);

  // text labels via AMap.Text or Marker
  const mid24 = destinationPoint(status.centerLng, status.centerLat, 0, radius24);
  const mid48 = destinationPoint(status.centerLng, status.centerLat, 0, radius48);

  const marker24 = new window.AMap.Text({
    text: '24h',
    position: wgs84ToGcj02Batch([mid24])[0],
    style: {
      color: '#FF4444',
      fontSize: '11px',
      fontWeight: 'bold',
      fontFamily: 'monospace',
      backgroundColor: 'transparent',
      border: 'none',
    },
  });

  const marker48 = new window.AMap.Text({
    text: '48h',
    position: wgs84ToGcj02Batch([mid48])[0],
    style: {
      color: '#FF8844',
      fontSize: '11px',
      fontWeight: 'bold',
      fontFamily: 'monospace',
      backgroundColor: 'transparent',
      border: 'none',
    },
  });

  // attach as properties so we can remove them later
  (line24 as any)._label = marker24;
  (line48 as any)._label = marker48;
  map.add([marker24, marker48]);
}

export function removeWarningLayers(map: any): void {
  if (line24) {
    if ((line24 as any)._label) map.remove((line24 as any)._label);
    map.remove(line24);
    line24 = null;
  }
  if (line48) {
    if ((line48 as any)._label) map.remove((line48 as any)._label);
    map.remove(line48);
    line48 = null;
  }
}

export function setWarningVisible(visible: boolean): void {
  if (line24) {
    if (visible) {
      line24.show();
      (line24 as any)._label?.show();
    } else {
      line24.hide();
      (line24 as any)._label?.hide();
    }
  }
  if (line48) {
    if (visible) {
      line48.show();
      (line48 as any)._label?.show();
    } else {
      line48.hide();
      (line48 as any)._label?.hide();
    }
  }
}
