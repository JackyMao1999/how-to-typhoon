import React, { useEffect, useRef } from 'react';
import { useMap } from '../map/GaodeProvider';
import { useTyphoonStore, useDisplayState } from '../store/typhoonStore';
import { useUIStore } from '../store/uiStore';
import { ParticleSystem } from './ParticleSystem';
import { EyeEffect } from './EyeEffect';
import { WindCircleGlow } from './WindCircleGlow';
import { WindField } from './WindField';
import { wgs84ToGcj02 } from '../utils/coord';
import { getLevelColor, getEyeSpeedMul, getGlowSpeedMul, getTyphoonLevel } from '../engine';
import { TYPHOON_LEVEL_CONFIG, TyphoonLevel } from '../types/typhoon';

export function RendererOverlay() {
  const webglRef = useRef<HTMLCanvasElement>(null);
  const { map, isLoaded } = useMap();
  const displayState = useDisplayState();
  const showParticles = useUIStore((s) => s.showParticles);
  const showWindField = useUIStore((s) => s.showWindField);

  const particleRef = useRef<ParticleSystem | null>(null);
  const eyeRef = useRef<EyeEffect | null>(null);
  const glowRef = useRef<WindCircleGlow | null>(null);
  const windFieldRef = useRef<WindField | null>(null);
  const customLayerRef = useRef<any>(null);

  const stateRef = useRef(displayState);
  const particlesVisibleRef = useRef(showParticles);
  const windFieldVisibleRef = useRef(showWindField);

  stateRef.current = displayState;
  particlesVisibleRef.current = showParticles;
  windFieldVisibleRef.current = showWindField;

  useEffect(() => {
    if (!isLoaded || !map || !webglRef.current) return;

    const canvas = webglRef.current;
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true });
    if (!gl) return;

    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);

    const particles = new ParticleSystem(gl);
    particles.init();
    particleRef.current = particles;

    const eye = new EyeEffect(gl);
    eyeRef.current = eye;

    const glow = new WindCircleGlow(gl);
    glowRef.current = glow;

    const windField = new WindField(gl);
    windField.init();
    windFieldRef.current = windField;

    const customLayer = new window.AMap.CustomLayer(canvas, {
      zooms: [3, 18],
      alwaysRender: true,
    });

    let lastTime = performance.now();

    customLayer.render = () => {
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      const w = canvas.width;
      const h = canvas.height;
      if (w === 0 || h === 0) return;

      gl.viewport(0, 0, w, h);
      gl.clear(gl.COLOR_BUFFER_BIT);

      const zoom = map.getZoom();
      const zoomScale = Math.pow(2, zoom - 4);
      const NDC_PER_UNIT = 1 / (500 * Math.tan(37.5 * Math.PI / 180));
      const ndcScale = zoomScale * NDC_PER_UNIT;

      const s = stateRef.current;
      const [gcjLng, gcjLat] = wgs84ToGcj02(s.centerLng, s.centerLat);
      const pixel = map.lngLatToContainer([gcjLng, gcjLat]);

      const offsetNDC: [number, number] = [
        (pixel.x - w / 2) / (w / 2),
        -(pixel.y - h / 2) / (h / 2),
      ];

      const speed = s.maxWindSpeed;
      const level = getTyphoonLevel(speed);
      const particleColor = TYPHOON_LEVEL_CONFIG[level].color;
      const eyeSpeedMul = getEyeSpeedMul(speed);
      const glowSpeedMul = getGlowSpeedMul(speed);
      const eyeColor = level === TyphoonLevel.SuperTY ? [1.0, 1.0, 1.0] as [number, number, number] : particleColor;

      if (particlesVisibleRef.current) {
        particles.update(now);
        particles.draw(offsetNDC, ndcScale, [w, h], 0.8, zoomScale, particleColor);
      }

      eye.update(delta);
      eye.draw(offsetNDC, ndcScale, eyeSpeedMul, eyeColor);

      const windRadii = s.windCircles.map((wc) => Math.max(wc.ne, wc.nw, wc.se, wc.sw)) as [number, number, number];
      glow.update(delta);
      glow.draw(offsetNDC, ndcScale, windRadii, glowSpeedMul);

      if (windFieldVisibleRef.current) {
        windField.update(now, s.centerLng, s.centerLat, s, map, delta);
        windField.draw(offsetNDC, ndcScale, [w, h], 0.8, zoomScale);
      }
    };

    map.add(customLayer);
    customLayerRef.current = customLayer;

    return () => {
      if (customLayerRef.current && map) map.remove(customLayerRef.current);
      particleRef.current?.dispose();
      eyeRef.current?.dispose();
      glowRef.current?.dispose();
      windFieldRef.current?.dispose();
    };
  }, [isLoaded, map]);

  useEffect(() => {
    if (!webglRef.current || !map) return;
    const resize = () => {
      const c = map.getContainer();
      const w = c.clientWidth * devicePixelRatio;
      const h = c.clientHeight * devicePixelRatio;
      if (webglRef.current) {
        webglRef.current.width = w;
        webglRef.current.height = h;
        webglRef.current.style.width = c.clientWidth + 'px';
        webglRef.current.style.height = c.clientHeight + 'px';
      }
    };
    resize();
    map.on('resize', resize);
    return () => { map.off('resize', resize); };
  }, [isLoaded, map]);

  return (
    <canvas
      ref={webglRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 2 }}
    />
  );
}
