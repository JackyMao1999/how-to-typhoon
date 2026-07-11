import L from 'leaflet';
import { TyphoonStatus } from '../../types/typhoon';
import { getLevelHexColor, getTyphoonLevel } from '../../engine';

let polyline: any = null;
let glowPolyline: any = null;
let predPolyline: any = null;
let currentMap: any = null;

export function updatePathLayer(map: any, coords: [number, number][]): void {
  currentMap = map;
  if (coords.length < 2) return;

  const latlngs = coords.map(([lng, lat]) => [lat, lng] as [number, number]);

  if (polyline) {
    polyline.setLatLngs(latlngs);
    glowPolyline?.setLatLngs(latlngs);
    return;
  }

  polyline = L.polyline(latlngs, {
    color: '#4FC3F7',
    weight: 2.5,
    opacity: 0.7,
    interactive: false,
  }).addTo(map);

  glowPolyline = L.polyline(latlngs, {
    color: '#4FC3F7',
    weight: 6,
    opacity: 0.15,
    interactive: false,
  }).addTo(map);
}

export function updatePredictionLayer(map: any, coords: [number, number][]): void {
  currentMap = map;
  if (coords.length < 2) return;

  const latlngs = coords.map(([lng, lat]) => [lat, lng] as [number, number]);

  if (predPolyline) {
    predPolyline.setLatLngs(latlngs);
    return;
  }

  predPolyline = L.polyline(latlngs, {
    color: '#FF8844',
    weight: 2,
    opacity: 0.8,
    dashArray: '8 6',
    interactive: false,
  }).addTo(map);
}

export function removePathLayer(map: any): void {
  if (polyline) { map.removeLayer(polyline); polyline = null; }
  if (glowPolyline) { map.removeLayer(glowPolyline); glowPolyline = null; }
}

export function removePredictionLayer(map: any): void {
  if (predPolyline) { map.removeLayer(predPolyline); predPolyline = null; }
}

export function getPathTooltip(
  fullHistory: TyphoonStatus[],
  idx: number,
): { time: string; text: string; color: string } | null {
  const entry = fullHistory[idx];
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
  if (!currentMap) return;
  if (polyline) { visible ? polyline.addTo(currentMap) : currentMap.removeLayer(polyline); }
  if (glowPolyline) { visible ? glowPolyline.addTo(currentMap) : currentMap.removeLayer(glowPolyline); }
}

export function setPredictionVisible(visible: boolean): void {
  if (!currentMap) return;
  if (predPolyline) { visible ? predPolyline.addTo(currentMap) : currentMap.removeLayer(predPolyline); }
}

let ensembleCone: any = null;
let ensembleMembers: any[] = [];

export function updateEnsembleLayer(map: any, coneCoords: [number, number][]): void {
  currentMap = map;

  if (ensembleCone) { map.removeLayer(ensembleCone); ensembleCone = null; }
  for (const m of ensembleMembers) { map.removeLayer(m); }
  ensembleMembers = [];

  if (coneCoords.length < 3) return;

  const latlngs = coneCoords.map(([lng, lat]) => [lat, lng] as [number, number]);

  ensembleCone = L.polygon(latlngs, {
    color: '#FF8844',
    weight: 1,
    opacity: 0.15,
    fillColor: '#FF8844',
    fillOpacity: 0.03,
    interactive: false,
  }).addTo(map);
}

export function setEnsembleVisible(visible: boolean): void {
  if (!currentMap) return;
  if (ensembleCone) { visible ? ensembleCone.addTo(currentMap) : currentMap.removeLayer(ensembleCone); }
}

export function removeEnsembleLayer(map: any): void {
  if (ensembleCone) { map.removeLayer(ensembleCone); ensembleCone = null; }
  for (const m of ensembleMembers) { map.removeLayer(m); }
  ensembleMembers = [];
}
