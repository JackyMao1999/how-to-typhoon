import React, { useEffect, useState } from 'react';
import { GaodeProvider } from './map/GaodeProvider';
import { RendererOverlay } from './renderer/RendererOverlay';
import { Dashboard } from './components/Dashboard';
import { Timeline } from './components/Timeline';
import { ControlPanel } from './components/ControlPanel';
import { WindDetail } from './components/WindDetail';
import { HistoryPanel } from './components/HistoryPanel';
import { StatusBar } from './components/StatusBar';
import { MapTokenDialog } from './components/MapTokenDialog';
import { useTyphoonStore, useDisplayState } from './store/typhoonStore';
import { useUIStore } from './store/uiStore';
import { useTyphoonSimulation } from './hooks/useTyphoonSimulation';
import { useMapClick } from './hooks/useMapClick';
import { SeaTempTooltip } from './components/SeaTempTooltip';
import { updateWindCircleLayers, setWindCirclesVisible } from './map/layers/windCircleLayer';
import { updatePathLayer, updatePredictionLayer, setPathVisible, setPredictionVisible } from './map/layers/pathLayer';
import { updateWarningLayers, setWarningVisible } from './map/layers/warningLayer';
import { useMap } from './map/GaodeProvider';
import { getAmapKey } from './utils/token';
import { predictPath } from './engine';
import { wgs84ToGcj02Batch } from './utils/coord';

function MapLayers() {
  const { map, isLoaded } = useMap();
  const displayState = useDisplayState();
  const fullHistory = useTyphoonStore((s) => s.fullHistory);
  const engineConfig = useTyphoonStore((s) => s.engineConfig);
  const showWindCircles = useUIStore((s) => s.showWindCircles);
  const showPath = useUIStore((s) => s.showPath);
  const showPrediction = useUIStore((s) => s.showPrediction);

  useEffect(() => {
    if (!map || !isLoaded) return;
    updateWindCircleLayers(map, displayState);
  }, [map, isLoaded, displayState]);

  useEffect(() => {
    if (!map || !isLoaded || fullHistory.length < 2) return;
    const coords = fullHistory.map((p) => [p.centerLng, p.centerLat] as [number, number]);
    updatePathLayer(map, wgs84ToGcj02Batch(coords));
  }, [map, isLoaded, fullHistory]);

  useEffect(() => {
    if (!map || !isLoaded) return;
    const predCoords = predictPath(displayState, engineConfig, 12);
    updatePredictionLayer(map, wgs84ToGcj02Batch(predCoords));
  }, [map, isLoaded, displayState, engineConfig]);

  useEffect(() => { setWindCirclesVisible(showWindCircles); }, [showWindCircles]);
  useEffect(() => { setPathVisible(showPath); }, [showPath]);
  useEffect(() => { setPredictionVisible(showPrediction); }, [showPrediction]);
  useEffect(() => { setWarningVisible(true); }, []);

  useEffect(() => {
    if (!map || !isLoaded) return;
    updateWarningLayers(map, displayState);
  }, [map, isLoaded, displayState]);

  return null;
}

function SimulationInit() {
  const init = useTyphoonStore((s) => s.init);
  useEffect(() => { init(); }, [init]);
  return null;
}

function MapApp() {
  useTyphoonSimulation();
  const sst = useMapClick();

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
    </>
  );
}

export default function App() {
  const [hasKey, setHasKey] = useState(() => !!getAmapKey());

  if (!hasKey) {
    return (
      <MapTokenDialog onTokenSaved={() => {
        setHasKey(true);
        window.location.reload();
      }} />
    );
  }

  return (
    <div className="w-full h-full relative overflow-hidden bg-dark-bg">
      <GaodeProvider>
        <MapApp />
      </GaodeProvider>
    </div>
  );
}
