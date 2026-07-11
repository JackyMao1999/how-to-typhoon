import React from 'react';
import { useTyphoonStore } from '../../store/typhoonStore';
import { LIFE_STAGE_LABELS } from '../../types/typhoon';
import { parseHistoricalCsv, parseHistoricalJson } from '../../data/historical/convert';

const stageColor: Record<string, string> = {
  forming: 'text-yellow-400',
  developing: 'text-typhoon-lv7',
  mature: 'text-red-400',
  decaying: 'text-orange-400',
  dissipated: 'text-gray-400',
};

export function HistoryPanel() {
  const sessions = useTyphoonStore((s) => s.typhoonSessions);
  const historicalTyphoons = useTyphoonStore((s) => s.historicalTyphoons);
  const loadSession = useTyphoonStore((s) => s.loadSession);
  const loadHistoricalTyphoon = useTyphoonStore((s) => s.loadHistoricalTyphoon);
  const importHistoricalTyphoon = useTyphoonStore((s) => s.importHistoricalTyphoon);
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError('');
    try {
      const text = await file.text();
      const lower = file.name.toLowerCase();
      const imported = lower.endsWith('.csv')
        ? parseHistoricalCsv(text, file.name.replace(/\.[^.]+$/, ''))
        : parseHistoricalJson(text);
      importHistoricalTyphoon(imported);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败');
    }
  };

  return (
    <div className="absolute bottom-32 md:bottom-24 right-3 md:right-4 z-10">
      <button id="history-btn"
        onClick={() => setOpen(!open)}
        className="glass-button rounded-xl px-3 py-2 text-xs font-semibold"
      >
        {open ? '收起历史' : '历史记录'}
      </button>

      {open && (
        <div id="history-list" className="absolute bottom-full right-0 mb-2 panel p-3 min-w-[300px] max-h-[460px] overflow-y-auto font-mono space-y-3">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="panel-title">历史大台风</span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] text-typhoon-lv7 hover:text-white transition-colors"
              >
                导入 JSON/CSV
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv,application/json,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
                e.currentTarget.value = '';
              }}
            />
            {error && <div className="mb-2 rounded border border-red-500/30 bg-red-950/20 p-2 text-[10px] text-red-300">{error}</div>}
            <div className="space-y-1">
              {historicalTyphoons.map((s) => {
                const maxWind = Math.max(...s.points.map((p) => p.maxWindSpeed));
                return (
                  <button key={s.id} id={`historical-item-${s.id}`}
                    onClick={() => { loadHistoricalTyphoon(s.id); setOpen(false); }}
                    className="w-full text-left p-2 rounded hover:bg-dark-surface-light/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-200 font-bold">{s.name}</span>
                      <span className="text-[10px] text-gray-500">{s.year}</span>
                      <span className="text-[10px] ml-auto text-typhoon-lv12">{maxWind.toFixed(1)} m/s</span>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      {s.source} · {s.points.length} 个路径点{s.description ? ` · ${s.description}` : ''}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-gray-700/30 pt-3">
            <div className="panel-title mb-2">仿真会话</div>
            {sessions.length === 0 && (
              <div className="p-2 text-xs text-gray-500">暂无仿真历史记录</div>
            )}
          {sessions.map((s, i) => (
            <button key={i} id={`history-item-${i}`}
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
        </div>
      )}
    </div>
  );
}
