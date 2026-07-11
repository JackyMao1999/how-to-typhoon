import L from 'leaflet';
import { TyphoonStatus } from '../../types/typhoon';
import { destinationPoint } from '../../utils/geo';

let polygon24: any = null;
let polygon48: any = null;
let currentMap: any = null;

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
  currentMap = map;
  const speed = status.maxWindSpeed;
  const radius24 = Math.round(80 + (speed / 50) * 20);
  const radius48 = Math.round(145 + (speed / 50) * 25);

  const wgs24 = generateCirclePoints(predCoords24[0], predCoords24[1], radius24);
  const wgs48 = generateCirclePoints(predCoords48[0], predCoords48[1], radius48);
  const latlngs24 = wgs24.map(([lng, lat]) => [lat, lng] as [number, number]);
  const latlngs48 = wgs48.map(([lng, lat]) => [lat, lng] as [number, number]);

  if (polygon24) {
    polygon24.setLatLngs(latlngs24);
    polygon48.setLatLngs(latlngs48);
    return;
  }

  polygon24 = L.polygon(latlngs24, {
    color: '#FFA500',
    weight: 2,
    opacity: 0.7,
    fillColor: '#FFA500',
    fillOpacity: 0.2,
    dashArray: '8 6',
    interactive: false,
  }).addTo(map);

  polygon48 = L.polygon(latlngs48, {
    color: '#0064FF',
    weight: 2,
    opacity: 0.5,
    fillColor: '#0064FF',
    fillOpacity: 0.1,
    dashArray: '8 6',
    interactive: false,
  }).addTo(map);
}

export function removeWarningLayers(map: any): void {
  if (polygon24) { map.removeLayer(polygon24); polygon24 = null; }
  if (polygon48) { map.removeLayer(polygon48); polygon48 = null; }
}

export function setWarningVisible(visible: boolean): void {
  if (!currentMap || !polygon24) return;
  if (visible) {
    polygon24.addTo(currentMap);
    polygon48.addTo(currentMap);
  } else {
    currentMap.removeLayer(polygon24);
    currentMap.removeLayer(polygon48);
  }
}
