import React from 'react';
import { useTyphoonStore } from '../../store/typhoonStore';
import { LIFE_STAGE_LABELS } from '../../types/typhoon';
import { getLevelName } from '../../engine';

export function StatusBar() {
  const isRunning = useTyphoonStore((s) => s.isRunning);
  const isFinished = useTyphoonStore((s) => s.isFinished);
  const replayIndex = useTyphoonStore((s) => s.replayIndex);
  const replayPlaying = useTyphoonStore((s) => s.replayPlaying);
  const current = useTyphoonStore((s) => s.current);
  const fullHistory = useTyphoonStore((s) => s.fullHistory);

  const isReplay = replayIndex >= 0;
  const mode = isReplay ? (replayPlaying ? '回放中' : '已暂停') : isRunning ? '仿真中' : isFinished ? '已结束' : '已暂停';

  const modeColor = isReplay ? 'bg-blue-600/25 text-blue-300 border-blue-500/40'
    : isRunning ? 'bg-red-600/25 text-red-300 border-red-500/40'
    : 'bg-gray-600/25 text-gray-300 border-gray-500/40';

  return (
    <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
      <div className="flex items-center min-h-[48px] px-3 md:px-5 bg-dark-bg/72 backdrop-blur-md border-b border-cyan-300/10 shadow-lg shadow-black/20">
        <div className="flex min-w-0 items-center gap-2 md:gap-4 pointer-events-auto">
          <span id="status-mode" className={`badge ${modeColor}`}>{mode}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span id="status-name" className="truncate text-[14px] md:text-[15px] font-bold text-gray-100">{current.name}</span>
              <span id="status-id" className="hidden sm:inline text-[12px] text-gray-500">{current.id}</span>
            </div>
            <div className="md:hidden text-[10px] text-gray-500 leading-tight">
              {getLevelName(current.maxWindSpeed)} · {LIFE_STAGE_LABELS[current.lifeStage]}
            </div>
          </div>
          <span id="status-stage" className="hidden md:inline text-[12px] text-gray-300">{LIFE_STAGE_LABELS[current.lifeStage]}</span>
          {isReplay && (
            <span id="status-replay-step" className="hidden sm:inline text-[12px] text-gray-400 ml-1">
              第 {replayIndex + 1}/{fullHistory.length} 步
            </span>
          )}
        </div>

        <div className="mx-auto" />

        <div className="flex items-center gap-2 md:gap-4 pointer-events-auto">
          <span className="hidden lg:inline text-[12px] text-cyan-200/80">
            {getLevelName(current.maxWindSpeed)}
          </span>
          <span id="status-coords" className="hidden md:inline text-[12px] text-gray-400">
            {current.centerLng.toFixed(1)}°E / {current.centerLat.toFixed(1)}°N
          </span>
          <div id="status-summary" className="grid grid-cols-2 md:flex md:items-center md:gap-3 text-right md:text-left text-[11px] md:text-[12px]">
            <span className="text-gray-500">风速 <b className="text-gray-100 font-semibold">{current.maxWindSpeed}</b> m/s</span>
            <span className="hidden sm:inline text-gray-500">气压 <b className="text-gray-100 font-semibold">{current.pressure}</b> hPa</span>
          </div>
        </div>
      </div>
    </div>
  );
}
