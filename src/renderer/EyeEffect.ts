const VERT_SRC = `attribute vec2 aPosition;
uniform vec2 uOffsetNDC;
uniform float uScale;
varying vec2 vUv;
void main(){
  vUv=aPosition;
  gl_Position=vec4(aPosition*uScale+uOffsetNDC,0.,1.);
}`;

const FRAG_SRC = `precision mediump float;
uniform float uTime;
uniform float uSpeed;
uniform vec3 uColor;
varying vec2 vUv;
void main(){
  float d=length(vUv);
  float p=.8+.2*sin(uTime*uSpeed*2.+d*10.);
  float a=(1.-smoothstep(.0,1.,d))*p*.6;
  gl_FragColor=vec4(uColor,a);
}`;

export class EyeEffect {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private buf: WebGLBuffer;
  private count: number;
  private locOffset: WebGLUniformLocation;
  private locScale: WebGLUniformLocation;
  private locTime: WebGLUniformLocation;
  private locSpeed: WebGLUniformLocation;
  private locColor: WebGLUniformLocation;
  private locA: number;
  private time = 0;

  constructor(gl: WebGLRenderingContext, segments = 32) {
    this.gl = gl;
    const prog = gl.createProgram()!;
    const vs = this.compile(VERT_SRC, gl.VERTEX_SHADER);
    const fs = this.compile(FRAG_SRC, gl.FRAGMENT_SHADER);
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('eye prog link');
    this.program = prog;

    this.locA = gl.getAttribLocation(prog, 'aPosition');
    this.locOffset = gl.getUniformLocation(prog, 'uOffsetNDC')!;
    this.locScale = gl.getUniformLocation(prog, 'uScale')!;
    this.locTime = gl.getUniformLocation(prog, 'uTime')!;
    this.locSpeed = gl.getUniformLocation(prog, 'uSpeed')!;
    this.locColor = gl.getUniformLocation(prog, 'uColor')!;

    this.count = segments + 2;
    const verts = new Float32Array((segments + 2) * 2);
    verts[0] = 0; verts[1] = 0;
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      verts[(i + 1) * 2] = Math.cos(a);
      verts[(i + 1) * 2 + 1] = Math.sin(a);
    }
    this.buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
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
    eyeSpeedMul: number,
    color: [number, number, number],
  ): void {
    const gl = this.gl;
    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.enableVertexAttribArray(this.locA);
    gl.vertexAttribPointer(this.locA, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(this.locOffset, offsetNDC[0], offsetNDC[1]);
    gl.uniform1f(this.locScale, ndcScale * 8);
    gl.uniform1f(this.locTime, this.time);
    gl.uniform1f(this.locSpeed, eyeSpeedMul);
    gl.uniform3f(this.locColor, color[0], color[1], color[2]);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, this.count);
  }

  dispose(): void {
    this.gl.deleteBuffer(this.buf);
    this.gl.deleteProgram(this.program);
  }
}
