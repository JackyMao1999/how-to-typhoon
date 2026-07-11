import { TyphoonStatus } from '../types/typhoon';
import { computeWindAtPoint } from '../engine/windField';
import { gcj02ToWgs84, wgs84ToGcj02 } from '../utils/coord';

const VERT_SRC = `attribute vec2 aPosition;
attribute vec3 aColor;
attribute float aAlpha;
uniform vec2 uOffsetNDC;
uniform float uScale;
uniform vec2 uRes;
varying vec3 vColor;
varying float vAlpha;
void main(){
  vec2 p=aPosition*uScale+uOffsetNDC;
  gl_Position=vec4(p,0.,1.);
  gl_PointSize=2.0+aAlpha*3.5;
  vColor=aColor;
  vAlpha=aAlpha;
}`;

const FRAG_SRC = `precision mediump float;
uniform float uAlpha;
varying vec3 vColor;
varying float vAlpha;
void main(){
  vec2 c=gl_PointCoord-vec2(.5);
  float d=length(c);
  if(d>.5)discard;
  float a=smoothstep(.5,.0,d)*uAlpha*vAlpha;
  gl_FragColor=vec4(vColor,a);
}`;

interface WindParticle {
  x: number;
  y: number;
  lng: number;
  lat: number;
  lifetime: number;
  age: number;
}

function speedColor(speed: number): [number, number, number] {
  if (speed < 10) return [0.2, 0.8, 0.3];
  if (speed < 18) return [0.4, 0.9, 0.2];
  if (speed < 25) return [0.9, 0.8, 0.2];
  if (speed < 32) return [1.0, 0.5, 0.1];
  return [1.0, 0.2, 0.1];
}

export class WindField {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private buf: WebGLBuffer;
  private colorBuf: WebGLBuffer;
  private alphaBuf: WebGLBuffer;
  private particles: WindParticle[] = [];
  private count = 1200;
  private locA: number;
  private locColorA: number;
  private locAlphaA: number;
  private locOffset: WebGLUniformLocation;
  private locScale: WebGLUniformLocation;
  private locRes: WebGLUniformLocation;
  private locAlpha: WebGLUniformLocation;

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
    const prog = gl.createProgram()!;
    const vs = this.compile(VERT_SRC, gl.VERTEX_SHADER);
    const fs = this.compile(FRAG_SRC, gl.FRAGMENT_SHADER);
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    this.program = prog;
    this.buf = gl.createBuffer()!;
    this.colorBuf = gl.createBuffer()!;
    this.alphaBuf = gl.createBuffer()!;
    this.locA = gl.getAttribLocation(prog, 'aPosition');
    this.locColorA = gl.getAttribLocation(prog, 'aColor');
    this.locAlphaA = gl.getAttribLocation(prog, 'aAlpha');
    this.locOffset = gl.getUniformLocation(prog, 'uOffsetNDC')!;
    this.locScale = gl.getUniformLocation(prog, 'uScale')!;
    this.locRes = gl.getUniformLocation(prog, 'uRes')!;
    this.locAlpha = gl.getUniformLocation(prog, 'uAlpha')!;
  }

  private compile(src: string, type: number): WebGLShader {
    const s = this.gl.createShader(type)!;
    this.gl.shaderSource(s, src);
    this.gl.compileShader(s);
    return s;
  }

  init(): void {
    this.particles = [];
    for (let i = 0; i < this.count; i++) {
      this.particles.push(this.createParticle());
    }
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buf);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.count * 2), this.gl.DYNAMIC_DRAW);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuf);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.count * 3), this.gl.DYNAMIC_DRAW);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.alphaBuf);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.count), this.gl.DYNAMIC_DRAW);
  }

  private createParticle(): WindParticle {
    return {
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2,
      lng: 0,
      lat: 0,
      lifetime: 2 + Math.random() * 3,
      age: Math.random() * 5,
    };
  }

  update(
    time: number,
    centerLng: number,
    centerLat: number,
    typhoon: TyphoonStatus,
    map: any,
    dt: number,
  ): void {
    const data = new Float32Array(this.count * 2);
    const colors = new Float32Array(this.count * 3);
    const alphas = new Float32Array(this.count);

    const container = map.getContainer();
    const w = container.clientWidth;
    const h = container.clientHeight;

    for (let i = 0; i < this.count; i++) {
      const p = this.particles[i];
      p.age += dt;

      if (p.age > p.lifetime) {
        const na = Math.random() * 2 * Math.PI;
        const nr = Math.random() * 0.6;
        const nx = Math.cos(na) * nr;
        const ny = Math.sin(na) * nr;
        const pixel = map.lngLatToContainer([
          centerLng + nx * 20,
          centerLat + ny * 15,
        ]);
        p.x = (pixel.x - w / 2) / (w / 2);
        p.y = -(pixel.y - h / 2) / (h / 2);
        p.lng = centerLng + nx * 20;
        p.lat = centerLat + ny * 15;
        p.lifetime = 2 + Math.random() * 3;
        p.age = 0;
      }

      const wind = computeWindAtPoint(p.lng, p.lat, typhoon);
      if (wind.speed > 0) {
        const rad = (wind.direction * Math.PI) / 180;
        const movePx = wind.speed * 0.001 * dt * 30;
        const mLng = (movePx * Math.sin(rad)) / (111 * Math.cos((p.lat * Math.PI) / 180));
        const mLat = (movePx * Math.cos(rad)) / 111;
        p.lng += mLng;
        p.lat += mLat;
      }

      const pixel2 = map.lngLatToContainer([p.lng, p.lat]);
      p.x = (pixel2.x - w / 2) / (w / 2);
      p.y = -(pixel2.y - h / 2) / (h / 2);

      data[i * 2] = p.x;
      data[i * 2 + 1] = p.y;

      const col = speedColor(wind.speed);
      colors[i * 3] = col[0];
      colors[i * 3 + 1] = col[1];
      colors[i * 3 + 2] = col[2];
      const lifeAlpha = Math.min(1, 1 - p.age / p.lifetime);
      alphas[i] = lifeAlpha * Math.min(1, 0.25 + wind.speed / 45);
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buf);
    this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, data);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuf);
    this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, colors);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.alphaBuf);
    this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, alphas);
  }

  draw(
    offsetNDC: [number, number],
    ndcScale: number,
    res: [number, number],
    alpha: number,
    pixelScale: number,
  ): void {
    const gl = this.gl;
    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.enableVertexAttribArray(this.locA);
    gl.vertexAttribPointer(this.locA, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuf);
    gl.enableVertexAttribArray(this.locColorA);
    gl.vertexAttribPointer(this.locColorA, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.alphaBuf);
    gl.enableVertexAttribArray(this.locAlphaA);
    gl.vertexAttribPointer(this.locAlphaA, 1, gl.FLOAT, false, 0, 0);

    gl.uniform2f(this.locOffset, offsetNDC[0], offsetNDC[1]);
    gl.uniform1f(this.locScale, ndcScale);
    gl.uniform2f(this.locRes, res[0], res[1]);
    gl.uniform1f(this.locAlpha, alpha);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.POINTS, 0, this.count);
  }

  dispose(): void {
    this.gl.deleteBuffer(this.buf);
    this.gl.deleteBuffer(this.colorBuf);
    this.gl.deleteBuffer(this.alphaBuf);
    this.gl.deleteProgram(this.program);
  }
}
