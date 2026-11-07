import { H, W } from './util';

const VERT = `attribute vec2 p; varying vec2 v; void main(){ v = p*.5+.5; v.y = 1.-v.y; gl_Position = vec4(p,0.,1.); }`;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 v;
uniform sampler2D tex;
uniform float time, glitch, crt, invert;
const vec2 res = vec2(${W}.0, ${H}.0);

float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }

vec2 curve(vec2 uv){
  uv = uv*2.-1.;
  vec2 o = abs(uv.yx)/vec2(11.,8.);
  uv += uv*o*o*crt;
  return uv*.5+.5;
}

void main(){
  vec2 uv = curve(v);
  if(uv.x<0.||uv.x>1.||uv.y<0.||uv.y>1.){ gl_FragColor = vec4(0.,0.,0.,1.); return; }
  if(glitch>0.01){
    float row = floor(uv.y*30.);
    float t = floor(time*24.);
    float n = hash(vec2(row,t));
    if(n > 1.-glitch*.55) uv.x += (hash(vec2(row+1.,t))-.5)*.14*glitch;
    float row2 = floor(uv.y*270.);
    uv.x += (hash(vec2(row2,t))-.5)*.006*glitch;
  }
  float ab = (.0007*crt + glitch*.009);
  vec3 c;
  c.r = texture2D(tex, uv+vec2(ab,0.)).r;
  c.g = texture2D(tex, uv).g;
  c.b = texture2D(tex, uv-vec2(ab,0.)).b;
  if(crt>0.01){
    vec3 b = vec3(0.);
    vec2 px = 1./res;
    for(int i=0;i<8;i++){
      float a = float(i)*.7854;
      vec2 d = vec2(cos(a),sin(a))*px*2.6;
      vec3 s = texture2D(tex, uv+d).rgb;
      b += max(s-.55,0.);
    }
    c += b*.11*crt;
    float scan = .86+.14*sin(uv.y*res.y*6.2832);
    c *= mix(1., scan, crt);
    float m = mod(floor(v.x*res.x*3.),3.);
    vec3 mask = m<1.?vec3(1.05,.97,.97):m<2.?vec3(.97,1.05,.97):vec3(.97,.97,1.05);
    c *= mix(vec3(1.), mask, crt*.7);
    vec2 q = uv*2.-1.;
    c *= 1.-dot(q,q)*.16*crt;
    c += (hash(uv*res+time)-.5)*.022*crt;
  }
  if(invert>.5) c = 1.-c;
  gl_FragColor = vec4(c,1.);
}`;

/** Presents the internal canvas on screen, with CRT post-processing when WebGL is available. */
export class Presenter {
  private gl: WebGLRenderingContext | null = null;
  private ctx2d: CanvasRenderingContext2D | null = null;
  private uTime: WebGLUniformLocation | null = null;
  private uGlitch: WebGLUniformLocation | null = null;
  private uCrt: WebGLUniformLocation | null = null;
  private uInvert: WebGLUniformLocation | null = null;
  crtEnabled = true;

  constructor(private out: HTMLCanvasElement, private src: HTMLCanvasElement) {
    this.gl = out.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
    if (this.gl && !this.setup(this.gl)) this.gl = null;
    if (!this.gl) {
      out.width = W;
      out.height = H;
      this.ctx2d = out.getContext('2d');
      if (this.ctx2d) this.ctx2d.imageSmoothingEnabled = false;
    }
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  private setup(gl: WebGLRenderingContext): boolean {
    const compile = (type: number, code: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, code);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return false;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.uTime = gl.getUniformLocation(prog, 'time');
    this.uGlitch = gl.getUniformLocation(prog, 'glitch');
    this.uCrt = gl.getUniformLocation(prog, 'crt');
    this.uInvert = gl.getUniformLocation(prog, 'invert');
    return true;
  }

  private resize() {
    if (!this.gl) return;
    const r = this.out.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.out.width = Math.max(W, Math.round(r.width * dpr));
    this.out.height = Math.max(H, Math.round(r.height * dpr));
    this.gl.viewport(0, 0, this.out.width, this.out.height);
  }

  present(time: number, glitch: number, invert: boolean) {
    const gl = this.gl;
    if (gl) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.src);
      gl.uniform1f(this.uTime, time);
      gl.uniform1f(this.uGlitch, glitch);
      gl.uniform1f(this.uCrt, this.crtEnabled ? 1 : 0);
      gl.uniform1f(this.uInvert, invert ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    } else if (this.ctx2d) {
      this.ctx2d.drawImage(this.src, 0, 0);
    }
  }
}
