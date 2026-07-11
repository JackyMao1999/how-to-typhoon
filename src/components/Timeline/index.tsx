import React, { useRef, useEffect } from 'react';
import { useTyphoonStore } from '../../store/typhoonStore';
import { useMap } from '../../map/MapProvider';

export function Timeline() {
  const isRunning = useTyphoonStore((s) => s.isRunning);
  const speed = useTyphoonStore((s) => s.speed);
  const history = useTyphoonStore((s) => s.history);
  const fullHistory = useTyphoonStore((s) => s.fullHistory);
  const replayIndex = useTyphoonStore((s) => s.replayIndex);
  const replayPlaying = useTyphoonStore((s) => s.replayPlaying);
  const start = useTyphoonStore((s) => s.start);
  const pause = useTyphoonStore((s) => s.pause);
  const setSpeed = useTyphoonStore((s) => s.setSpeed);
  const reset = useTyphoonStore((s) => s.reset);
  const setReplayIndex = useTyphoonStore((s) => s.setReplayIndex);
  const toggleReplay = useTyphoonStore((s) => s.toggleReplay);
  const nextReplayStep = useTyphoonStore((s) => s.nextReplayStep);

  const replayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasHistory = fullHistory.length > 1;
  const isReplay = replayIndex >= 0;
  const tabIndex = Math.max(0, hasHistory ? replayIndex : 0);
  const maxTab = hasHistory ? fullHistory.length - 1 : 0;

  useEffect(() => {
    if (replayPlaying && hasHistory) {
      const ms = Math.max(50, 200 / speed);
      replayTimerRef.current = setInterval(() => nextReplayStep(), ms);
    }
    return () => { if (replayTimerRef.current) clearInterval(replayTimerRef.current); };
  }, [replayPlaying, hasHistory, speed, nextReplayStep]);

  const { flyTo } = useMap();
  useEffect(() => {
    if (!hasHistory || replayIndex < 0) return;
    const entry = fullHistory[replayIndex];
    if (entry) {
      flyTo(entry.centerLng, entry.centerLat, 5);
    }
  }, [replayIndex, hasHistory, fullHistory, flyTo]);

  const handlePlayClick = () => {
    if (hasHistory) toggleReplay();
    else if (isRunning) pause();
    else start();
  };

  const currentTime = hasHistory && fullHistory[tabIndex]
    ? new Date(fullHistory[tabIndex].timestamp).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    : `${history.length} 步`;

  return (
    <div id="timeline" className="absolute bottom-3 left-3 right-3 md:bottom-5 md:left-1/2 md:right-auto md:-translate-x-1/2 z-[804]">
      <div className="panel px-3 py-3 md:px-5 flex flex-col md:flex-row md:items-center gap-3 md:gap-5 font-mono">
        <div className="flex items-center gap-3">
        <button id="timeline-reset" onClick={reset}
          className="glass-button h-10 w-10 rounded-full text-xs font-bold" title="重置">
          R
        </button>

        <button id="timeline-play" onClick={handlePlayClick}
          className="h-11 w-11 flex items-center justify-center rounded-full bg-cyan-400/20 hover:bg-cyan-400/35 text-white border border-cyan-300/25 transition-colors text-sm font-bold"
          title={replayPlaying ? '暂停回放' : isRunning ? '暂停' : hasHistory ? '回放' : '播放'}>
          {replayPlaying || isRunning ? 'II' : '▶'}
        </button>

        <div className="min-w-0 flex-1 md:w-56">
          <div className="mb-1 flex items-center justify-between text-[10px] text-gray-500">
            <span>进度</span>
            <span id="timeline-step-info">{hasHistory ? `${replayIndex + 1} / ${fullHistory.length}` : currentTime}</span>
          </div>
          <input id="timeline-progress" type="range" min={0} max={maxTab} step={1} value={tabIndex}
            onChange={(e) => setReplayIndex(parseInt(e.target.value))}
            className={`w-full h-1.5 accent-typhoon-lv7 rounded-full ${hasHistory ? '' : 'opacity-30 pointer-events-none'}`} />
          <div className="mt-1 text-[10px] text-gray-500">{currentTime}</div>
        </div>
        </div>

        <div className="hidden md:block h-6 w-px bg-gray-700/30" />

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span id="timeline-speed-label">倍速</span>
          <input id="timeline-speed-slider" type="range" min={0.1} max={5} step={0.1} value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="flex-1 md:w-16 h-1.5 accent-typhoon-lv7 rounded-full" />
          <span id="timeline-speed-value" className="text-gray-200 w-8 text-right font-medium">{speed.toFixed(1)}x</span>
        </div>
      </div>
    </div>
  );
}
