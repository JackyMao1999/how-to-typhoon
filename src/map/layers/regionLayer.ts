import { PREDEFINED_REGIONS } from '../../data/regions';
import { wgs84ToGcj02, wgs84ToGcj02Batch } from '../../utils/coord';

interface RegionGroup {
  polygon: any;
  label: any | null;
}

const layers = new Map<string, RegionGroup>();

function regionRectCorners(west: number, east: number, south: number, north: number): [number, number][] {
  const wgs: [number, number][] = [
    [west, south],
    [east, south],
    [east, north],
    [west, north],
    [west, south],
  ];
  return wgs84ToGcj02Batch(wgs);
}

export function updateRegionLayers(map: any, regionIds: string[]): void {
  PREDEFINED_REGIONS.forEach((region) => {
    const active = regionIds.includes(region.id);
    const existing = layers.get(region.id);

    if (!active) {
      if (existing) {
        existing.polygon.hide();
        existing.label.hide();
      }
      return;
    }

    if (existing) {
      existing.polygon.show();
      existing.label.show();
      return;
    }

    const gcj = regionRectCorners(region.west, region.east, region.south, region.north);

    const polygon = new window.AMap.Polygon({
      path: gcj,
      fillColor: '#38bdf8',
      fillOpacity: 0.05,
      strokeColor: '#38bdf8',
      strokeWeight: 1.5,
      strokeOpacity: 0.4,
      strokeStyle: 'dashed',
    });

    const centerLng = (region.west + region.east) / 2;
    const centerLat = (region.south + region.north) / 2;
    const [gcjLng, gcjLat] = wgs84ToGcj02(centerLng, centerLat);

    const label = new window.AMap.Text({
      text: region.name,
      anchor: 'center',
      draggable: false,
      cursor: 'default',
      offset: [0, 0],
      position: [gcjLng, gcjLat],
      style: {
        'font-size': '11px',
        'font-weight': '600',
        'font-family': 'monospace',
        'color': '#7dd3fc',
        'background': 'rgba(8, 13, 27, 0.72)',
        'border': '1px solid rgba(56, 189, 248, 0.25)',
        'border-radius': '6px',
        'padding': '2px 8px',
        'backdrop-filter': 'blur(8px)',
        'white-space': 'nowrap',
      },
    });

    map.add([polygon, label]);
    layers.set(region.id, { polygon, label });
  });
}

export function removeRegionLayers(map: any): void {
  for (const [, group] of layers) {
    const items = group.label ? [group.polygon, group.label] : [group.polygon];
    map.remove(items);
  }
  layers.clear();
}
