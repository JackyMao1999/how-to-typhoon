import { TyphoonStatus, TrackPoint } from '../types/typhoon';
import { TyphoonEngine } from './TyphoonEngine';

export interface SimulationState {
  current: TyphoonStatus;
  history: TrackPoint[];
  isRunning: boolean;
  isFinished: boolean;
  speed: number;
}

export class TyphoonSimulation {
  private engine: TyphoonEngine;
  private state: SimulationState;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(engine: TyphoonEngine, initialState: TyphoonStatus) {
    this.engine = engine;
    this.state = {
      current: initialState,
      history: [],
      isRunning: false,
      isFinished: false,
      speed: 1,
    };
  }

  start(): void {
    if (this.state.isRunning || this.state.isFinished) return;
    this.state.isRunning = true;
    this.tick();
  }

  pause(): void {
    this.state.isRunning = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  reset(initialState: TyphoonStatus): void {
    this.pause();
    this.state.current = initialState;
    this.state.history = [];
    this.state.isFinished = false;
  }

  setSpeed(speed: number): void {
    this.state.speed = Math.max(0.1, Math.min(10, speed));
    if (this.state.isRunning) {
      this.pause();
      this.start();
    }
  }

  private tick(): void {
    const intervalMs = 1000 / this.state.speed;
    this.intervalId = setInterval(() => {
      if (!this.state.isRunning || this.state.isFinished) return;

      const { next, trackPoint, isOver } = this.engine.step(this.state.current);

      if (trackPoint) {
        this.state.history.push(trackPoint);
      }
      this.state.current = next;

      if (isOver) {
        this.state.isFinished = true;
        this.state.isRunning = false;
        this.pause();
      }
    }, intervalMs);
  }

  getState(): SimulationState {
    return { ...this.state, history: [...this.state.history] };
  }

  getCurrent(): TyphoonStatus {
    return { ...this.state.current };
  }

  getHistory(): TrackPoint[] {
    return [...this.state.history];
  }

  modifyTyphoon(partial: Partial<TyphoonStatus>): void {
    this.state.current = { ...this.state.current, ...partial };
  }

  destroy(): void {
    this.pause();
  }
}
