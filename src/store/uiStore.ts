import { create } from 'zustand';
import { WindLevel } from '../types/typhoon';

interface HoveredPoint {
  lng: number;
  lat: number;
  windSpeed: number;
  windLevel: WindLevel;
  distance: number;
}

interface UIStore {
  selectedWindLevel: WindLevel | null;
  hoveredPoint: HoveredPoint | null;
  showParticles: boolean;
  showCloudBands: boolean;
  showWindCircles: boolean;
  showWindField: boolean;
  showPath: boolean;
  showPrediction: boolean;
  detailPanelOpen: boolean;

  setSelectedWindLevel: (level: WindLevel | null) => void;
  setHoveredPoint: (point: HoveredPoint | null) => void;
  toggleParticles: () => void;
  toggleCloudBands: () => void;
  toggleWindCircles: () => void;
  toggleWindField: () => void;
  togglePath: () => void;
  togglePrediction: () => void;
  setDetailPanelOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  selectedWindLevel: null,
  hoveredPoint: null,
  showParticles: true,
  showCloudBands: true,
  showWindCircles: true,
  showWindField: false,
  showPath: true,
  showPrediction: true,
  detailPanelOpen: false,

  setSelectedWindLevel: (level) => set({ selectedWindLevel: level }),
  setHoveredPoint: (point) => set({ hoveredPoint: point }),
  toggleParticles: () => set((s) => ({ showParticles: !s.showParticles })),
  toggleCloudBands: () => set((s) => ({ showCloudBands: !s.showCloudBands })),
  toggleWindCircles: () => set((s) => ({ showWindCircles: !s.showWindCircles })),
  toggleWindField: () => set((s) => ({ showWindField: !s.showWindField })),
  togglePath: () => set((s) => ({ showPath: !s.showPath })),
  togglePrediction: () => set((s) => ({ showPrediction: !s.showPrediction })),
  setDetailPanelOpen: (open) => set({ detailPanelOpen: open }),
}));
