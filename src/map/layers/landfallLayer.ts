import L from 'leaflet';
import { LandfallPoint } from '../../types/typhoon';

let marker: any = null;
let currentMap: any = null;

export function updateLandfallLayer(map: any, point: LandfallPoint | undefined): void {
  currentMap = map;

  if (marker) {
    map.removeLayer(marker);
    marker = null;
  }

  if (!point) return;

  const html = `<div style="
    display:flex;align-items:center;gap:4px;
    background:rgba(239,68,68,0.85);
    color:white;font-size:11px;font-weight:700;
    font-family:monospace;
    padding:3px 10px;
    border-radius:20px;
    border:2px solid rgba(255,255,255,0.5);
    box-shadow:0 2px 12px rgba(239,68,68,0.4);
    white-space:nowrap;
  ">⬤ 登陆</div>`;

  marker = L.marker([point.lat, point.lng], {
    icon: L.divIcon({
      html,
      className: '',
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    }),
    zIndexOffset: 1000,
    interactive: false,
  }).addTo(map);
}

export function setLandfallVisible(visible: boolean): void {
  if (!currentMap || !marker) return;
  if (visible) marker.addTo(currentMap);
  else currentMap.removeLayer(marker);
}

export function removeLandfallLayer(): void {
  if (currentMap && marker) {
    currentMap.removeLayer(marker);
    marker = null;
  }
}
