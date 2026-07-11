import { useEffect, useRef, useCallback } from 'react';
import { useTyphoonStore } from '../store/typhoonStore';

export function useTyphoonSimulation() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tick = useTyphoonStore((s) => s.tick);
  const isRunning = useTyphoonStore((s) => s.isRunning);
  const speed = useTyphoonStore((s) => s.speed);

  const startLoop = useCallback(() => {
    if (intervalRef.current) return;
    const ms = Math.max(50, 1000 / speed);
    intervalRef.current = setInterval(() => {
      tick();
    }, ms);
  }, [tick, speed]);

  const stopLoop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isRunning) {
      startLoop();
    } else {
      stopLoop();
    }
    return stopLoop;
  }, [isRunning, startLoop, stopLoop]);

  return { startLoop, stopLoop };
}
