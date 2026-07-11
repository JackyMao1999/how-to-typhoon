import React from 'react';
import { useDisplayState } from '../../store/typhoonStore';
import { getWindLevelColor, WindLevel, LIFE_STAGE_LABELS } from '../../types/typhoon';

export function Dashboard() {
  const current = useDisplayState();

  return (
    <div className="absolute top-4 left-4 z-10 bg-dark-surface/90 backdrop-blur-md border border-gray-700/50 rounded-lg p-4 min-w-[240px] font-mono text-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-typhoon-lv7 animate-pulse" />
        <span className="text-lg font-bold text-white tracking-wide">
          {current.name}
        </span>
        <span className="text-xs text-gray-400">{current.id}</span>
      </div>

      <div className="space-y-2 text-gray-300">
        <Row label="阶段" value={LIFE_STAGE_LABELS[current.lifeStage]} />
        <Row
          label="中心位置"
          value={`${current.centerLng.toFixed(2)}°E, ${current.centerLat.toFixed(2)}°N`}
        />
        <Row label="中心气压" value={`${current.pressure} hPa`} />
        <Row label="最大风速" value={`${current.maxWindSpeed} m/s`} />
        <Row label="移动方向" value={`${current.movingDirection.toFixed(1)}°`} />
        <Row label="移动速度" value={`${current.movingSpeed.toFixed(1)} km/h`} />
      </div>

      <div className="mt-3 pt-3 border-t border-gray-700/50 space-y-1">
        {current.windCircles.map((wc) => (
          <div key={wc.level} className="flex items-center gap-2 text-xs">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: getWindLevelColor(wc.level) }}
            />
            <span className="text-gray-400">
              {wc.level}级风圈
            </span>
            <span className="text-gray-300 ml-auto">
              NE:{wc.ne} NW:{wc.nw} SE:{wc.se} SW:{wc.sw} km
            </span>
          </div>
        ))}
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
