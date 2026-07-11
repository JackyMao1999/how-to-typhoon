import { Region } from '../types/region';

export const PREDEFINED_REGIONS: Region[] = [
  { id: 'sc', name: '华南沿海', west: 110, east: 120, south: 20, north: 25 },
  { id: 'ec', name: '华东沿海', west: 118, east: 123, south: 25, north: 35 },
  { id: 'tw', name: '台湾', west: 119, east: 122, south: 22, north: 26 },
  { id: 'ph', name: '菲律宾', west: 116, east: 126, south: 5, north: 20 },
  { id: 'jp', name: '日本', west: 129, east: 145, south: 30, north: 45 },
  { id: 'kr', name: '朝鲜半岛', west: 124, east: 130, south: 34, north: 43 },
  { id: 'vn', name: '越南沿海', west: 106, east: 110, south: 8, north: 23 },
  { id: 'hn', name: '海南', west: 108, east: 111, south: 18, north: 20 },
];
