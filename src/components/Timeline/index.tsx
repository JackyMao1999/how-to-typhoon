import React, { useRef, useEffect } from 'react';
import { useTyphoonStore } from '../../store/typhoonStore';

export function Timeline() {
  const isRunning = useTyphoonStore((s) => s.isRunning);
  const isFinished = useTyphoonStore((s) => s.isFinished);
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
      replayTimerRef.current = setInterval(() => {
        nextReplayStep();
      }, ms);
    }
    return () => {
      if (replayTimerRef.current) clearInterval(replayTimerRef.current);
    };
  }, [replayPlaying, hasHistory, speed, nextReplayStep]);

  const handlePlayClick = () => {
    if (hasHistory) {
      toggleReplay();
    } else {
      if (isRunning) pause();
      else start();
    }
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-dark-surface/90 backdrop-blur-md border border-gray-700/50 rounded-lg px-6 py-3 flex items-center gap-4 font-mono">
      <button onClick={reset} className="text-gray-400 hover:text-white transition-colors text-sm" title="重置">⏮</button>

      <button onClick={handlePlayClick}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-typhoon-lv7/20 hover:bg-typhoon-lv7/40 text-white transition-colors text-lg"
        title={replayPlaying ? '暂停回放' : isRunning ? '暂停' : hasHistory ? '回放' : '播放'}>
        {replayPlaying ? '⏸' : isRunning ? '⏸' : '▶'}
      </button>

      <div className="flex items-center gap-3">
        <input type="range" min={0} max={maxTab} step={1} value={tabIndex}
          onChange={(e) => setReplayIndex(parseInt(e.target.value))}
          className={`w-40 h-1 accent-typhoon-lv7 ${hasHistory ? '' : 'opacity-30 pointer-events-none'}`} />
        <span className="text-xs text-gray-400 w-24">
          {hasHistory ? `${replayIndex + 1} / ${fullHistory.length}` : `步数 ${history.length}`}
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span>倍速</span>
        <input type="range" min={0.1} max={5} step={0.1} value={speed}
          onChange={(e) => setSpeed(parseFloat(e.target.value))}
          className="w-16 h-1 accent-typhoon-lv7" />
        <span className="text-gray-300 w-8">{speed.toFixed(1)}x</span>
      </div>
    </div>
  );
}
