import React from 'react';
import { useTyphoonStore } from '../../store/typhoonStore';
import { LIFE_STAGE_LABELS } from '../../types/typhoon';

const stageColor: Record<string, string> = {
  forming: 'text-yellow-400',
  developing: 'text-typhoon-lv7',
  mature: 'text-red-400',
  decaying: 'text-orange-400',
  dissipated: 'text-gray-400',
};

export function HistoryPanel() {
  const sessions = useTyphoonStore((s) => s.typhoonSessions);
  const loadSession = useTyphoonStore((s) => s.loadSession);
  const [open, setOpen] = React.useState(false);

  return (
    <div className="absolute bottom-24 left-4 z-10">
      <button
        onClick={() => setOpen(!open)}
        className="bg-dark-surface/90 backdrop-blur-md border border-gray-700/50 rounded-lg px-2.5 py-2 text-xs text-gray-300 hover:text-white transition-colors"
      >
        {open ? '▼ 历史' : '📋 历史'}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-1.5 bg-dark-surface/95 backdrop-blur-md border border-gray-700/50 rounded-lg p-2 min-w-[210px] max-h-[360px] overflow-y-auto font-mono space-y-1 shadow-xl">
          {sessions.length === 0 && (
            <div className="p-2 text-xs text-gray-500">暂无历史记录</div>
          )}
          {sessions.map((s, i) => (
            <button
              key={i}
              onClick={() => { loadSession(i); setOpen(false); }}
              className="w-full text-left p-2 rounded hover:bg-dark-surface-light/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-300 font-bold">{s.name}</span>
                <span className="text-[10px] text-gray-500">{s.id}</span>
                <span className={`text-[10px] ml-auto ${stageColor[s.finalLifeStage] ?? 'text-gray-500'}`}>
                  {LIFE_STAGE_LABELS[s.finalLifeStage]}
                </span>
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">
                {s.fullHistory[0].centerLng.toFixed(1)}°E, {s.fullHistory[0].centerLat.toFixed(1)}°N  — {s.totalSteps} 步
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
