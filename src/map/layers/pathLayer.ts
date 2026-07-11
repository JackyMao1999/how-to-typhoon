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

export function setPathVisible(visible: boolean): void {
  if (visible) { polyline?.show(); glowPolyline?.show(); }
  else { polyline?.hide(); glowPolyline?.hide(); }
}

export function setPredictionVisible(visible: boolean): void {
  if (visible) predPolyline?.show();
  else predPolyline?.hide();
}
