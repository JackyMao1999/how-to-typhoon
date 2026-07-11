import React, { useEffect, useRef } from 'react';
import { useMap } from '../map/MapProvider';
import { useDisplayState } from '../store/typhoonStore';
import { EyeEffect } from './EyeEffect';
import L from 'leaflet';
import { getEyeSpeedMul, getTyphoonLevel } from '../engine';
import { TYPHOON_LEVEL_CONFIG, TyphoonLevel } from '../types/typhoon';

export function RendererOverlay() {
  const webglRef = useRef<HTMLCanvasElement>(null);
  const { map, isLoaded } = useMap();
  const displayState = useDisplayState();

  const eyeRef = useRef<EyeEffect | null>(null);

  const stateRef = useRef(displayState);
  stateRef.current = displayState;

  useEffect(() => {
    if (!isLoaded || !map || !webglRef.current) return;

    const canvas = webglRef.current;
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true });
    if (!gl) return;

    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);

    const eye = new EyeEffect(gl);
    eyeRef.current = eye;

    let animId = 0;
    let lastTime = performance.now();

    function render() {
      animId = requestAnimationFrame(render);
      if (!gl) return;
      try {
        const now = performance.now();
        const delta = (now - lastTime) / 1000;
        lastTime = now;

        const container = map.getContainer();
        const cw = container.clientWidth;
        const ch = container.clientHeight;
        const pw = cw * devicePixelRatio;
        const ph = ch * devicePixelRatio;

        if (pw === 0 || ph === 0) return;

        if (canvas.width !== pw || canvas.height !== ph) {
          canvas.width = pw;
          canvas.height = ph;
          canvas.style.width = cw + 'px';
          canvas.style.height = ch + 'px';
        }

        gl.viewport(0, 0, pw, ph);
        gl.clear(gl.COLOR_BUFFER_BIT);

        const zoom = map.getZoom();
        if (!zoom || isNaN(zoom)) return;
        const zoomScale = Math.pow(2, zoom - 4);
        const NDC_PER_UNIT = 1 / (500 * Math.tan(37.5 * Math.PI / 180));
        const ndcScale = zoomScale * NDC_PER_UNIT;

        const s = stateRef.current;
        const pixel = map.latLngToContainerPoint(L.latLng(s.centerLat, s.centerLng));
        if (!pixel || isNaN(pixel.x) || isNaN(pixel.y)) return;

        const onScreen = pixel.x >= -100 && pixel.x <= pw + 100 && pixel.y >= -100 && pixel.y <= ph + 100;

        const offsetNDC: [number, number] = [
          (pixel.x - pw / 2) / (pw / 2),
          -(pixel.y - ph / 2) / (ph / 2),
        ];

        const speed = s.maxWindSpeed;
        const level = getTyphoonLevel(speed);
        const particleColor = TYPHOON_LEVEL_CONFIG[level].color;
        const eyeSpeedMul = getEyeSpeedMul(speed);
        const eyeColor = level === TyphoonLevel.SuperTY ? [1.0, 1.0, 1.0] as [number, number, number] : particleColor;

        if (onScreen) {
          eye.update(delta);
          eye.draw(offsetNDC, ndcScale, eyeSpeedMul, eyeColor);
        }
      } catch (_) { /* 保证 rAF 循环不中断 */ }
    }

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      eyeRef.current?.dispose();
    };
  }, [isLoaded, map]);

  return (
    <canvas
      ref={webglRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 500 }}
    />
  );
}
