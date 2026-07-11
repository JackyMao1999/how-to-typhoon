import React from 'react';
import { useDisplayState } from '../../store/typhoonStore';
import { getWindLevelColor, WindLevel, LIFE_STAGE_LABELS } from '../../types/typhoon';
import { getLevelHexColor, getLevelName, getWindForce } from '../../engine';

export function Dashboard() {
  const current = useDisplayState();
  const levelColor = getLevelHexColor(current.maxWindSpeed);
  const windForce = getWindForce(current.maxWindSpeed);

  const stageBadge: Record<string, string> = {
    forming: 'bg-green-500/15 text-green-400 border-green-500/25',
    developing: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
    mature: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
    decaying: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
    dissipated: 'bg-gray-500/15 text-gray-400 border-gray-500/25',
  };

  return (
    <div id="info-panel" className="absolute top-16 left-3 right-3 md:right-auto md:left-4 z-10 panel p-4 md:p-5 md:min-w-[320px] md:max-w-[340px] font-mono">
      <div className="flex items-start gap-3 mb-4">
        <div className="min-w-0">
          <div className="panel-title mb-1">Typhoon Monitor</div>
          <div className="flex items-baseline gap-2">
            <span id="info-name" className="truncate text-2xl font-bold text-white font-sans tracking-wide">
              {current.name}
            </span>
            <span id="info-id" className="text-xs text-gray-500">{current.id}</span>
          </div>
        </div>
        <span id="info-stage" className={`badge ${stageBadge[current.lifeStage] ?? 'bg-gray-500/15 text-gray-400 border-gray-500/25'} ml-auto`}>
          {LIFE_STAGE_LABELS[current.lifeStage]}
        </span>
      </div>

      <div className="metric-card mb-3" style={{ borderColor: `${levelColor}44`, boxShadow: `inset 3px 0 0 ${levelColor}` }}>
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-xs text-gray-500 mb-1">当前强度</div>
            <div className="text-lg font-bold" style={{ color: levelColor }}>{getLevelName(current.maxWindSpeed)}</div>
          </div>
          <div className="text-right">
            <div id="info-windspeed" className="text-3xl font-bold text-white leading-none">{current.maxWindSpeed}</div>
            <div className="text-[11px] text-gray-500 mt-1">m/s · {windForce}级风</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <Metric id="info-pressure" label="中心气压" value={`${current.pressure}`} unit="hPa" />
        <Metric id="info-speed" label="移动速度" value={current.movingSpeed.toFixed(1)} unit="km/h" />
        <Metric id="info-direction" label="移动方向" value={current.movingDirection.toFixed(0)} unit="°" />
        <Metric id="info-position" label="中心位置" value={`${current.centerLng.toFixed(1)} / ${current.centerLat.toFixed(1)}`} unit="°" />
      </div>

      <div className="pt-3 border-t border-gray-700/30">
        <div className="flex items-center justify-between mb-2">
          <div className="panel-title">Wind Radius</div>
          <span className="text-[10px] text-gray-500">NE / NW / SE / SW</span>
        </div>
        <div className="space-y-2">
          {current.windCircles.length === 0 && (
            <div className="rounded-lg border border-gray-700/30 bg-dark-bg/40 p-3 text-xs text-gray-500">
              当前强度尚未达到有效风圈阈值
            </div>
          )}
          {current.windCircles.map((wc) => (
            <div key={wc.level} id={`info-windcircle-${wc.level}`} className="rounded-lg border border-gray-700/30 bg-dark-bg/35 p-2.5 text-xs">
              <div className="mb-1.5 flex items-center gap-2">
                <div className="wind-bar h-4" style={{ backgroundColor: getWindLevelColor(wc.level) }} />
                <span className="font-bold text-gray-200">{wc.level}级风圈</span>
              </div>
              <div className="grid grid-cols-4 gap-1 text-center text-[11px] text-gray-400">
                <span>NE <b className="text-gray-200">{wc.ne}</b></span>
                <span>NW <b className="text-gray-200">{wc.nw}</b></span>
                <span>SE <b className="text-gray-200">{wc.se}</b></span>
                <span>SW <b className="text-gray-200">{wc.sw}</b></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Metric({ id, label, value, unit }: { id: string; label: string; value: string; unit: string }) {
  return (
    <div id={id} className="metric-card">
      <div className="text-[11px] text-gray-500 mb-1">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold text-gray-100">{value}</span>
        <span className="text-[10px] text-gray-500">{unit}</span>
      </div>
    </div>
  );
}
