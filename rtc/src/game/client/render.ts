/** Canvas renderer. Reads simulation state; never changes it. */
import { FLOOR_BOT, FLOOR_TOP, VIEW_H, VIEW_W, tileIndex, type Actor, type Sim, type SimEvent } from "../sim/sim";
import { FIGHTERS } from "../data/roster";
import { BOSSES, ENEMIES } from "../data/world";
import ATLAS_META from "./atlas-meta.json";
import { asset } from "./assets";

interface AtlasMeta { cell: [number, number]; anchor: [number, number]; height: number; anims: Record<string, { row: number; n: number }> }
const META = ATLAS_META as unknown as Record<string, AtlasMeta>;

/** Roadside billboards per substage (world x). Cosmetic only: the simulation never sees them. */
const BILLBOARD_ART = ["odumodu", "wizkid"] as const;
const BILLBOARDS: Record<string, { x: number; art: (typeof BILLBOARD_ART)[number] }[]> = {
  "01A": [{ x: 380, art: "odumodu" }, { x: 1450, art: "wizkid" }],
  "01B": [{ x: 520, art: "wizkid" }, { x: 1700, art: "odumodu" }],
  "01C": [{ x: 300, art: "odumodu" }, { x: 900, art: "wizkid" }],
  "02A": [{ x: 420, art: "wizkid" }, { x: 1500, art: "odumodu" }],
  "02B": [{ x: 600, art: "odumodu" }, { x: 1600, art: "wizkid" }],
  "02C": [{ x: 260, art: "wizkid" }, { x: 820, art: "odumodu" }],
};
const BB_PARALLAX = 0.7;

export interface Assets { images: Record<string, HTMLImageElement> }

export function assetManifest(stageBg: string, fighterId: string): Record<string, string> {
  const m: Record<string, string> = { [`bg_${stageBg}`]: `/game/bg/${stageBg}.webp` };
  for (const k of Object.keys(META)) m[`atlas_${k}`] = `/game/sprites/${k}.png`;
  for (const b of BILLBOARD_ART) m[`bb_${b}`] = `/game/billboards/${b}.webp`;
  m.boss_gen = "/game/sprites/boss_gen.png";
  m.boss_tower = "/game/sprites/boss_tower.png";
  const p = FIGHTERS[fighterId]?.art.portrait;
  if (p) m[`portrait_${fighterId}`] = p.replace(".png", ".webp");
  return m;
}

export function preload(manifest: Record<string, string>, onProgress: (f: number) => void): Promise<Assets> {
  const keys = Object.keys(manifest);
  const images: Record<string, HTMLImageElement> = {};
  let done = 0;
  return new Promise((resolve) => {
    if (!keys.length) resolve({ images });
    for (const k of keys) {
      const img = new Image();
      const fin = () => { done++; onProgress(done / keys.length); if (done === keys.length) resolve({ images }); };
      img.onload = () => { images[k] = img; fin(); };
      img.onerror = fin;
      img.src = asset(manifest[k]!);
    }
  });
}

interface Fx { kind: "spark" | "ring" | "dust" | "text" | "debris"; x: number; y: number; z: number; t: number; life: number; vx: number; vy: number; color: string; size: number; text?: string }

export class Renderer {
  private g: CanvasRenderingContext2D;
  private fx: Fx[] = [];
  private shake = 0;
  private flash = 0;
  private floor: HTMLCanvasElement;
  slowmo = 0;
  constructor(private canvas: HTMLCanvasElement, private assets: Assets, private night: boolean, private bgKey: string) {
    this.g = canvas.getContext("2d")!;
    this.floor = this.makeFloorTile();
  }

  resize(w: number, h: number, dpr: number) {
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
  }

  private makeFloorTile() {
    const c = document.createElement("canvas");
    c.width = 512; c.height = FLOOR_BOT - FLOOR_TOP + 40;
    const g = c.getContext("2d")!;
    const base = this.night ? "#2a1d17" : "#5f5248";
    g.fillStyle = base; g.fillRect(0, 0, c.width, c.height);
    // seeded speckle and hand-inked cracks for texture
    let s = 7;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 900; i++) { g.fillStyle = r() > 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.12)"; g.fillRect(r() * 512, r() * c.height, 1 + r() * 2, 1 + r()); }
    g.strokeStyle = "rgba(10,10,14,0.55)"; g.lineWidth = 1.4;
    for (let i = 0; i < 6; i++) { g.beginPath(); let x = r() * 512, y = 20 + r() * (c.height - 30); g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += 8 + r() * 26; y += (r() - 0.5) * 12; g.lineTo(x, y); } g.stroke(); }
    return c;
  }

  consume(events: SimEvent[], sim: Sim) {
    for (const e of events) {
      if (e.e === "hit") {
        const n = e.big ? 10 : 6;
        for (let i = 0; i < n; i++) this.fx.push({ kind: "spark", x: e.x, y: e.y, z: e.z, t: 0, life: 12 + Math.random() * 8, vx: (Math.random() - 0.5) * 9, vy: (Math.random() - 0.5) * 7, color: e.team === 0 ? "#FFC93C" : "#FF3B3B", size: 3 + Math.random() * 3 });
        this.fx.push({ kind: "ring", x: e.x, y: e.y, z: e.z, t: 0, life: 10, vx: 0, vy: 0, color: "#ffffff", size: e.big ? 34 : 22 });
        if (e.big) this.flash = 3;
      } else if (e.e === "block") this.fx.push({ kind: "ring", x: e.x, y: e.y, z: 50, t: 0, life: 12, vx: 0, vy: 0, color: "#7cc9ff", size: 26 });
      else if (e.e === "ko") { this.slowmo = Math.max(this.slowmo, sim.enemies.length === 0 ? 24 : 0); for (let i = 0; i < 8; i++) this.dust(e.x, e.y); }
      else if (e.e === "break") for (let i = 0; i < 12; i++) this.fx.push({ kind: "debris", x: e.x, y: e.y, z: 20, t: 0, life: 30, vx: (Math.random() - 0.5) * 8, vy: -2 - Math.random() * 6, color: e.kind === "bag" ? (i % 2 ? "#c81e28" : "#1e46a0") : "#8a5a2b", size: 4 });
      else if (e.e === "shake") this.shake = Math.max(this.shake, e.power);
      else if (e.e === "pickup") this.fx.push({ kind: "text", x: e.x, y: e.y, z: 60, t: 0, life: 40, vx: 0, vy: -1, color: "#3ddc84", size: 16, text: e.kind === "cash" ? "+₦" : e.kind === "token" ? "TOKEN!" : e.kind.toUpperCase() });
    }
  }

  private dust(x: number, y: number) { this.fx.push({ kind: "dust", x: x + (Math.random() - 0.5) * 30, y, z: 4, t: 0, life: 26, vx: (Math.random() - 0.5) * 2, vy: -0.4, color: "rgba(220,210,190,0.5)", size: 8 + Math.random() * 6 }); }

  draw(sim: Sim, viewW: number, viewH: number, dpr: number) {
    const g = this.g;
    const scale = Math.min(viewW / VIEW_W, viewH / VIEW_H);
    const ox = (viewW - VIEW_W * scale) / 2, oy = (viewH - VIEW_H * scale) / 2;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = "#0b0d12"; g.fillRect(0, 0, viewW, viewH);
    let sx = 0, sy = 0;
    if (this.shake > 0) { sx = (Math.random() - 0.5) * this.shake * 22; sy = (Math.random() - 0.5) * this.shake * 22; this.shake = Math.max(0, this.shake - 0.03); }
    g.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * (ox + sx * scale), dpr * (oy + sy * scale));
    g.save(); g.beginPath(); g.rect(0, 0, VIEW_W, VIEW_H); g.clip();
    const cam = sim.camX;
    this.drawBackground(sim, cam);
    this.drawFloor(sim, cam);
    this.drawTelegraphs(sim, cam);
    // depth-sorted world
    const items: { y: number; draw: () => void }[] = [];
    for (const pr of sim.props) if (pr.alive) items.push({ y: pr.y, draw: () => this.drawProp(pr.kind, pr.x - cam, pr.y) });
    for (const k of sim.pickups) if (k.alive) items.push({ y: k.y - 1, draw: () => this.drawPickup(k.kind, k.x - cam, k.y, sim.tick) });
    for (const a of sim.actors) items.push({ y: a.y, draw: () => this.drawActor(a, cam, sim) });
    for (const p of sim.projs) items.push({ y: p.y + 1, draw: () => this.drawProj(p, cam, sim.tick) });
    items.sort((a, b) => a.y - b.y);
    for (const it of items) it.draw();
    this.drawFx(cam);
    if (this.night) { const v = g.createRadialGradient(VIEW_W / 2, VIEW_H * 0.6, 200, VIEW_W / 2, VIEW_H * 0.6, 700); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(25,6,2,0.5)"); g.fillStyle = v; g.fillRect(0, 0, VIEW_W, VIEW_H); }
    if (this.flash > 0) { g.fillStyle = `rgba(255,255,255,${this.flash * 0.12})`; g.fillRect(0, 0, VIEW_W, VIEW_H); this.flash--; }
    g.restore();
  }

  private drawBackground(sim: Sim, cam: number) {
    const g = this.g;
    const img = this.assets.images[`bg_${this.bgKey}`];
    const bgBottom = FLOOR_TOP + 22;
    if (img) {
      const h = bgBottom;
      const w = (img.width / img.height) * h * 1.08;
      const travel = Math.max(1, sim.stage.length - VIEW_W);
      const px = (Math.max(0, w - VIEW_W) * cam) / travel;
      g.drawImage(img, -px, bgBottom - h * 1.08, w, h * 1.08);
      if (this.night && this.bgKey === "wuse") { g.fillStyle = "rgba(40,12,6,0.42)"; g.fillRect(0, 0, VIEW_W, bgBottom); }
      // Warm "war" grade: pull every backdrop toward ember orange so the night neon still reads as fire.
      g.save();
      g.globalCompositeOperation = "color"; g.fillStyle = this.night ? "rgba(190,70,20,0.38)" : "rgba(200,90,30,0.14)"; g.fillRect(0, 0, VIEW_W, bgBottom);
      g.globalCompositeOperation = "soft-light"; g.fillStyle = "rgba(255,120,40,0.35)"; g.fillRect(0, 0, VIEW_W, bgBottom);
      g.restore();
    } else {
      const sky = g.createLinearGradient(0, 0, 0, bgBottom);
      sky.addColorStop(0, this.night ? "#1a0b06" : "#e0744a"); sky.addColorStop(1, this.night ? "#3a160a" : "#ffc56e");
      g.fillStyle = sky; g.fillRect(0, 0, VIEW_W, bgBottom);
    }
    this.drawBillboards(sim, cam, bgBottom);
  }

  private drawBillboards(sim: Sim, cam: number, ground: number) {
    const g = this.g;
    const W = 260, H = 130, top = 58;
    for (const b of BILLBOARDS[sim.stage.id] ?? []) {
      const x = b.x - cam * BB_PARALLAX;
      if (x + W < -20 || x > VIEW_W + 20) continue;
      // posts and catwalk
      g.fillStyle = "#14161C";
      for (const px of [x + W * 0.22, x + W * 0.78]) g.fillRect(px - 5, top + H, 10, ground - top - H - 6);
      g.fillRect(x + W * 0.22 - 22, ground - 10, 44, 8); g.fillRect(x + W * 0.78 - 22, ground - 10, 44, 8);
      g.fillRect(x - 6, top + H + 4, W + 12, 6);
      g.strokeStyle = "#14161C"; g.lineWidth = 2;
      for (let i = 0; i <= 6; i++) { g.beginPath(); g.moveTo(x + (W * i) / 6, top + H + 4); g.lineTo(x + (W * i) / 6, top + H + 16); g.stroke(); }
      g.beginPath(); g.moveTo(x - 6, top + H + 16); g.lineTo(x + W + 6, top + H + 16); g.stroke();
      // panel
      const img = this.assets.images[`bb_${b.art}`];
      g.fillStyle = "#14161C"; g.fillRect(x - 6, top - 6, W + 12, H + 12);
      if (img) g.drawImage(img, x, top, W, H);
      else { g.fillStyle = "#c81e1e"; g.fillRect(x, top, W, H); }
      // lamps throw warm light at night, a soft sheen by day
      const sheen = g.createLinearGradient(x, top, x + W, top + H);
      sheen.addColorStop(0, this.night ? "rgba(255,190,90,0.22)" : "rgba(255,255,255,0.12)");
      sheen.addColorStop(0.5, "rgba(0,0,0,0)"); sheen.addColorStop(1, "rgba(0,0,0,0.25)");
      g.fillStyle = sheen; g.fillRect(x, top, W, H);
      g.fillStyle = "#14161C";
      for (const lx of [x + W * 0.2, x + W * 0.5, x + W * 0.8]) {
        g.fillRect(lx - 1, top - 20, 2, 14); g.fillRect(lx - 9, top - 22, 18, 6);
        if (this.night) { const cone = g.createRadialGradient(lx, top, 2, lx, top + 30, 70); cone.addColorStop(0, "rgba(255,200,110,0.35)"); cone.addColorStop(1, "rgba(255,200,110,0)"); g.fillStyle = cone; g.fillRect(lx - 70, top - 10, 140, 100); g.fillStyle = "#14161C"; }
      }
    }
  }

  private drawFloor(sim: Sim, cam: number) {
    const g = this.g;
    const top = FLOOR_TOP - 10;
    const off = -(cam % 512);
    for (let x = off; x < VIEW_W; x += 512) g.drawImage(this.floor, x, top, 512, VIEW_H - top);
    // kerb stripes and lane dashes, ink outlined
    const k = 26, ko = -(cam % (k * 2));
    for (let x = ko; x < VIEW_W; x += k * 2) { g.fillStyle = "#e9e4d8"; g.fillRect(x, top - 8, k, 8); g.fillStyle = "#14161C"; g.fillRect(x + k, top - 8, k, 8); }
    g.fillStyle = "#14161C"; g.fillRect(0, top, VIEW_W, 2);
    g.fillStyle = this.night ? "rgba(255,201,60,0.35)" : "rgba(255,255,255,0.55)";
    const d = 90, dof = -(cam % d);
    for (let x = dof; x < VIEW_W; x += d) g.fillRect(x, (FLOOR_TOP + FLOOR_BOT) / 2 + 8, 44, 4);
    if (this.night) for (let x = -(cam * 1 % 420); x < VIEW_W; x += 420) { const lg = g.createRadialGradient(x + 200, top + 40, 10, x + 200, top + 40, 170); lg.addColorStop(0, "rgba(255,170,70,0.22)"); lg.addColorStop(1, "rgba(255,170,70,0)"); g.fillStyle = lg; g.fillRect(x, top, 420, VIEW_H - top); }
    void sim;
  }

  private drawTelegraphs(sim: Sim, cam: number) {
    const g = this.g;
    const pulse = 0.25 + 0.25 * Math.sin(sim.tick * 0.5);
    const b = sim.boss;
    if (b && b.kind === "oga_danfo" && b.st === "horn") { g.fillStyle = `rgba(255,59,59,${pulse})`; g.fillRect(0, b.y - 22, VIEW_W, 32); this.chevrons(b.y - 6, b.face, sim.tick); }
    if (b && b.kind === "madam_crescent" && b.st === "rope" && b.t < 40) {
      g.strokeStyle = `rgba(232,69,44,${0.4 + pulse})`; g.lineWidth = 4; g.setLineDash([12, 10]);
      g.beginPath(); g.moveTo(b.x - cam, b.y - 40); g.lineTo(b.x - cam + b.face * 460, b.y - 40); g.stroke(); g.setLineDash([]);
    }
    for (const p of sim.projs) if (p.kind === "bottle") {
      g.strokeStyle = `rgba(255,63,164,${0.5 + pulse})`; g.lineWidth = 3;
      g.beginPath(); g.ellipse(p.tx! - cam, p.ty!, p.w, p.d * 0.5, 0, 0, Math.PI * 2); g.stroke();
    }
    const T = sim.tiles;
    if (T.phase) {
      const tw = VIEW_W / 6, rows = [FLOOR_TOP - 4, (FLOOR_TOP + FLOOR_BOT) / 2], rh = (FLOOR_BOT - FLOOR_TOP) / 2 + 6;
      for (let i = 0; i < 12; i++) {
        const x = T.x0 - cam + (i % 6) * tw, y = rows[Math.floor(i / 6)]!;
        g.fillStyle = T.lit[i] ? (T.phase === "warn" ? `rgba(255,63,164,${0.15 + pulse * 0.4})` : "rgba(255,63,164,0.75)") : "rgba(20,25,40,0.35)";
        g.fillRect(x + 2, y + 2, tw - 4, rh - 4);
        g.strokeStyle = "#14161C"; g.lineWidth = 2; g.strokeRect(x + 2, y + 2, tw - 4, rh - 4);
      }
      void tileIndex;
    }
    const w = sim.hazardWarn;
    if (w && w.t < 60) {
      if (w.kind === "traffic") { g.fillStyle = `rgba(242,194,48,${pulse})`; g.fillRect(0, w.y - 20, VIEW_W, 30); this.text("KEKE!", VIEW_W - 90, w.y - 26, "#F2C230", 22); }
      else { g.fillStyle = `rgba(155,92,255,${pulse})`; g.fillRect(w.x! - cam, FLOOR_TOP - 10, w.w!, FLOOR_BOT - FLOOR_TOP + 20); this.text("BASS DROP", w.x! - cam + 20, FLOOR_TOP - 16, "#b388ff", 18); }
    }
  }

  private chevrons(y: number, dir: number, tick: number) {
    const g = this.g;
    g.fillStyle = "rgba(255,255,255,0.75)";
    for (let i = 0; i < 12; i++) {
      const x = ((i * 90 + tick * 6 * dir) % VIEW_W + VIEW_W) % VIEW_W;
      g.beginPath(); g.moveTo(x, y - 8); g.lineTo(x + 14 * dir, y); g.lineTo(x, y + 8); g.closePath(); g.fill();
    }
  }

  private text(s: string, x: number, y: number, color: string, size: number) {
    const g = this.g;
    g.font = `italic 900 ${size}px "Inter Tight", system-ui, sans-serif`; g.textAlign = "left"; g.textBaseline = "middle";
    g.lineWidth = 5; g.strokeStyle = "#14161C"; g.strokeText(s, x, y); g.fillStyle = color; g.fillText(s, x, y);
  }

  private shadow(x: number, y: number, w: number) {
    const g = this.g;
    g.fillStyle = "rgba(0,0,0,0.35)"; g.beginPath(); g.ellipse(x, y + 2, w, w * 0.28, 0, 0, Math.PI * 2); g.fill();
  }

  private drawActor(a: Actor, cam: number, sim: Sim) {
    const g = this.g;
    const x = a.x - cam, y = a.y;
    if (x < -160 || x > VIEW_W + 160) return;
    const boss = a.boss ? BOSSES[a.kind] : null;
    const scale = boss ? 1.45 : a.def?.id === "bouncer" ? 1.25 : 1;
    this.shadow(x, y, 22 * scale);
    if (a.st === "dead" && Math.floor(a.t / 4) % 2) return;
    g.save();
    if (a.inv > 0 && a.team === 0 && Math.floor(a.inv / 4) % 2 && a.st !== "ability") g.globalAlpha = 0.45;
    if (a.distracted > 0) this.text("📱", x - 8, y - 112 * scale - a.z, "#fff", 18);
    const atlas = a.team === 0 ? FIGHTERS[a.kind]?.art.atlas : a.def?.atlas;
    const img = atlas ? this.assets.images[`atlas_${atlas}`] : undefined;
    if (img && META[atlas!]) this.drawAtlas(img, META[atlas!]!, a, x, y, scale);
    else this.drawFigure(a, x, y, scale, boss?.colors ?? (a.team === 0 ? FIGHTERS[a.kind]!.colors : ENEMIES[a.kind]?.colors ?? { primary: "#555", secondary: "#222", skin: "#4a2b1d" }));
    if (a.flash > 0) { g.globalCompositeOperation = "lighter"; g.globalAlpha = 0.5; g.fillStyle = "#fff"; g.beginPath(); g.ellipse(x, y - 45 * scale - a.z, 22 * scale, 46 * scale, 0, 0, Math.PI * 2); g.fill(); }
    g.restore();
    if (a.team === 1 && (a.st === "wind" || (a.boss && a.st === "horn"))) this.text("!", x - 6, y - 120 * scale - a.z, "#FF3B3B", 30);
    if (a.boss && a.vuln > 1) this.text(a.kind === "oga_danfo" ? "DAZED" : "POSE!", x - 30, y - 150 * scale, "#FFC93C", 20);
    if (a.weapon) this.drawPickup(a.weapon.kind, x + a.face * 24, y - 50 - a.z, sim.tick, true);
  }

  private drawAtlas(img: HTMLImageElement, m: AtlasMeta, a: Actor, x: number, y: number, scale: number) {
    const g = this.g;
    let anim = "run", t = ((a.t * 0.07) % 1 + 1) % 1;
    const A = m.anims;
    if (a.st === "atk" || a.st === "strike" || a.st === "grab") { anim = A.combo ? "combo" : A.attack ? "attack" : A.shoot ? "shoot" : "run"; t = Math.min(0.99, a.aux / 24 + (a.move === "fin" || a.move === "blitz" ? 0.5 : 0)); }
    else if (a.st === "wind") { anim = A.attack ? "attack" : "run"; t = 0.1; }
    else if (a.st === "air" || (a.st === "ability" && a.z > 0)) { anim = A.jump ? "jump" : "run"; t = Math.min(0.99, a.t / 40); }
    else if (a.st === "ability") { anim = A.shoot ? "shoot" : "run"; t = Math.min(0.99, a.t / 24); }
    else if (a.st === "idle" || a.st === "block") t = 0;
    const an = A[anim] ?? A.run!;
    const f = Math.min(an.n - 1, Math.floor(t * an.n));
    const hgt = 112 * scale;
    const s = hgt / m.height;
    g.save();
    g.translate(x, y - a.z);
    if (a.st === "down" || a.st === "dead") g.rotate(-a.face * 1.35);
    else if (a.st === "hurt" || a.st === "grabbed") g.rotate(-a.face * 0.2);
    g.scale(a.face * s, s);
    g.imageSmoothingEnabled = false;
    g.drawImage(img, f * m.cell[0], an.row * m.cell[1], m.cell[0], m.cell[1], -m.anchor[0], -m.anchor[1], m.cell[0], m.cell[1]);
    g.restore();
    if (a.st === "block") { g.strokeStyle = "rgba(124,201,255,0.8)"; g.lineWidth = 3; g.beginPath(); g.arc(x + a.face * 18, y - 56, 34, -1, 1); g.stroke(); }
  }

  /** Inked comic figure used until a fighter's hand-drawn animation set is delivered. */
  private drawFigure(a: Actor, x: number, y: number, s: number, c: { primary: string; secondary: string; skin: string }) {
    const g = this.g;
    const ph = a.t * 0.32;
    const walking = a.st === "walk" || a.st === "run";
    const lying = a.st === "down" || a.st === "dead";
    g.save();
    g.translate(x, y - a.z);
    if (lying) g.rotate(-a.face * 1.4);
    else if (a.st === "hurt") g.rotate(-a.face * 0.22);
    g.scale(a.face * s, s);
    const ink = "#14161C";
    const limb = (x0: number, y0: number, x1: number, y1: number, w: number, col: string) => {
      g.lineCap = "round"; g.strokeStyle = ink; g.lineWidth = w + 5; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    };
    const sw = walking ? Math.sin(ph) * 14 : 0;
    const air = a.z > 2;
    // legs
    limb(-6, -50, air ? -14 : -6 - sw, air ? -22 : -2, 11, c.secondary);
    limb(6, -50, air ? 16 : 6 + sw, air ? -30 : -2, 11, c.secondary);
    // torso
    g.fillStyle = c.primary; g.strokeStyle = ink; g.lineWidth = 4;
    g.beginPath(); g.moveTo(-16, -92); g.quadraticCurveTo(0, -100, 16, -92); g.lineTo(13, -48); g.lineTo(-13, -48); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = "rgba(0,0,0,0.18)"; g.beginPath(); g.moveTo(4, -95); g.lineTo(16, -92); g.lineTo(13, -48); g.lineTo(4, -48); g.closePath(); g.fill();
    // arms: punch extends the front arm
    const atk = a.st === "atk" || a.st === "strike" || (a.st === "ability" && a.t < 16);
    const ext = atk ? 1 : 0;
    limb(-10, -86, -18 + Math.cos(ph) * (walking ? 8 : 0), -58, 9, c.primary);
    limb(10, -86, 10 + 30 * ext + (a.st === "block" ? 6 : 0), -78 + (atk ? 0 : 22) - (a.st === "block" ? 14 : 0), 9, c.primary);
    g.fillStyle = c.skin; g.strokeStyle = ink; g.lineWidth = 3;
    g.beginPath(); g.arc(10 + 30 * ext + (a.st === "block" ? 6 : 0), -78 + (atk ? 0 : 22) - (a.st === "block" ? 14 : 0), 6, 0, Math.PI * 2); g.fill(); g.stroke();
    // head
    g.fillStyle = c.skin; g.lineWidth = 4;
    g.beginPath(); g.arc(2, -108, 13, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = c.secondary; g.beginPath(); g.arc(2, -112, 13, Math.PI * 1.05, Math.PI * 1.95); g.fill();
    g.fillStyle = "#fff"; g.fillRect(8, -110, 5, 2.5);
    if (a.st === "ability") { g.globalCompositeOperation = "lighter"; g.fillStyle = "rgba(255,201,60,0.35)"; g.beginPath(); g.arc(0, -60, 60, 0, Math.PI * 2); g.fill(); }
    g.restore();
  }

  private drawProp(kind: string, x: number, y: number) {
    const g = this.g;
    if (x < -80 || x > VIEW_W + 80) return;
    this.shadow(x, y, 26);
    g.save(); g.translate(x, y); g.strokeStyle = "#14161C"; g.lineWidth = 3;
    if (kind === "bag") {
      g.fillStyle = "#f2efe6"; g.fillRect(-26, -38, 52, 38);
      g.fillStyle = "rgba(200,30,40,0.75)"; for (let i = -26; i < 26; i += 12) g.fillRect(i, -38, 5, 38);
      g.fillStyle = "rgba(30,70,160,0.6)"; for (let j = -38; j < 0; j += 10) g.fillRect(-26, j, 52, 3);
      g.strokeRect(-26, -38, 52, 38); g.beginPath(); g.arc(-8, -38, 7, Math.PI, 0); g.arc(8, -38, 7, Math.PI, 0); g.stroke();
    } else if (kind === "crate") {
      g.fillStyle = "#a8743a"; g.fillRect(-26, -44, 52, 44); g.strokeRect(-26, -44, 52, 44);
      g.beginPath(); g.moveTo(-26, -44); g.lineTo(26, 0); g.moveTo(26, -44); g.lineTo(-26, 0); g.stroke();
    } else {
      g.fillStyle = "#2c6db5"; g.fillRect(-24, -34, 48, 34); g.fillStyle = "#f2f2f2"; g.fillRect(-24, -42, 48, 9);
      g.strokeRect(-24, -42, 48, 42);
    }
    g.restore();
  }

  private drawPickup(kind: string, x: number, y: number, tick: number, held = false) {
    const g = this.g;
    if (x < -40 || x > VIEW_W + 40) return;
    const bob = held ? 0 : Math.sin(tick * 0.12) * 3;
    g.save(); g.translate(x, y - 14 - bob); g.strokeStyle = "#14161C"; g.lineWidth = 3;
    if (!held) { g.fillStyle = "rgba(255,201,60,0.22)"; g.beginPath(); g.arc(0, 0, 20, 0, Math.PI * 2); g.fill(); }
    if (kind === "suya") { g.rotate(-0.5); g.fillStyle = "#d8b47a"; g.fillRect(-16, -1, 32, 3); g.fillStyle = "#7b3415"; for (let i = -10; i <= 10; i += 7) { g.fillRect(i - 3, -5, 7, 10); g.strokeRect(i - 3, -5, 7, 10); } }
    else if (kind === "jollof") { g.fillStyle = "#f5f5f0"; g.beginPath(); g.ellipse(0, 4, 16, 6, 0, 0, Math.PI * 2); g.fill(); g.stroke(); g.fillStyle = "#d9501c"; g.beginPath(); g.ellipse(0, 1, 12, 7, 0, Math.PI, 0); g.fill(); g.stroke(); }
    else if (kind === "cash") { g.fillStyle = "#2e8b57"; g.fillRect(-14, -8, 28, 16); g.strokeRect(-14, -8, 28, 16); this.text("₦", -5, 0, "#fff", 12); }
    else if (kind === "token") { g.fillStyle = "#FFC93C"; g.beginPath(); g.arc(0, 0, 11, 0, Math.PI * 2); g.fill(); g.stroke(); g.fillStyle = "#00A862"; g.fillRect(-3, -6, 6, 12); }
    else if (kind === "pipe") { g.rotate(-0.8); g.fillStyle = "#8a8f98"; g.fillRect(-22, -3, 44, 6); g.strokeRect(-22, -3, 44, 6); }
    else if (kind === "bottle") { g.rotate(-0.4); g.fillStyle = "#3a7d3a"; g.fillRect(-5, -14, 10, 24); g.strokeRect(-5, -14, 10, 24); }
    g.restore();
  }

  private drawProj(p: { kind: string; x: number; y: number; z: number; vx: number; w: number; d: number; life: number }, cam: number, tick: number) {
    const g = this.g;
    const x = p.x - cam;
    if (p.kind === "bottle") { const fall = Math.max(0, p.life) / 55; this.drawPickup("bottle", x, p.y - fall * 160, tick, true); return; }
    g.save(); g.translate(x, p.y - p.z);
    if (p.kind === "flyer") { g.rotate(tick * 0.4); g.fillStyle = "#f5f1e6"; g.fillRect(-9, -6, 18, 12); g.fillStyle = "#8a4dff"; g.fillRect(-9, -6, 18, 4); }
    else if (p.kind === "keke") {
      g.scale(Math.sign(p.vx) || 1, 1);
      g.fillStyle = "#F2C230"; g.strokeStyle = "#14161C"; g.lineWidth = 4;
      g.beginPath(); g.roundRect(-46, -58, 92, 46, 10); g.fill(); g.stroke();
      g.fillStyle = "#00A862"; g.fillRect(-46, -30, 92, 6);
      g.fillStyle = "#14161C"; for (const wx of [-30, 30]) { g.beginPath(); g.arc(wx, -10, 10, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = "rgba(255,240,180,0.6)"; g.beginPath(); g.moveTo(46, -40); g.lineTo(140, -60); g.lineTo(140, -10); g.closePath(); g.fill();
    } else if (p.kind.startsWith("summon_")) {
      g.globalCompositeOperation = "lighter";
      const grd = g.createLinearGradient(-80, 0, 80, 0); grd.addColorStop(0, "rgba(255,201,60,0)"); grd.addColorStop(0.5, "rgba(255,201,60,0.6)"); grd.addColorStop(1, "rgba(255,201,60,0)");
      g.fillStyle = grd; g.fillRect(-80, -p.d, 160, p.d * 1.6);
      for (let i = 0; i < 5; i++) { g.fillStyle = "rgba(255,255,255,0.6)"; g.beginPath(); g.arc(-40 + i * 20, -60 + (i % 2) * 30, 10, 0, Math.PI * 2); g.fill(); }
    } else {
      g.globalCompositeOperation = "lighter";
      const col = FIGHTERS[p.kind]?.colors.primary ?? "#FFC93C";
      g.fillStyle = col; g.globalAlpha = 0.85; g.beginPath(); g.ellipse(0, 0, p.w, p.d * 0.8, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#fff"; g.globalAlpha = 0.7; g.beginPath(); g.ellipse(0, 0, p.w * 0.4, p.d * 0.3, 0, 0, Math.PI * 2); g.fill();
    }
    g.restore();
  }

  private drawFx(cam: number) {
    const g = this.g;
    for (const f of this.fx) {
      f.t++; f.x += f.vx; f.y += f.vy;
      const a = 1 - f.t / f.life;
      const x = f.x - cam, y = f.y - f.z;
      g.globalAlpha = Math.max(0, a);
      if (f.kind === "spark") {
        g.strokeStyle = f.color; g.lineWidth = f.size; g.lineCap = "round";
        g.beginPath(); g.moveTo(x, y); g.lineTo(x - f.vx * 2, y - f.vy * 2); g.stroke();
      } else if (f.kind === "ring") {
        g.strokeStyle = f.color; g.lineWidth = 4 * a + 1;
        g.beginPath();
        for (let i = 0; i < 10; i++) { const r = (i % 2 ? 0.55 : 1) * f.size * (1 + f.t / f.life); const ang = (i / 10) * Math.PI * 2; g.lineTo(x + Math.cos(ang) * r, y + Math.sin(ang) * r); }
        g.closePath(); g.stroke();
      } else if (f.kind === "dust") { g.fillStyle = f.color; g.beginPath(); g.arc(x, y, f.size * (1 + f.t / f.life), 0, Math.PI * 2); g.fill(); }
      else if (f.kind === "debris") { f.vy += 0.4; g.fillStyle = f.color; g.fillRect(x, y, f.size, f.size); }
      else if (f.kind === "text" && f.text) this.text(f.text, x - 20, y, f.color, f.size);
    }
    g.globalAlpha = 1;
    this.fx = this.fx.filter((f) => f.t < f.life);
  }
}
