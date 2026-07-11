import L from 'leaflet';
import { PREDEFINED_REGIONS } from '../../data/regions';

interface RegionGroup {
  polygon: any;
  label: any;
}

const layers = new Map<string, RegionGroup>();

function regionLatLngs(west: number, east: number, south: number, north: number): [number, number][] {
  return [
    [south, west],
    [south, east],
    [north, east],
    [north, west],
    [south, west],
  ];
}

export function updateRegionLayers(map: any, regionIds: string[]): void {
  PREDEFINED_REGIONS.forEach((region) => {
    const active = regionIds.includes(region.id);
    const existing = layers.get(region.id);

    if (!active) {
      if (existing) {
        map.removeLayer(existing.polygon);
        map.removeLayer(existing.label);
        layers.delete(region.id);
      }
      return;
    }

    if (existing) {
      return;
    }

    const latlngs = regionLatLngs(region.west, region.east, region.south, region.north);

    const polygon = L.polygon(latlngs, {
      color: '#38bdf8',
      weight: 1.5,
      opacity: 0.4,
      fillColor: '#38bdf8',
      fillOpacity: 0.05,
      dashArray: '8 6',
      interactive: false,
    }).addTo(map);

    const centerLat = (region.south + region.north) / 2;
    const centerLng = (region.west + region.east) / 2;

    const label = L.marker([centerLat, centerLng], {
      icon: L.divIcon({
        html: `<div style="
          font-size: 11px; font-weight: 600; font-family: monospace;
          color: #7dd3fc; background: rgba(8,13,27,0.72);
          border: 1px solid rgba(56,189,248,0.25);
          border-radius: 6px; padding: 2px 8px;
          white-space: nowrap;
        ">${region.name}</div>`,
        className: '',
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      }),
      interactive: false,
    }).addTo(map);

    layers.set(region.id, { polygon, label });
  });
}

export function removeRegionLayers(map: any): void {
  for (const [, group] of layers) {
    map.removeLayer(group.polygon);
    map.removeLayer(group.label);
  }
  layers.clear();
}
