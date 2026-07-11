import React from 'react';
import { useUIStore } from '../../store/uiStore';
import { getWindLevelName, getWindLevelColor } from '../../types/typhoon';

export function WindDetail() {
  const hoveredPoint = useUIStore((s) => s.hoveredPoint);
  const detailPanelOpen = useUIStore((s) => s.detailPanelOpen);
  const setDetailPanelOpen = useUIStore((s) => s.setDetailPanelOpen);

  if (!detailPanelOpen || !hoveredPoint) return null;

  return (
    <div className="absolute bottom-20 left-4 z-10 bg-dark-surface/95 backdrop-blur-md border border-gray-700/50 rounded-lg p-4 font-mono text-sm min-w-[200px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 uppercase">风速详情</span>
        <button
          onClick={() => setDetailPanelOpen(false)}
          className="text-gray-500 hover:text-white text-xs"
        >
          ✕
        </button>
      </div>

      <div className="space-y-1.5 text-gray-300">
        <Row label="经度" value={hoveredPoint.lng.toFixed(4)} />
        <Row label="纬度" value={hoveredPoint.lat.toFixed(4)} />
        <Row label="距中心" value={`${hoveredPoint.distance} km`} />
        <Row label="风速" value={`${hoveredPoint.windSpeed.toFixed(1)} m/s`} />
        <div className="flex items-center gap-2 pt-1">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: getWindLevelColor(hoveredPoint.windLevel) }}
          />
          <span className="text-xs" style={{ color: getWindLevelColor(hoveredPoint.windLevel) }}>
            {getWindLevelName(hoveredPoint.windLevel)}
          </span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-200">{value}</span>
    </div>
  );
}
