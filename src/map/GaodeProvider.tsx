import React, {
  createContext,
  useContext,
  useRef,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';
import { getAmapKey } from '../utils/token';

declare global {
  interface Window {
    AMap?: any;
  }
}

interface MapContextValue {
  map: any;
  mapContainer: React.RefObject<HTMLDivElement | null>;
  isLoaded: boolean;
  flyTo: (lng: number, lat: number, zoom?: number) => void;
}

const MapContext = createContext<MapContextValue | null>(null);

export function useMap(): MapContextValue {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error('useMap must be used within <GaodeProvider>');
  return ctx;
}

interface Props {
  children: ReactNode;
  initialCenter?: [number, number];
  initialZoom?: number;
}

export function GaodeProvider({
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

    const key = getAmapKey();
    if (!key) return;

    AMapLoader.load({
      key,
      version: '2.0',
    })
      .then((AMap: any) => {
        if (!mapContainer.current) return;

        const instance = new AMap.Map(mapContainer.current, {
          zoom: initialZoom,
          center: initialCenter,
          mapStyle: 'amap://styles/dark',
          layers: [new AMap.TileLayer()],
          viewMode: '2D',
          pitch: 0,
          rotation: 0,
          showIndoorMap: false,
          showBuildingBlock: false,
        });

        instance.on('complete', () => {
          setIsLoaded(true);
        });

        AMap.plugin(['AMap.ToolBar', 'AMap.Scale'], () => {
          instance.addControl(new AMap.ToolBar());
          instance.addControl(new AMap.Scale());
        });

        mapRef.current = instance;
        setMap(instance);
      })
      .catch((err: any) => {
        console.error('AMap load failed:', err);
      });

    return () => {
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, []);

  const flyTo = useCallback(
    (lng: number, lat: number, zoom?: number) => {
      if (mapRef.current) {
        mapRef.current.setZoomAndCenter(
          zoom ?? mapRef.current.getZoom(),
          [lng, lat],
          false,
          1000
        );
      }
    },
    []
  );

  return (
    <MapContext.Provider value={{ map, mapContainer, isLoaded, flyTo }}>
      <div className="absolute inset-0">
        <div ref={mapContainer} className="w-full h-full" />
      </div>
      {isLoaded && children}
    </MapContext.Provider>
  );
}
