import React from 'react';
import { useTyphoonStore } from '../../store/typhoonStore';
import { LIFE_STAGE_LABELS } from '../../types/typhoon';

export function StatusBar() {
  const isRunning = useTyphoonStore((s) => s.isRunning);
  const isFinished = useTyphoonStore((s) => s.isFinished);
  const replayIndex = useTyphoonStore((s) => s.replayIndex);
  const replayPlaying = useTyphoonStore((s) => s.replayPlaying);
  const current = useTyphoonStore((s) => s.current);
  const fullHistory = useTyphoonStore((s) => s.fullHistory);

  const isReplay = replayIndex >= 0;
  const mode = isReplay ? (replayPlaying ? '回放中' : '已暂停') : isRunning ? '仿真中' : isFinished ? '已结束' : '已暂停';

  const modeColor = isReplay ? 'bg-blue-600/30 text-blue-200 border-blue-500/40'
    : isRunning ? 'bg-red-600/30 text-red-200 border-red-500/40'
    : 'bg-gray-600/30 text-gray-200 border-gray-500/40';

  return (
    <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
      <div className="flex items-center justify-center gap-4 px-4 py-1.5 bg-dark-bg/60 backdrop-blur-sm border-b border-gray-800/50">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border pointer-events-auto ${modeColor}`}>
          {mode}
        </span>

        <span className="text-[11px] text-gray-100 font-bold pointer-events-auto">
          {current.name}
        </span>

        <span className="text-[10px] text-gray-400 pointer-events-auto">
          {current.id}
        </span>

        <span className="text-[10px] text-gray-300 pointer-events-auto">
          {LIFE_STAGE_LABELS[current.lifeStage]}
        </span>

        {isReplay && (
          <span className="text-[10px] text-gray-400 pointer-events-auto">
            {replayIndex + 1} / {fullHistory.length}
          </span>
        )}

        <span className="text-[10px] text-gray-400 pointer-events-auto">
          {current.centerLng.toFixed(1)}°E {current.centerLat.toFixed(1)}°N
        </span>
      </div>
    </div>
  );
}
