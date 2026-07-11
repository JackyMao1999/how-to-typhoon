import React, { createContext, useContext, useRef, useEffect, useState, useCallback, type ReactNode } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { OCEAN_LABELS, CITY_LABELS } from '../data/landmask/labels';
import { createGraticuleLayer } from './layers/gridLayer';

interface MapContextValue {
  map: any;
  mapContainer: React.RefObject<HTMLDivElement | null>;
  isLoaded: boolean;
  flyTo: (lng: number, lat: number, zoom?: number) => void;
}

const MapContext = createContext<MapContextValue | null>(null);

export function useMap(): MapContextValue {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error('useMap must be used within <MapProvider>');
  return ctx;
}

interface Props {
  children: ReactNode;
  initialCenter?: [number, number];
  initialZoom?: number;
}

export function MapProvider({
  children,
  initialCenter = [140, 18],
  initialZoom = 4,
}: Props) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const instance = L.map(mapContainer.current, {
      center: [initialCenter[1], initialCenter[0]],
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: false,
      zoomSnap: 0.5,
      wheelDebounceTime: 40,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(instance);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '',
    }).addTo(instance);

    createGraticuleLayer().addTo(instance);
    L.control.scale({ position: 'bottomleft', metric: true, imperial: false }).addTo(instance);

    OCEAN_LABELS.forEach((label) => {
      L.marker([label.lat, label.lng], {
        icon: L.divIcon({
          html: `<div style="font-size:${label.size}px;font-weight:700;color:rgba(56,189,248,0.35);letter-spacing:0.12em;white-space:nowrap;">${label.name}</div>`,
          className: '',
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        }),
        interactive: false,
      }).addTo(instance);
    });

    CITY_LABELS.forEach((label) => {
      L.marker([label.lat, label.lng], {
        icon: L.divIcon({
          html: `<div style="font-size:${label.size}px;font-weight:500;font-family:monospace;color:rgba(148,163,184,0.5);white-space:nowrap;text-shadow:0 0 8px rgba(2,6,23,0.9);">${label.name}</div>`,
          className: '',
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        }),
        interactive: false,
      }).addTo(instance);
    });

    mapRef.current = instance;
    setMap(instance);
    setIsLoaded(true);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const flyTo = useCallback(
    (lng: number, lat: number, zoom?: number) => {
      if (mapRef.current) {
        mapRef.current.setView([lat, lng], zoom ?? mapRef.current.getZoom(), { animate: true, duration: 1 });
      }
    },
    [],
  );

  return (
    <MapContext.Provider value={{ map, mapContainer, isLoaded, flyTo }}>
      <div style={{ position: 'absolute', inset: 0, background: '#07101a' }}>
        <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      </div>
      {isLoaded && children}
    </MapContext.Provider>
  );
}
