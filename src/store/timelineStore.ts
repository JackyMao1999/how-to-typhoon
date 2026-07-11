import { create } from 'zustand';

interface TimelineStore {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  speed: number;

  setStep: (step: number) => void;
  setTotalSteps: (total: number) => void;
  setPlaying: (playing: boolean) => void;
  setSpeed: (speed: number) => void;
  next: () => void;
  prev: () => void;
}

export const useTimelineStore = create<TimelineStore>((set, get) => ({
  currentStep: 0,
  totalSteps: 100,
  isPlaying: false,
  speed: 1,

  setStep: (step: number) => set({ currentStep: Math.max(0, Math.min(step, get().totalSteps)) }),
  setTotalSteps: (total: number) => set({ totalSteps: total }),
  setPlaying: (playing: boolean) => set({ isPlaying: playing }),
  setSpeed: (speed: number) => set({ speed: Math.max(0.1, Math.min(10, speed)) }),
  next: () => {
    const { currentStep, totalSteps } = get();
    if (currentStep < totalSteps) {
      set({ currentStep: currentStep + 1 });
    }
  },
  prev: () => {
    const { currentStep } = get();
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1 });
    }
  },
}));
