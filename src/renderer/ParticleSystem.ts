const VERT_SRC = `attribute vec2 aPosition;
uniform vec2 uOffsetNDC;
uniform float uScale;
uniform vec2 uRes;
uniform float uPointSize;
uniform float uAlpha;
void main(){
  vec2 p=aPosition*uScale+uOffsetNDC;
  gl_Position=vec4(p,0.,1.);
  gl_PointSize=uPointSize*uScale;
}`;

const FRAG_SRC = `precision mediump float;
uniform vec3 uColor;
void main(){
  vec2 c=gl_PointCoord-vec2(.5);
  float d=length(c);
  if(d>.5)discard;
  float a=smoothstep(.5,.0,d);
  gl_FragColor=vec4(uColor,a);
}`;

interface Particle {
  angle: number;
  radius: number;
  speed: number;
  offset: number;
}

export class ParticleSystem {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private buf: WebGLBuffer;
  private particles: Particle[] = [];
  private count = 2000;
  private locA: number;
  private locOffset: WebGLUniformLocation;
  private locScale: WebGLUniformLocation;
  private locRes: WebGLUniformLocation;
  private locPS: WebGLUniformLocation;
  private locAlpha: WebGLUniformLocation;
  private locColor: WebGLUniformLocation;

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
    const prog = gl.createProgram()!;
    const vs = this.compile(VERT_SRC, gl.VERTEX_SHADER);
    const fs = this.compile(FRAG_SRC, gl.FRAGMENT_SHADER);
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('particle prog link');
    this.program = prog;
    this.buf = gl.createBuffer()!;
    this.locA = gl.getAttribLocation(prog, 'aPosition');
    this.locOffset = gl.getUniformLocation(prog, 'uOffsetNDC')!;
    this.locScale = gl.getUniformLocation(prog, 'uScale')!;
    this.locRes = gl.getUniformLocation(prog, 'uRes')!;
    this.locPS = gl.getUniformLocation(prog, 'uPointSize')!;
    this.locAlpha = gl.getUniformLocation(prog, 'uAlpha')!;
    this.locColor = gl.getUniformLocation(prog, 'uColor')!;
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
      this.particles.push({
        angle: Math.random() * Math.PI * 2,
        radius: 5 + Math.random() * 45,
        speed: 0.5 + Math.random() * 1.5,
        offset: Math.random() * 1000,
      });
    }
    const data = new Float32Array(this.count * 2);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buf);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.DYNAMIC_DRAW);
  }

  update(time: number): void {
    const data = new Float32Array(this.count * 2);
    const p = this.particles;

    for (let i = 0; i < this.count; i++) {
      p[i].angle += 0.002 * p[i].speed;

      const R = p[i].radius;
      const inward = time * 0.0003 + p[i].offset;
      const r = R * (0.2 + 0.8 * Math.abs(Math.sin(inward)));

      const omega = 0.0015 / (0.1 + r / R);
      const x = r * Math.cos(p[i].angle + time * omega);
      const y = r * Math.sin(p[i].angle + time * omega);

      data[i * 2] = x;
      data[i * 2 + 1] = y;
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buf);
    this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, data);
  }

  draw(
    offsetNDC: [number, number],
    ndcScale: number,
    res: [number, number],
    alpha: number,
    pixelScale: number,
    color: [number, number, number],
  ): void {
    const gl = this.gl;
    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.enableVertexAttribArray(this.locA);
    gl.vertexAttribPointer(this.locA, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(this.locOffset, offsetNDC[0], offsetNDC[1]);
    gl.uniform1f(this.locScale, ndcScale);
    gl.uniform2f(this.locRes, res[0], res[1]);
    gl.uniform1f(this.locPS, 4 * pixelScale);
    gl.uniform1f(this.locAlpha, alpha);
    gl.uniform3f(this.locColor, color[0], color[1], color[2]);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.drawArrays(gl.POINTS, 0, this.count);
  }

  dispose(): void {
    this.gl.deleteBuffer(this.buf);
    this.gl.deleteProgram(this.program);
  }
}
