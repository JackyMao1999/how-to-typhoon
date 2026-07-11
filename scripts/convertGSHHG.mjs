import { readFileSync, writeFileSync, mkdirSync } from 'fs';

// ─── Read SHP file ───
const buf = readFileSync('./scripts/GSHHS_c_L1.shp');
const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
const fileLen = dv.getInt32(24, false) * 2;

const polygons = [];
let pos = 100;
let recordNum = 0;

while (pos + 12 <= fileLen) {
  const contentLen = dv.getInt32(pos + 4, false) * 2;
  if (contentLen <= 0) break;
  const contentStart = pos + 8;
  const recShapeType = dv.getInt32(contentStart, true);
  if (recShapeType === 5 || recShapeType === 15 || recShapeType === 25) {
    const numParts = dv.getInt32(contentStart + 36, true);
    const numPoints = dv.getInt32(contentStart + 40, true);
    const parts = [];
    for (let p = 0; p < numParts; p++) {
      parts.push(dv.getInt32(contentStart + 44 + p * 4, true));
    }
    const pointsStart = contentStart + 44 + numParts * 4;
    const coords = [];
    for (let i = 0; i < numPoints; i++) {
      const x = dv.getFloat64(pointsStart + i * 16, true);
      const y = dv.getFloat64(pointsStart + i * 16 + 8, true);
      coords.push([x, y]);
    }
    polygons.push(coords);
  }
  pos = contentStart + contentLen;
  recordNum++;
}

console.log(`Read ${polygons.length} polygons (${recordNum} records)`);
const totalPoints = polygons.reduce((s, p) => s + p.length, 0);
console.log(`Total vertices: ${totalPoints}`);

// ─── Convert polygon data to TypeScript ───
function formatCoords(coords) {
  const parts = [];
  for (let i = 0; i < coords.length; i++) {
    parts.push(`[${coords[i][0].toFixed(4)},${coords[i][1].toFixed(4)}]`);
  }
  return parts.join(',');
}

const tsData = polygons.map((coords, idx) => {
  const formatted = formatCoords(coords);
  const preview = coords.length > 5
    ? `${coords[0][0].toFixed(1)},${coords[0][1].toFixed(1)}...${coords[coords.length - 1][0].toFixed(1)},${coords[coords.length - 1][1].toFixed(1)}`
    : '';
  return `// Polygon ${idx + 1}: ${coords.length} vertices ${preview}\n  [${formatted}],`;
}).join('\n');

const tsContent = `// Auto-generated GSHHG coastline polygons (crude resolution)
// ${polygons.length} polygons, ${totalPoints} vertices
// Generated from GSHHS_c_L1.shp on ${new Date().toISOString()}

import { Polygon2D } from './pointInPolygon';

export const GSHHG_COASTLINE: Polygon2D[] = [
${tsData}
];
`;

writeFileSync('./src/data/landmask/coastline.ts', tsContent);
console.log(`\nWrote src/data/landmask/coastline.ts (${(tsContent.length / 1024).toFixed(1)} KB)`);
