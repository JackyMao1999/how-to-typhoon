export interface ParticleConfig {
  count: number;
  rotationSpeed: number;
  spiralFactor: number;
  lifetime: number;
  sizeRange: [number, number];
  opacityRange: [number, number];
}

export const DEFAULT_PARTICLE_CONFIG: ParticleConfig = {
  count: 2000,
  rotationSpeed: 0.002,
  spiralFactor: 0.8,
  lifetime: 4000,
  sizeRange: [2, 6],
  opacityRange: [0.3, 0.9],
};
