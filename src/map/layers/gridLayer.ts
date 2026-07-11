import L from 'leaflet';

const GRID_LINE_COLOR = '#1a3a5c';
const GRID_LINE_OPACITY = 0.2;
const GRID_LINE_WEIGHT = 0.5;
const TROPIC_COLOR = '#2a4a3c';
const TROPIC_OPACITY = 0.35;
const TROPIC_WEIGHT = 1;

export function createGraticuleLayer(): L.LayerGroup {
  const group = L.layerGroup();

  for (let lng = -180; lng <= 180; lng += 10) {
    const pts: [number, number][] = [];
    for (let lat = -90; lat <= 90; lat += 2) {
      pts.push([lat, lng]);
    }
    const line = L.polyline(pts, {
      color: GRID_LINE_COLOR,
      weight: GRID_LINE_WEIGHT,
      opacity: GRID_LINE_OPACITY,
      interactive: false,
    });
    group.addLayer(line);
  }

  for (let lat = -80; lat <= 80; lat += 10) {
    const pts: [number, number][] = [];
    for (let lng = -180; lng <= 180; lng += 2) {
      pts.push([lat, lng]);
    }
    const line = L.polyline(pts, {
      color: GRID_LINE_COLOR,
      weight: GRID_LINE_WEIGHT,
      opacity: GRID_LINE_OPACITY,
      interactive: false,
    });
    group.addLayer(line);
  }

  // Tropic of Cancer
  const cancer: [number, number][] = [];
  for (let lng = -180; lng <= 180; lng += 2) cancer.push([23.44, lng]);
  group.addLayer(L.polyline(cancer, {
    color: TROPIC_COLOR, weight: TROPIC_WEIGHT, opacity: TROPIC_OPACITY, dashArray: '6 4', interactive: false,
  }));

  // Tropic of Capricorn
  const capricorn: [number, number][] = [];
  for (let lng = -180; lng <= 180; lng += 2) capricorn.push([-23.44, lng]);
  group.addLayer(L.polyline(capricorn, {
    color: TROPIC_COLOR, weight: TROPIC_WEIGHT, opacity: TROPIC_OPACITY, dashArray: '6 4', interactive: false,
  }));

  // Equator
  const equator: [number, number][] = [];
  for (let lng = -180; lng <= 180; lng += 2) equator.push([0, lng]);
  group.addLayer(L.polyline(equator, {
    color: TROPIC_COLOR, weight: TROPIC_WEIGHT, opacity: TROPIC_OPACITY * 1.5, interactive: false,
  }));

  return group;
}
