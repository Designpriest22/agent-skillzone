/**
 * SnowToEmber — the page's signature effect.
 *
 * Snow drifts down from the top (Christmas, the snow on the logo); embers rise
 * from the fire below. A "melt line" rises with `heat`: any snowflake that
 * falls beneath it ignites and turns into an ember. Scroll into the heat and
 * the whole field turns to fire.
 *
 * Canvas 2D with pre-rendered sprites: no shadowBlur, no per-frame gradients.
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  a: number;
  life: number;
  kind: 0 | 1; // 0 snow, 1 ember
  seed: number;
  ignite: number; // 0..1 flash when a flake turns to an ember
}

export interface ParticleOptions {
  heat?: number;
  /** Allow snow at all (the closing section is embers only). */
  snow?: boolean;
  density?: number;
}

function sprite(size: number, stops: [number, string][]) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [o, col] of stops) grad.addColorStop(o, col);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

export class SnowToEmber {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private ps: Particle[] = [];
  private w = 0;
  private h = 0;
  private dpr = 1;
  private raf = 0;
  private running = false;
  private visible = false;
  private last = 0;
  private t = 0;
  private io: IntersectionObserver;
  private ro: ResizeObserver;
  private snowSprite: HTMLCanvasElement;
  private emberSprite: HTMLCanvasElement;
  private hotSprite: HTMLCanvasElement;
  private allowSnow: boolean;
  private count: number;

  heat: number;
  private heatTarget: number;
  private boost = 0;

  constructor(canvas: HTMLCanvasElement, opts: ParticleOptions = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true })!;
    this.heat = this.heatTarget = opts.heat ?? 0.3;
    this.allowSnow = opts.snow ?? true;

    const small = window.innerWidth < 768;
    this.count = Math.round((small ? 70 : 150) * (opts.density ?? 1));
    this.dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75);

    this.snowSprite = sprite(32, [
      [0, 'rgba(255,255,255,1)'],
      [0.35, 'rgba(255,250,244,.75)'],
      [1, 'rgba(255,250,244,0)'],
    ]);
    this.emberSprite = sprite(48, [
      [0, 'rgba(255,240,200,1)'],
      [0.18, 'rgba(255,170,70,.95)'],
      [0.45, 'rgba(255,90,26,.35)'],
      [1, 'rgba(255,60,20,0)'],
    ]);
    this.hotSprite = sprite(64, [
      [0, 'rgba(255,255,240,1)'],
      [0.25, 'rgba(255,200,110,.8)'],
      [1, 'rgba(255,120,40,0)'],
    ]);

    this.resize();
    for (let i = 0; i < this.count; i++) this.ps.push(this.spawn(true));

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    this.io = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
      this.visible ? this.play() : this.pause();
    });
    this.io.observe(canvas);
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  private resize() {
    const r = this.canvas.getBoundingClientRect();
    this.w = Math.max(1, r.width);
    this.h = Math.max(1, r.height);
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  private onVisibility = () => {
    if (document.hidden) this.pause();
    else if (this.visible) this.play();
  };

  private emberChance() {
    return this.allowSnow ? 0.22 + this.heat * 0.78 : 1;
  }

  private spawn(initial = false): Particle {
    const ember = Math.random() < this.emberChance();
    const seed = Math.random() * 1000;
    if (ember) {
      return {
        x: Math.random() * this.w,
        y: initial ? Math.random() * this.h : this.h + 10 + Math.random() * 40,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -(0.6 + Math.random() * 1.5),
        r: 0.8 + Math.random() * 1.8,
        a: 0.6 + Math.random() * 0.4,
        life: 1,
        kind: 1,
        seed,
        ignite: 0,
      };
    }
    return {
      x: Math.random() * this.w,
      y: initial ? Math.random() * this.h * 0.7 : -10 - Math.random() * 40,
      vx: (Math.random() - 0.5) * 0.25,
      vy: 0.35 + Math.random() * 0.7,
      r: 1 + Math.random() * 1.9,
      a: 0.35 + Math.random() * 0.5,
      life: 1,
      kind: 0,
      seed,
      ignite: 0,
    };
  }

  setHeat(v: number, immediate = false) {
    this.heatTarget = Math.min(1, Math.max(0, v));
    if (immediate) this.heat = this.heatTarget;
  }

  /** Scroll velocity, normalised 0..1. Makes embers surge as you scroll. */
  setBoost(v: number) {
    this.boost = Math.max(this.boost, Math.min(1, Math.abs(v)));
  }

  play() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  pause() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private tick = (now: number) => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.tick);
    const dt = Math.min(3, (now - this.last) / 16.667);
    this.last = now;
    this.t += dt * 0.016;
    this.heat += (this.heatTarget - this.heat) * 0.06 * dt;
    this.boost *= Math.pow(0.92, dt);
    this.step(dt);
    this.draw();
  };

  private step(dt: number) {
    const { w, h } = this;
    // The melt line rises with heat: below it, snow ignites.
    const meltY = h * (1 - (0.16 + this.heat * 0.8));
    const lift = 0.7 + this.heat * 0.9 + this.boost * 3.2;

    for (let i = 0; i < this.ps.length; i++) {
      const p = this.ps[i];
      if (p.kind === 0) {
        p.x += (p.vx + Math.sin(this.t * 2 + p.seed) * 0.35) * dt;
        p.y += p.vy * dt;
        if (p.y > meltY) {
          // Ignite: the flake becomes an ember and turns back up.
          p.kind = 1;
          p.ignite = 1;
          p.vy = -(0.4 + Math.random() * 1.1);
          p.vx = (Math.random() - 0.5) * 0.8;
          p.a = 0.9;
          p.r = Math.max(0.9, p.r * 0.85);
        }
      } else {
        const turb = Math.sin(this.t * 3 + p.seed) * 0.5 + Math.cos(this.t * 1.7 + p.seed * 0.5) * 0.3;
        p.x += (p.vx + turb) * dt;
        p.y += p.vy * lift * dt;
        p.life -= 0.0022 * dt * (1.2 - this.heat * 0.4);
        p.ignite = Math.max(0, p.ignite - 0.035 * dt);
      }

      const gone = p.y < -30 || p.y > h + 60 || p.x < -40 || p.x > w + 40 || p.life <= 0;
      if (gone) this.ps[i] = this.spawn();
    }
  }

  private draw() {
    const { ctx, w, h } = this;
    ctx.clearRect(0, 0, w, h);

    // Snow first (normal blending).
    ctx.globalCompositeOperation = 'source-over';
    for (const p of this.ps) {
      if (p.kind !== 0) continue;
      const s = p.r * 4;
      ctx.globalAlpha = p.a;
      ctx.drawImage(this.snowSprite, p.x - s / 2, p.y - s / 2, s, s);
    }

    // Embers (additive).
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.ps) {
      if (p.kind !== 1) continue;
      const flicker = 0.75 + Math.sin(this.t * 14 + p.seed) * 0.25;
      const topFade = Math.min(1, p.y / (h * 0.18));
      ctx.globalAlpha = Math.max(0, p.a * p.life * flicker * topFade);
      const s = p.r * 7;
      ctx.drawImage(this.emberSprite, p.x - s / 2, p.y - s / 2, s, s);
      if (p.ignite > 0) {
        const hs = p.r * 14 * p.ignite + 4;
        ctx.globalAlpha = p.ignite * 0.8;
        ctx.drawImage(this.hotSprite, p.x - hs / 2, p.y - hs / 2, hs, hs);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  destroy() {
    this.pause();
    this.io.disconnect();
    this.ro.disconnect();
    document.removeEventListener('visibilitychange', this.onVisibility);
  }
}
