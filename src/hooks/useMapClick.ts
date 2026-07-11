import { useEffect, useCallback, useState } from 'react';
import { useMap } from '../map/GaodeProvider';
import { useUIStore } from '../store/uiStore';
import { useTyphoonStore, useDisplayState } from '../store/typhoonStore';
import { WindLevel } from '../types/typhoon';
import { haversineDistance } from '../utils/geo';
import { gcj02ToWgs84 } from '../utils/coord';
import { isOverLand } from '../engine/landmass';
import { computeSeaTemp } from '../engine';

export interface SSTDisplay {
  x: number;
  y: number;
  sst: number;
  lng: number;
  lat: number;
}

export function useMapClick() {
  const { map } = useMap();
  const setHoveredPoint = useUIStore((s) => s.setHoveredPoint);
  const setDetailPanelOpen = useUIStore((s) => s.setDetailPanelOpen);
  const displayState = useDisplayState();
  const spawnAt = useTyphoonStore((s) => s.spawnAt);
  const [sstDisplay, setSSTDisplay] = useState<SSTDisplay | null>(null);

  const handleClick = useCallback(
    (e: any) => {
      const lnglat = e.lnglat || e.lngLat;
      if (!lnglat) return;

      const gcjLng = lnglat.getLng();
      const gcjLat = lnglat.getLat();
      const [wgsLng, wgsLat] = gcj02ToWgs84(gcjLng, gcjLat);

      const dist = haversineDistance(displayState.centerLng, displayState.centerLat, wgsLng, wgsLat);

      const maxWindRadius = Math.max(
        ...displayState.windCircles.map((wc) => Math.max(wc.ne, wc.nw, wc.se, wc.sw))
      );

      if (dist <= maxWindRadius) {
        const activeCircle = displayState.windCircles.find(
          (wc) => dist <= Math.max(wc.ne, wc.nw, wc.se, wc.sw)
        );

        setHoveredPoint({
          lng: wgsLng,
          lat: wgsLat,
          windSpeed: displayState.maxWindSpeed * (1 - (dist / (activeCircle?.ne ?? 1)) * 0.5),
          windLevel: activeCircle?.level ?? WindLevel.LV7,
          distance: Math.round(dist),
        });
        setDetailPanelOpen(true);
      } else if (!isOverLand(wgsLng, wgsLat)) {
        spawnAt(wgsLng, wgsLat);
      }
    },
    [displayState, setHoveredPoint, setDetailPanelOpen, spawnAt]
  );

  const season = useTyphoonStore((s) => s.season);

  const handleMouseMove = useCallback(
    (e: any) => {
      const lnglat = e.lnglat;
      if (!lnglat) return;
      const lat = lnglat.getLat();
      const sst = computeSeaTemp(lat, season);
      setSSTDisplay({
        x: e.originalEvent?.clientX ?? 0,
        y: e.originalEvent?.clientY ?? 0,
        sst,
        lng: lnglat.getLng(),
        lat,
      });
    },
    [map, season]
  );

  useEffect(() => {
    if (!map) return;
    map.on('click', handleClick);
    map.on('mousemove', handleMouseMove);
    return () => {
      map.off('click', handleClick);
      map.off('mousemove', handleMouseMove);
    };
  }, [map, handleClick, handleMouseMove]);

  return sstDisplay;
}
