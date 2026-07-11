import React from 'react';

interface SSTDisplay {
  x: number;
  y: number;
  sst: number;
  lng: number;
  lat: number;
}

export function SeaTempTooltip({ sst }: { sst: SSTDisplay | null }) {
  if (!sst) return null;
  return (
    <div
      className="fixed z-50 pointer-events-none font-mono text-xs"
      style={{ left: sst.x + 14, top: sst.y - 10 }}
    >
      <div className="bg-dark-bg/85 backdrop-blur border border-gray-600/60 rounded px-2 py-1">
        <span className="text-gray-300">海温 </span>
        <span className={sst.sst >= 26.5 ? 'text-red-400' : 'text-blue-400'}>
          {sst.sst.toFixed(1)}°C
        </span>
        <span className="text-gray-600 ml-1">
          {sst.lat.toFixed(1)}°N
        </span>
      </div>
    </div>
  );
}
