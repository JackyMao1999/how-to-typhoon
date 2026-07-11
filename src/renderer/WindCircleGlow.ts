const VERT_SRC = `attribute vec2 aPosition;
uniform vec2 uOffsetNDC;
uniform float uScale;
void main(){
  gl_Position=vec4(aPosition*uScale+uOffsetNDC,0.,1.);
}`;

const FRAG_SRC = `precision mediump float;
uniform vec3 uColor;
uniform float uAlpha;
void main(){
  gl_FragColor=vec4(uColor,uAlpha);
}`;

const COLORS: [number, number, number][] = [
  [0.31, 0.76, 0.97],
  [1.0, 0.84, 0.31],
  [0.94, 0.33, 0.31],
];

export class WindCircleGlow {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private buffer: WebGLBuffer;
  private count: number;
  private segments = 64;
  private locOffset: WebGLUniformLocation;
  private locScale: WebGLUniformLocation;
  private locColor: WebGLUniformLocation;
  private locAlpha: WebGLUniformLocation;
  private locA: number;
  private time = 0;

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
    const prog = gl.createProgram()!;
    const vs = this.compile(VERT_SRC, gl.VERTEX_SHADER);
    const fs = this.compile(FRAG_SRC, gl.FRAGMENT_SHADER);
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('circle prog link');
    this.program = prog;

    this.locA = gl.getAttribLocation(prog, 'aPosition');
    this.locOffset = gl.getUniformLocation(prog, 'uOffsetNDC')!;
    this.locScale = gl.getUniformLocation(prog, 'uScale')!;
    this.locColor = gl.getUniformLocation(prog, 'uColor')!;
    this.locAlpha = gl.getUniformLocation(prog, 'uAlpha')!;

    const n = this.segments;
    this.count = n + 1;
    const verts = new Float32Array((n + 1) * 2);
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      verts[i * 2] = Math.cos(a);
      verts[i * 2 + 1] = Math.sin(a);
    }
    this.buffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
  }

  private compile(src: string, type: number): WebGLShader {
    const s = this.gl.createShader(type)!;
    this.gl.shaderSource(s, src);
    this.gl.compileShader(s);
    return s;
  }

  update(delta: number): void {
    this.time += delta;
  }

  draw(
    offsetNDC: [number, number],
    ndcScale: number,
    radii: [number, number, number],
    glowSpeedMul: number,
  ): void {
    const ARB_RADII = [40, 20, 10];
    const gl = this.gl;
    gl.useProgram(this.program);
    gl.uniform2f(this.locOffset, offsetNDC[0], offsetNDC[1]);

    for (let i = 0; i < 3; i++) {
      const r = radii[i];
      const pulse = 0.3 + 0.3 * Math.sin(this.time * 1.5 * glowSpeedMul + r * 0.01);

      gl.uniform1f(this.locScale, ndcScale * ARB_RADII[i]);
      gl.uniform3f(this.locColor, COLORS[i][0], COLORS[i][1], COLORS[i][2]);
      gl.uniform1f(this.locAlpha, pulse);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.enableVertexAttribArray(this.locA);
      gl.vertexAttribPointer(this.locA, 2, gl.FLOAT, false, 0, 0);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.drawArrays(gl.LINE_STRIP, 0, this.count);
    }
  }

  dispose(): void {
    this.gl.deleteBuffer(this.buffer);
    this.gl.deleteProgram(this.program);
  }
}
