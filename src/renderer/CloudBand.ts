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
uniform float uIntensity;
uniform float uEyeSize;
varying vec2 vUv;

float hash(vec2 p){
  p=fract(p*vec2(123.34,345.45));
  p+=dot(p,p+34.345);
  return fract(p.x*p.y);
}

void main(){
  float r=length(vUv);
  if(r>1.0) discard;

  float theta=atan(vUv.y,vUv.x);
  float spin=uTime*(0.18+uIntensity*0.18);
  float arms=3.0+floor(uIntensity*2.0);
  float curl=10.0+uIntensity*12.0;
  float spiral=sin(theta*arms-r*curl+spin);
  float band=smoothstep(0.20,0.82,spiral);
  band*=smoothstep(0.05,0.26,r)*(1.0-smoothstep(0.92,1.0,r));

  float n=hash(floor((vUv*0.5+0.5)*90.0+uTime*0.08));
  float texture=0.72+0.28*n;

  float eye=1.0-smoothstep(uEyeSize,uEyeSize+0.055,r);
  float eyewall=smoothstep(uEyeSize,uEyeSize+0.04,r)*(1.0-smoothstep(uEyeSize+0.08,uEyeSize+0.18,r));
  float outer=smoothstep(0.18,0.35,r)*(1.0-smoothstep(0.78,1.0,r));
  float cloud=max(band*outer,eyewall*(0.88+uIntensity*0.35));
  cloud*=texture;
  cloud*=1.0-eye;

  vec3 low=vec3(0.44,0.58,0.72);
  vec3 high=vec3(0.96,0.98,1.0);
  vec3 color=mix(low,high,clamp(cloud+uIntensity*0.25,0.0,1.0));
  float alpha=cloud*(0.26+uIntensity*0.36);
  alpha+=eyewall*(0.18+uIntensity*0.18);
  alpha*=1.0-smoothstep(0.96,1.0,r);

  gl_FragColor=vec4(color,alpha);
}`;

export class CloudBand {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private buf: WebGLBuffer;
  private locA: number;
  private locOffset: WebGLUniformLocation;
  private locScale: WebGLUniformLocation;
  private locTime: WebGLUniformLocation;
  private locIntensity: WebGLUniformLocation;
  private locEyeSize: WebGLUniformLocation;
  private time = 0;

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
    const prog = gl.createProgram()!;
    const vs = this.compile(VERT_SRC, gl.VERTEX_SHADER);
    const fs = this.compile(FRAG_SRC, gl.FRAGMENT_SHADER);
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('cloud prog link');
    this.program = prog;

    this.locA = gl.getAttribLocation(prog, 'aPosition');
    this.locOffset = gl.getUniformLocation(prog, 'uOffsetNDC')!;
    this.locScale = gl.getUniformLocation(prog, 'uScale')!;
    this.locTime = gl.getUniformLocation(prog, 'uTime')!;
    this.locIntensity = gl.getUniformLocation(prog, 'uIntensity')!;
    this.locEyeSize = gl.getUniformLocation(prog, 'uEyeSize')!;

    const verts = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]);
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

  draw(offsetNDC: [number, number], ndcScale: number, maxWindSpeed: number, radiusKm: number): void {
    const gl = this.gl;
    const intensity = Math.max(0, Math.min(1, (maxWindSpeed - 17.2) / 52.2));
    const eyeSize = Math.max(0.055, Math.min(0.16, 0.14 - intensity * 0.055));
    const scale = ndcScale * Math.max(120, Math.min(620, radiusKm * (1.45 + intensity * 0.55)));

    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.enableVertexAttribArray(this.locA);
    gl.vertexAttribPointer(this.locA, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(this.locOffset, offsetNDC[0], offsetNDC[1]);
    gl.uniform1f(this.locScale, scale);
    gl.uniform1f(this.locTime, this.time);
    gl.uniform1f(this.locIntensity, intensity);
    gl.uniform1f(this.locEyeSize, eyeSize);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  dispose(): void {
    this.gl.deleteBuffer(this.buf);
    this.gl.deleteProgram(this.program);
  }
}
