import React, { useEffect, useState, useCallback } from 'react';
import { MapProvider, useMap } from './map/MapProvider';
import { RendererOverlay } from './renderer/RendererOverlay';
import { Dashboard } from './components/Dashboard';
import { Timeline } from './components/Timeline';
import { ControlPanel } from './components/ControlPanel';
import { WindDetail } from './components/WindDetail';
import { HistoryPanel } from './components/HistoryPanel';
import { StatusBar } from './components/StatusBar';
import { useTyphoonStore, useDisplayState } from './store/typhoonStore';
import { useUIStore } from './store/uiStore';
import { useTyphoonSimulation } from './hooks/useTyphoonSimulation';
import { useMapClick } from './hooks/useMapClick';
import { SeaTempTooltip } from './components/SeaTempTooltip';
import { AlertToastContainer } from './components/AlertToast';
import { updateWindCircleLayers, setWindCirclesVisible } from './map/layers/windCircleLayer';
import { updatePathLayer, updatePredictionLayer, setPathVisible, setPredictionVisible } from './map/layers/pathLayer';
import { updateRegionLayers } from './map/layers/regionLayer';
import { updateCoastlineLayer, setCoastlineVisible } from './map/layers/coastlineLayer';
import { predictPath } from './engine';
import { getLevelHexColor, getTyphoonLevel } from './engine';
import { haversineDistance } from './utils/geo';

/* 路径悬停 tooltip */
function PathTooltip({ info }: { info: { x: number; y: number; text: string; color: string; time: string } | null }) {
  if (!info) return null;
  return (
    <div className="fixed z-[810] pointer-events-none font-mono" style={{ left: info.x + 12, top: info.y - 12 }}>
      <div className="bg-dark-bg/85 backdrop-blur border border-gray-600/60 rounded px-2 py-1 text-[10px]">
        <div className="text-gray-400">{info.time}</div>
        <div style={{ color: info.color }} className="font-bold">{info.text}</div>
      </div>
    </div>
  );
}

function MapLayers() {
  const { map, isLoaded } = useMap();
  const displayState = useDisplayState();
  const fullHistory = useTyphoonStore((s) => s.fullHistory);
  const engineConfig = useTyphoonStore((s) => s.engineConfig);
  const showWindCircles = useUIStore((s) => s.showWindCircles);
  const showPath = useUIStore((s) => s.showPath);
  const showPrediction = useUIStore((s) => s.showPrediction);
  const showCoastline = useUIStore((s) => s.showCoastline);
  const replayIndex = useTyphoonStore((s) => s.replayIndex);
  const [hoveredNode, setHoveredNode] = useState<{ x: number; y: number; text: string; color: string; time: string } | null>(null);
  const monitoredRegions = useUIStore((s) => s.monitoredRegions);

  const predCoords = fullHistory.length > 1 ? predictPath(displayState, engineConfig, 48) : [];

  useEffect(() => {
    if (!map || !isLoaded) return;
    updateWindCircleLayers(map, displayState);
  }, [map, isLoaded, displayState, replayIndex]);

  useEffect(() => {
    if (!map || !isLoaded || fullHistory.length < 2) return;
    const coords = fullHistory.map((p) => [p.centerLng, p.centerLat] as [number, number]);
    updatePathLayer(map, coords);
  }, [map, isLoaded, fullHistory]);

  useEffect(() => {
    if (!map || !isLoaded || predCoords.length < 2) return;
    updatePredictionLayer(map, predCoords.slice(0, 13));
  }, [map, isLoaded, predCoords, displayState]);

  useEffect(() => { setWindCirclesVisible(showWindCircles); }, [showWindCircles]);
  useEffect(() => { setPathVisible(showPath); }, [showPath]);
  useEffect(() => { setPredictionVisible(showPrediction); }, [showPrediction]);
  useEffect(() => { setCoastlineVisible(showCoastline); }, [showCoastline]);

  useEffect(() => {
    if (!map || !isLoaded || !showCoastline) return;
    const handler = () => updateCoastlineLayer(map);
    map.on('moveend', handler);
    map.on('zoomend', handler);
    updateCoastlineLayer(map);
    return () => {
      map.off('moveend', handler);
      map.off('zoomend', handler);
    };
  }, [map, isLoaded, showCoastline]);

  useEffect(() => {
    if (!map || !isLoaded) return;
    updateRegionLayers(map, monitoredRegions);
  }, [map, isLoaded, monitoredRegions]);

  useEffect(() => {
    if (!map || !isLoaded || fullHistory.length < 2) return;

    let throttle = 0;
    const handler = (e: any) => {
      const now = Date.now();
      if (now - throttle < 80) return;
      throttle = now;

      const lnglat = e.lnglat;
      if (!lnglat) { setHoveredNode(null); return; }

      let closest: number | null = null;
      let minDist = Infinity;
      for (let i = 0; i < fullHistory.length; i++) {
        const d = haversineDistance(lnglat.getLng(), lnglat.getLat(), fullHistory[i].centerLng, fullHistory[i].centerLat);
        if (d < minDist) { minDist = d; closest = i; }
      }

      if (closest !== null && minDist < 80) {
        const entry = fullHistory[closest];
        const level = getTyphoonLevel(entry.maxWindSpeed);
        const color = getLevelHexColor(entry.maxWindSpeed);
        const d = new Date(entry.timestamp);
        const time = d.toISOString().slice(0, 13).replace('T', ' ') + ':00';
        const stage = ['热带低压', '热带风暴', '强热带风暴', '台风', '强台风', '超强台风'][
          ['td', 'ts', 'sts', 'ty', 'sty', 'sTY'].indexOf(level)
        ];
        setHoveredNode({
          x: e.originalEvent?.clientX ?? 0,
          y: e.originalEvent?.clientY ?? 0,
          text: stage,
          color,
          time,
        });
      } else {
        setHoveredNode(null);
      }
    };

    map.on('mousemove', handler);
    return () => { map.off('mousemove', handler); };
  }, [map, isLoaded, fullHistory]);

  return <PathTooltip info={hoveredNode} />;
}

function SimulationInit() {
  const init = useTyphoonStore((s) => s.init);
  useEffect(() => { init(); }, [init]);
  return null;
}

function MapApp() {
  useTyphoonSimulation();
  const sst = useMapClick();
  const alerts = useUIStore((s) => s.alerts);
  const dismissAlert = useUIStore((s) => s.dismissAlert);

  return (
    <>
      <SimulationInit />
      <StatusBar />
      <HistoryPanel />
      <MapLayers />
      <RendererOverlay />
      <Dashboard />
      <ControlPanel />
      <Timeline />
      <WindDetail />
      <SeaTempTooltip sst={sst} />
      <AlertToastContainer alerts={alerts} onDismiss={dismissAlert} />
    </>
  );
}

export default function App() {
  return (
    <div className="w-full h-full relative overflow-hidden bg-dark-bg">
      <MapProvider>
        <MapApp />
      </MapProvider>
    </div>
  );
}
