import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const RESOLUTION = 0.1;
const WIDTH = Math.round(360 / RESOLUTION);
const HEIGHT = Math.round(180 / RESOLUTION);

function pointInPolygon(px, py, polygon) {
  let inside = false;
  const len = polygon.length;
  for (let i = 0, j = len - 1; i < len; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function pointInAnyPolygon(px, py, polygons) {
  for (const poly of polygons) {
    if (pointInPolygon(px, py, poly)) return true;
  }
  return false;
}

function extractAllPolygons(src) {
  const allPolys = [];
  const polygonRegex = /\[(-?\d+\.\d+),\s*(-?\d+\.\d+)(?:\s*,\s*(-?\d+\.\d+),\s*(-?\d+\.\d+))?(?:[^\]]*)\]/g;
  let m;
  while ((m = polygonRegex.exec(src)) !== null) {
    if (m[3] !== undefined && m[4] !== undefined) {
      allPolys.push([
        [parseFloat(m[1]), parseFloat(m[2])],
        [parseFloat(m[3]), parseFloat(m[4])],
      ]);
    }
  }
  return allPolys;
}

function extractPolygonsByKey(src) {
  const result = {};
  const keyRegex = /^\s*([A-Za-z'\-_]+):\s*\[/gm;
  let match;
  const positions = [];
  while ((match = keyRegex.exec(src)) !== null) {
    positions.push({ key: match[1], start: match.index + match[0].length, end: -1 });
  }
  for (let i = 0; i < positions.length; i++) {
    const startIdx = positions[i].start;
    let depth = 1;
    let j = startIdx;
    while (j < src.length && depth > 0) {
      if (src[j] === '[') depth++;
      else if (src[j] === ']') depth--;
      j++;
    }
    positions[i].end = j;
  }
  for (const p of positions) {
    const content = src.substring(p.start, p.end);
    const poly = [];
    const numRegex = /(-?\d+\.\d+)/g;
    let nm;
    const nums = [];
    while ((nm = numRegex.exec(content)) !== null) {
      nums.push(parseFloat(nm[1]));
    }
    for (let k = 0; k + 1 < nums.length; k += 2) {
      poly.push([nums[k], nums[k + 1]]);
    }
    if (poly.length > 2) {
      result[p.key] = poly;
    }
  }
  return result;
}

console.log(`Generating ${RESOLUTION}° grid: ${WIDTH} x ${HEIGHT} cells`);

const coastlineSrc = readFileSync('./src/data/landmask/coastline.ts', 'utf8');

// Extract all polygon arrays from coastline.ts
function extractGSHHGPolygons(src) {
  const arrayStart = src.indexOf('Polygon2D[] = [\n');
  if (arrayStart < 0) throw new Error('Could not find polygon array');
  const contentStart = src.indexOf('  [', arrayStart);
  const contentEnd = src.lastIndexOf('];');
  const content = src.substring(contentStart, contentEnd);
  // Now content has lines like: [ [x,y],[x,y],... ],
  // Split by lines starting with '  //' or '  ['
  const polygons = [];
  const polyRegex = /\[\s*\[/g;
  let match;
  while ((match = polyRegex.exec(content)) !== null) {
    const start = match.index;
    // Find matching closing bracket
    let depth = 0;
    let i = start;
    while (i < content.length) {
      if (content[i] === '[') depth++;
      else if (content[i] === ']') {
        depth--;
        if (depth === 0) {
          i++;
          break;
        }
      }
      i++;
    }
    const inner = content.substring(start, i);
    // Extract all number pairs
    const nums = [];
    const numRegex = /(-?\d+\.\d+)/g;
    let m;
    while ((m = numRegex.exec(inner)) !== null) nums.push(parseFloat(m[1]));
    const points = [];
    for (let j = 0; j + 1 < nums.length; j += 2) {
      points.push([nums[j], nums[j + 1]]);
    }
    if (points.length > 2) polygons.push(points);
  }
  return polygons;
}

const allLandPolygons = extractGSHHGPolygons(coastlineSrc);
console.log(`Loaded ${allLandPolygons.length} GSHHG polygons`);

const totalCells = WIDTH * HEIGHT;
const byteLen = Math.ceil(totalCells / 8);
const grid = new Uint8Array(byteLen);

console.log(`Grid: ${totalCells} cells, ${byteLen} bytes (${(byteLen / 1024).toFixed(1)} KB)`);

const bboxes = allLandPolygons.map((poly) => {
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
  for (const [lng, lat] of poly) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  return { minLng, maxLng, minLat, maxLat };
});

let landCount = 0;

for (let row = 0; row < HEIGHT; row++) {
  const lat = 90 - (row + 0.5) * RESOLUTION;
  for (let col = 0; col < WIDTH; col++) {
    const lng = -180 + (col + 0.5) * RESOLUTION;

    let isLand = false;
    for (let i = 0; i < allLandPolygons.length; i++) {
      const poly = allLandPolygons[i];
      const bb = bboxes[i];
      if (lng < bb.minLng - 0.5 || lng > bb.maxLng + 0.5) continue;
      if (lat < bb.minLat - 0.5 || lat > bb.maxLat + 0.5) continue;
      if (pointInPolygon(lng, lat, poly)) {
        isLand = true;
        break;
      }
    }

    if (isLand) {
      const cellIndex = row * WIDTH + col;
      const byteIndex = cellIndex >> 3;
      const bitIndex = cellIndex & 7;
      grid[byteIndex] |= 1 << bitIndex;
      landCount++;
    }
  }

  if ((row + 1) % 100 === 0 || row === HEIGHT - 1) {
    const progress = ((row + 1) / HEIGHT) * 100;
    process.stdout.write(`  Progress: ${progress.toFixed(1)}% (${landCount} land cells so far)\r`);
  }
}

console.log(`\nTotal land cells: ${landCount} (${((landCount / totalCells) * 100).toFixed(2)}% of Earth)`);

const base64 = Buffer.from(grid).toString('base64');

const tsContent = `// Auto-generated land/sea grid at ${RESOLUTION}° resolution
// ${WIDTH} x ${HEIGHT} = ${totalCells} cells, packed into ${byteLen} bytes
// Each bit: 1 = land, 0 = sea
// Generated: ${new Date().toISOString()}

export const LAND_GRID_RESOLUTION = ${RESOLUTION};
export const LAND_GRID_WIDTH = ${WIDTH};
export const LAND_GRID_HEIGHT = ${HEIGHT};
export const LAND_GRID_BIT_COUNT = ${totalCells};
export const LAND_GRID_BASE64 =
  '${base64}';

let cachedGrid: Uint8Array | null = null;

export function getLandGridData(): Uint8Array {
  if (cachedGrid) return cachedGrid;
  const binary = atob(LAND_GRID_BASE64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  cachedGrid = bytes;
  return bytes;
}

export function isOverLandFromGrid(
  lng: number,
  lat: number,
  data?: Uint8Array,
): boolean {
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return false;
  const col = Math.floor((lng + 180) / LAND_GRID_RESOLUTION);
  const row = Math.floor((90 - lat) / LAND_GRID_RESOLUTION);
  if (col < 0 || col >= LAND_GRID_WIDTH || row < 0 || row >= LAND_GRID_HEIGHT) return false;
  const dataRef = data || getLandGridData();
  const cellIndex = row * LAND_GRID_WIDTH + col;
  const byteIndex = cellIndex >> 3;
  const bitIndex = cellIndex & 7;
  return ((dataRef[byteIndex] >> bitIndex) & 1) === 1;
}
`;

mkdirSync('./src/data/landmask', { recursive: true });
writeFileSync('./src/data/landmask/grid.ts', tsContent);
console.log(`\nWrote src/data/landmask/grid.ts (${(tsContent.length / 1024).toFixed(1)} KB)`);
