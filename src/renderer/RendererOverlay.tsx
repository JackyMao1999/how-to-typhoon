import React, { useEffect, useRef } from 'react';
import { useMap } from '../map/GaodeProvider';
import { useTyphoonStore, useDisplayState } from '../store/typhoonStore';
import { useUIStore } from '../store/uiStore';
import { ParticleSystem } from './ParticleSystem';
import { EyeEffect } from './EyeEffect';
import { WindCircleGlow } from './WindCircleGlow';
import { WindField } from './WindField';
import { wgs84ToGcj02 } from '../utils/coord';
import { getEyeSpeedMul, getGlowSpeedMul, getTyphoonLevel } from '../engine';
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
        const [gcjLng, gcjLat] = wgs84ToGcj02(s.centerLng, s.centerLat);
        const pixel = map.lngLatToContainer([gcjLng, gcjLat]);
        if (!pixel || isNaN(pixel.x) || isNaN(pixel.y)) return;

        // 台风在屏幕外超出一定距离则跳过渲染（防止日界线附近坐标异常）
        const onScreen = pixel.x >= -100 && pixel.x <= pw + 100 && pixel.y >= -100 && pixel.y <= ph + 100;

        const offsetNDC: [number, number] = [
          (pixel.x - pw / 2) / (pw / 2),
          -(pixel.y - ph / 2) / (ph / 2),
        ];

        const speed = s.maxWindSpeed;
        const level = getTyphoonLevel(speed);
        const particleColor = TYPHOON_LEVEL_CONFIG[level].color;
        const eyeSpeedMul = getEyeSpeedMul(speed);
        const glowSpeedMul = getGlowSpeedMul(speed);
        const eyeColor = level === TyphoonLevel.SuperTY ? [1.0, 1.0, 1.0] as [number, number, number] : particleColor;

        // 中心调试标记（红点），确认 WebGL 渲染始终在工作
        particles.draw([0, 0], 0.003, [pw, ph], 0.8, zoomScale, [0.8, 0.1, 0.1]);

        if (onScreen) {
          if (particlesVisibleRef.current) {
            particles.update(now);
            particles.draw(offsetNDC, ndcScale, [pw, ph], 0.8, zoomScale, particleColor);
          }

          eye.update(delta);
          eye.draw(offsetNDC, ndcScale, eyeSpeedMul, eyeColor);

          const windRadii = s.windCircles.map((wc) => Math.max(wc.ne, wc.nw, wc.se, wc.sw)) as [number, number, number];
          glow.update(delta);
          glow.draw(offsetNDC, ndcScale, windRadii, glowSpeedMul);

          if (windFieldVisibleRef.current) {
            windField.update(now, s.centerLng, s.centerLat, s, map, delta);
            windField.draw(offsetNDC, ndcScale, [pw, ph], 0.8, zoomScale);
          }
        }
      } catch (_) { /* 保证 rAF 循环不中断 */ }
    }

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      particleRef.current?.dispose();
      eyeRef.current?.dispose();
      glowRef.current?.dispose();
      windFieldRef.current?.dispose();
    };
  }, [isLoaded, map]);

  return (
    <canvas
      ref={webglRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 2 }}
    />
  );
}
