/**
 * FlameField — a single full-screen fragment shader of rising, domain-warped
 * fire and smoke. Raw WebGL (no Three.js): one quad, one program.
 *
 * Performance budget:
 *  - renders at a fraction of CSS resolution (fire is soft anyway)
 *  - pauses when offscreen or when the tab is hidden
 *  - caps at ~45fps on small screens
 */

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform float uHeat;
uniform vec2 uMouse;
uniform float uMouseAmt;
varying vec2 vUv;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv;
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  float t = uTime;

  // Domain warp, scrolling upward: licks of flame.
  vec2 q = vec2(fbm(p * 1.7 + vec2(0.0, -t * 0.45)), fbm(p * 1.7 + vec2(5.2, -t * 0.55)));
  float n = fbm(p * 2.6 + q * 1.8 + vec2(0.0, -t * 1.15));

  // Flame body height grows with heat — low and contained at rest, so hero
  // text stays legible, then climbing to fill the screen.
  float h = mix(0.15, 1.2, uHeat * uHeat);
  float body = 1.0 - uv.y / h;

  // Pointer warmth (desktop only): a soft extra lick under the cursor.
  float md = distance(vec2(uv.x * aspect, uv.y), vec2(uMouse.x * aspect, uMouse.y));
  body += uMouseAmt * 0.22 * exp(-md * md * 9.0) * (1.0 - uv.y);

  float f = clamp(body + (n - 0.5) * 1.15, 0.0, 1.0);
  f = pow(f, 1.55);

  vec3 c = vec3(0.0);
  c = mix(c, vec3(0.30, 0.03, 0.05), smoothstep(0.02, 0.22, f)); // burgundy
  c = mix(c, vec3(0.80, 0.11, 0.06), smoothstep(0.18, 0.52, f)); // flame
  c = mix(c, vec3(1.00, 0.35, 0.08), smoothstep(0.50, 0.84, f)); // ember
  c = mix(c, vec3(1.00, 0.68, 0.30), smoothstep(0.86, 1.00, f) * 0.6); // restrained gold tips

  // Smoke drifting above the fire.
  float smoke = fbm(p * 1.3 + q * 0.6 + vec2(t * 0.04, -t * 0.12));
  smoke *= smoothstep(0.15, 0.95, uv.y) * smoothstep(1.05, 0.35, uv.y);
  c += vec3(0.9, 0.82, 0.76) * smoke * 0.07 * (0.6 + uHeat * 0.6);

  gl_FragColor = vec4(c, 1.0);
}`;

export interface FlameOptions {
  heat?: number;
  scale?: number;
}

export class FlameField {
  private gl: WebGLRenderingContext;
  private canvas: HTMLCanvasElement;
  private uRes: WebGLUniformLocation | null;
  private uTime: WebGLUniformLocation | null;
  private uHeat: WebGLUniformLocation | null;
  private uMouse: WebGLUniformLocation | null;
  private uMouseAmt: WebGLUniformLocation | null;
  private raf = 0;
  private running = false;
  private visible = false;
  private start = performance.now();
  private last = 0;
  private scale: number;
  private minFrame: number;
  private io: IntersectionObserver;
  private ro: ResizeObserver;

  heat: number;
  private heatTarget: number;
  private mouse = { x: 0.5, y: 0.2, amt: 0, amtTarget: 0 };

  static create(canvas: HTMLCanvasElement, opts: FlameOptions = {}): FlameField | null {
    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
    });
    if (!gl) return null;
    try {
      return new FlameField(canvas, gl, opts);
    } catch {
      return null;
    }
  }

  private constructor(canvas: HTMLCanvasElement, gl: WebGLRenderingContext, opts: FlameOptions) {
    this.canvas = canvas;
    this.gl = gl;
    this.heat = this.heatTarget = opts.heat ?? 0.3;
    const small = Math.min(window.innerWidth, window.innerHeight) < 600;
    this.scale = opts.scale ?? (small ? 0.4 : 0.5);
    this.minFrame = small ? 1000 / 45 : 0;

    const prog = this.program(VERT, FRAG);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    this.uRes = gl.getUniformLocation(prog, 'uRes');
    this.uTime = gl.getUniformLocation(prog, 'uTime');
    this.uHeat = gl.getUniformLocation(prog, 'uHeat');
    this.uMouse = gl.getUniformLocation(prog, 'uMouse');
    this.uMouseAmt = gl.getUniformLocation(prog, 'uMouseAmt');

    this.resize();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);

    this.io = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      this.visible ? this.play() : this.pause();
    });
    this.io.observe(canvas);

    document.addEventListener('visibilitychange', this.onVisibility);
    canvas.addEventListener('webglcontextlost', this.onLost, false);
  }

  private program(vs: string, fs: string) {
    const gl = this.gl;
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
      return s;
    };
    const p = gl.createProgram()!;
    gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'link');
    return p;
  }

  private resize() {
    const r = this.canvas.getBoundingClientRect();
    const w = Math.max(2, Math.round(r.width * this.scale));
    const h = Math.max(2, Math.round(r.height * this.scale));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.gl.viewport(0, 0, w, h);
    }
    if (!this.running) this.draw(performance.now());
  }

  private onVisibility = () => {
    if (document.hidden) this.pause();
    else if (this.visible) this.play();
  };

  private onLost = (e: Event) => {
    e.preventDefault();
    this.pause();
  };

  setHeat(v: number, immediate = false) {
    this.heatTarget = Math.min(1, Math.max(0, v));
    if (immediate) this.heat = this.heatTarget;
  }

  /** x, y in 0..1 relative to the canvas, y measured from the bottom. */
  setPointer(x: number, y: number, active: boolean) {
    this.mouse.x = x;
    this.mouse.y = y;
    this.mouse.amtTarget = active ? 1 : 0;
  }

  play() {
    if (this.running) return;
    this.running = true;
    this.raf = requestAnimationFrame(this.tick);
  }

  pause() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private tick = (now: number) => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.tick);
    if (this.minFrame && now - this.last < this.minFrame) return;
    this.last = now;
    this.heat += (this.heatTarget - this.heat) * 0.08;
    this.mouse.amt += (this.mouse.amtTarget - this.mouse.amt) * 0.06;
    this.draw(now);
  };

  private draw(now: number) {
    const gl = this.gl;
    gl.uniform2f(this.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.uTime, (now - this.start) / 1000);
    gl.uniform1f(this.uHeat, this.heat);
    gl.uniform2f(this.uMouse, this.mouse.x, this.mouse.y);
    gl.uniform1f(this.uMouseAmt, this.mouse.amt);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  destroy() {
    this.pause();
    this.io.disconnect();
    this.ro.disconnect();
    document.removeEventListener('visibilitychange', this.onVisibility);
  }
}
