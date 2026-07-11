import { create } from 'zustand';
import { WindLevel } from '../types/typhoon';
import { AlertMessage } from '../types/region';

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
  showCoastline: boolean;
  detailPanelOpen: boolean;

  alerts: AlertMessage[];
  monitoredRegions: string[];

  setSelectedWindLevel: (level: WindLevel | null) => void;
  setHoveredPoint: (point: HoveredPoint | null) => void;
  toggleParticles: () => void;
  toggleCloudBands: () => void;
  toggleWindCircles: () => void;
  toggleWindField: () => void;
  togglePath: () => void;
  togglePrediction: () => void;
  toggleCoastline: () => void;
  setDetailPanelOpen: (open: boolean) => void;

  addAlert: (alert: AlertMessage) => void;
  dismissAlert: (id: string) => void;
  toggleRegionMonitor: (regionId: string) => void;
  isRegionMonitored: (regionId: string) => boolean;
}

export const useUIStore = create<UIStore>((set, get) => ({
  selectedWindLevel: null,
  hoveredPoint: null,
  showParticles: true,
  showCloudBands: true,
  showWindCircles: true,
  showWindField: false,
  showPath: true,
  showPrediction: true,
  showCoastline: true,
  detailPanelOpen: false,

  alerts: [],
  monitoredRegions: [],

  setSelectedWindLevel: (level) => set({ selectedWindLevel: level }),
  setHoveredPoint: (point) => set({ hoveredPoint: point }),
  toggleParticles: () => set((s) => ({ showParticles: !s.showParticles })),
  toggleCloudBands: () => set((s) => ({ showCloudBands: !s.showCloudBands })),
  toggleWindCircles: () => set((s) => ({ showWindCircles: !s.showWindCircles })),
  toggleWindField: () => set((s) => ({ showWindField: !s.showWindField })),
  togglePath: () => set((s) => ({ showPath: !s.showPath })),
  togglePrediction: () => set((s) => ({ showPrediction: !s.showPrediction })),
  toggleCoastline: () => set((s) => ({ showCoastline: !s.showCoastline })),
  setDetailPanelOpen: (open) => set({ detailPanelOpen: open }),

  addAlert: (alert) => {
    const { alerts } = get();
    const exists = alerts.some(
      (a) => a.regionName === alert.regionName && a.level === alert.level && a.typhoonName === alert.typhoonName,
    );
    if (exists) return;
    const next = [...alerts, alert];
    if (next.length > 20) next.shift();
    set({ alerts: next });
  },

  dismissAlert: (id) => set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) })),

  toggleRegionMonitor: (regionId) => {
    const { monitoredRegions } = get();
    set({
      monitoredRegions: monitoredRegions.includes(regionId)
        ? monitoredRegions.filter((id) => id !== regionId)
        : [...monitoredRegions, regionId],
    });
  },

  isRegionMonitored: (regionId) => get().monitoredRegions.includes(regionId),
}));
