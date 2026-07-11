import React from 'react';

interface SSTDisplay {
  x: number;
  y: number;
  temp: number;
  label: string;
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
      <div className="panel px-2.5 py-1.5">
        <span className="text-gray-300">{sst.label} </span>
        <span className={sst.temp >= 26.5 ? 'text-red-400' : 'text-blue-400'}>
          {sst.temp.toFixed(1)}°C
        </span>
        <span className="text-gray-600 ml-1">
          {sst.lat.toFixed(1)}°N
        </span>
      </div>
    </div>
  );
}
