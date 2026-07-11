import React, { useEffect, useRef } from 'react';
import { AlertMessage, ALERT_LEVEL_COLORS, getAlertLevel } from '../../types/region';

function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);

    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(660, ctx.currentTime);
      gain2.gain.setValueAtTime(0.12, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime);
      osc2.stop(ctx.currentTime + 0.3);
    }, 300);
  } catch {
    /* audio not available */
  }
}

export function AlertToast({ alert, onDismiss }: { alert: AlertMessage; onDismiss: () => void }) {
  const color = ALERT_LEVEL_COLORS[alert.level];
  const levelInfo = getAlertLevel(alert.distance);
  const hasPlayed = useRef(false);
  const animationClass = alert.message ? 'animate-flash' : 'animate-slide-up';

  useEffect(() => {
    if (!hasPlayed.current) {
      hasPlayed.current = true;
      playBeep();
    }
  }, [alert.id]);

  return (
    <div
      className={`panel p-3 min-w-[280px] max-w-[360px] font-mono cursor-pointer ${animationClass}`}
      style={{ borderLeft: `4px solid ${color}` }}
      onClick={onDismiss}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold" style={{ color }}>
          {alert.message ? '⛔ 环境提示' : '⚠ 台风预警'}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
          className="text-gray-500 hover:text-white text-[10px]"
        >
          关闭
        </button>
      </div>
      <div className="text-sm font-bold text-gray-100 mb-1">
        {alert.message
          ? alert.regionName
          : `${alert.typhoonName} 正在接近 ${alert.regionName}`}
      </div>
      <div className="text-[11px] text-gray-400 space-y-0.5">
        {alert.message ? (
          <pre className="text-[11px] text-gray-400 font-mono leading-relaxed whitespace-pre-wrap">{alert.message}</pre>
        ) : (
          <>
            <span>距区域边界: <b className="text-gray-200">{alert.distance} km</b></span>
            {levelInfo && <span className="ml-2" style={{ color }}>{levelInfo.label}</span>}
          </>
        )}
      </div>
    </div>
  );
}

export function AlertToastContainer({ alerts, onDismiss }: { alerts: AlertMessage[]; onDismiss: (id: string) => void }) {
  if (alerts.length === 0) return null;
  const latest = alerts[alerts.length - 1];
  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 space-y-2" style={{ pointerEvents: 'auto' }}>
      <div key={latest.id}>
        <AlertToast alert={latest} onDismiss={() => onDismiss(latest.id)} />
      </div>
    </div>
  );
}
