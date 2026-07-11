import { useEffect, useRef, useCallback } from 'react';
import { useTyphoonStore } from '../store/typhoonStore';

export function useTyphoonSimulation() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishedRef = useRef(false);

  const tick = useTyphoonStore((s) => s.tick);
  const isRunning = useTyphoonStore((s) => s.isRunning);
  const isFinished = useTyphoonStore((s) => s.isFinished);
  const autoSpawn = useTyphoonStore((s) => s.autoSpawn);
  const speed = useTyphoonStore((s) => s.speed);
  const spawnRandom = useTyphoonStore((s) => s.spawnRandom);
  const start = useTyphoonStore((s) => s.start);

  // 自动生成：检测台风结束
  useEffect(() => {
    if (isFinished && autoSpawn && !finishedRef.current) {
      finishedRef.current = true;
      setTimeout(() => {
        spawnRandom();
        start();
        finishedRef.current = false;
      }, 800);
    }
    if (!isFinished) {
      finishedRef.current = false;
    }
  }, [isFinished, autoSpawn, spawnRandom, start]);

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
