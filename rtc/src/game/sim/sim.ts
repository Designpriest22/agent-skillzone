/**
 * Deterministic game simulation. Pure TypeScript with no DOM, no clock, no Math.random.
 * The browser runs it at a fixed 60 Hz for play; the server re-runs it from the recorded
 * input log to verify every score before awarding XP, Capital Cash or leaderboard places.
 */
import { FIGHTERS, fighterTuning, type Ability, type Fighter } from "../data/roster";
import { BOSSES, ENEMIES, EQUIPMENT, SUBSTAGES, type EquipmentId, type EnemyDef, type Substage } from "../data/world";
import { B, mulberry32 } from "./input";

export const VIEW_W = 960;
export const VIEW_H = 540;
export const FLOOR_TOP = 396;
export const FLOOR_BOT = 524;
export const TPS = 60;

export type State =
  | "idle" | "walk" | "run" | "atk" | "air" | "hurt" | "down" | "getup" | "block" | "dodge"
  | "grab" | "grabbed" | "thrown" | "ability" | "dead" | "wind" | "strike" | "recover"
  | "charge" | "dazed" | "booth" | "descend" | "pose" | "rope" | "toss" | "horn";

interface Move { s: number; a: number; r: number; dmg: number; kb: number; stun: number; rx: [number, number]; ry: number; launch?: boolean; next?: string; air?: boolean; armorBreak?: boolean; travel?: number; behind?: boolean }

export const MOVES: Record<string, Move> = {
  j1: { s: 3, a: 3, r: 9, dmg: 6, kb: 1.2, stun: 16, rx: [6, 46], ry: 16, next: "j2" },
  j2: { s: 3, a: 3, r: 10, dmg: 7, kb: 1.4, stun: 16, rx: [6, 48], ry: 16, next: "j3" },
  j3: { s: 4, a: 3, r: 12, dmg: 8, kb: 1.8, stun: 18, rx: [6, 50], ry: 16, next: "fin" },
  fin: { s: 6, a: 4, r: 18, dmg: 14, kb: 7, stun: 30, launch: true, rx: [4, 58], ry: 18 },
  back: { s: 4, a: 4, r: 14, dmg: 11, kb: 4, stun: 22, rx: [6, 50], ry: 18, behind: true },
  blitz: { s: 6, a: 6, r: 18, dmg: 18, kb: 8, stun: 34, launch: true, rx: [4, 64], ry: 18, travel: 5, armorBreak: true },
  air: { s: 3, a: 12, r: 6, dmg: 11, kb: 4, stun: 22, launch: true, rx: [2, 48], ry: 18, air: true },
  air2: { s: 2, a: 8, r: 6, dmg: 9, kb: 3, stun: 18, rx: [2, 46], ry: 18, air: true },
  knee: { s: 4, a: 2, r: 10, dmg: 8, kb: 0, stun: 24, rx: [0, 42], ry: 22 },
  pipe1: { s: 5, a: 4, r: 13, dmg: 13, kb: 3, stun: 22, rx: [6, 76], ry: 18, next: "pipe2" },
  pipe2: { s: 6, a: 4, r: 18, dmg: 17, kb: 8, stun: 30, launch: true, rx: [6, 80], ry: 18 },
  bottle: { s: 4, a: 3, r: 12, dmg: 14, kb: 4, stun: 24, rx: [6, 58], ry: 16, launch: true },
};

export interface Actor {
  id: number;
  team: 0 | 1;
  kind: string;
  boss: boolean;
  x: number; y: number; z: number; vx: number; vy: number; vz: number;
  face: 1 | -1;
  hp: number; maxHp: number;
  st: State; t: number;
  move: string | null; hits: number[]; buffered: number;
  stun: number; inv: number; flash: number;
  grab: number; knees: number;
  weapon: { kind: "pipe" | "bottle"; dur: number } | null;
  distracted: number; slow: number; burn: number;
  cd: number; token: boolean; side: 1 | -1;
  airAtk: number; airJumps: number; running: boolean;
  vuln: number; phase: number; pat: number; aux: number;
  def: EnemyDef | null;
}

export interface Prop { id: number; x: number; y: number; kind: string; drop: string; alive: boolean }
export interface Pickup { id: number; x: number; y: number; z: number; kind: string; alive: boolean }
export interface Proj { id: number; team: 0 | 1 | 2; kind: string; x: number; y: number; z: number; vx: number; vy: number; dmg: number; life: number; w: number; d: number; hit: number[]; launch: boolean; slow: boolean; tx?: number; ty?: number }

export type SimEvent =
  | { e: "hit"; x: number; y: number; z: number; dmg: number; big: boolean; team: number }
  | { e: "block"; x: number; y: number }
  | { e: "ko"; x: number; y: number; kind: string }
  | { e: "break"; x: number; y: number; kind: string }
  | { e: "pickup"; x: number; y: number; kind: string }
  | { e: "wave" | "go" | "clear" | "fail" | "lifelost" }
  | { e: "boss"; id: string; line: string }
  | { e: "ability"; who: string; kind: string; name: string; ult: boolean; x: number; y: number }
  | { e: "shake"; power: number }
  | { e: "shot"; x: number; y: number; z: number; face: number; range: number; last: boolean }
  | { e: "sfx"; name: string }
  | { e: "toast"; text: string };

export interface SimConfig { seed: number; substage: string; fighter: string; equipment?: EquipmentId | null; recordEvents?: boolean }

export interface RunResult {
  substage: string; fighter: string; cleared: boolean; failed: boolean; ticks: number;
  score: number; maxCombo: number; kos: number; damageTaken: number; tokens: number;
  bossDefeated: boolean; rating: "S" | "A" | "B" | "C" | "-";
}

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

export class Sim {
  readonly cfg: SimConfig;
  readonly stage: Substage;
  readonly fighter: Fighter;
  readonly tune: ReturnType<typeof fighterTuning>;
  private rng: () => number;
  private nextId = 1;
  tick = 0;
  actors: Actor[] = [];
  player: Actor;
  props: Prop[] = [];
  pickups: Pickup[] = [];
  projs: Proj[] = [];
  events: SimEvent[] = [];
  camX = 0;
  lock: number | null = null;
  waveIdx = 0;
  waveLive: number[] = [];
  hitstop = 0;
  private pendingAb: { ab: Ability; isUlt: boolean } | null = null;
  score = 0; combo = 0; comboT = 0; maxCombo = 0; kos = 0; dmgTaken = 0; tokens = 0; lives = 2;
  special = 30; ult = 0; equipCD = 0; buffT = 0; buffMul = 1; buffKind = ""; shieldT = 0; smokeT = 0;
  dashT = 0; dashLeft = 0; dashDmg = 0; dashUlt = false;
  ended: "clear" | "fail" | null = null;
  bossId: string | null = null; bossSpawned = false; bossDefeated = false;
  tiles: { lit: boolean[]; phase: "warn" | "active" | null; t: number; x0: number } = { lit: [], phase: null, t: 0, x0: 0 };
  hazardT = 0; hazardWarn: { kind: string; y: number; t: number; x?: number; w?: number } | null = null;
  private prev = 0;
  private tapDir = 0; private tapT = -99;
  private hitCounter = 0;

  constructor(cfg: SimConfig) {
    const stage = SUBSTAGES[cfg.substage];
    const fighter = FIGHTERS[cfg.fighter];
    if (!stage) throw new Error(`unknown substage ${cfg.substage}`);
    if (!fighter) throw new Error(`unknown fighter ${cfg.fighter}`);
    this.cfg = cfg;
    this.stage = stage;
    this.fighter = fighter;
    this.tune = fighterTuning(fighter);
    this.rng = mulberry32(cfg.seed);
    this.player = this.spawn(0, fighter.id, 140, 460, null);
    this.player.maxHp = this.player.hp = this.tune.maxHp;
    for (const b of stage.breakables) this.props.push({ id: this.nextId++, x: b.x, y: b.y, kind: b.kind, drop: b.drop, alive: true });
    this.bossId = stage.boss ?? null;
  }

  private ev(e: SimEvent) { if (this.cfg.recordEvents !== false && this.events.length < 400) this.events.push(e); }

  private spawn(team: 0 | 1, kind: string, x: number, y: number, def: EnemyDef | null): Actor {
    const a: Actor = {
      id: this.nextId++, team, kind, boss: false, x, y, z: 0, vx: 0, vy: 0, vz: 0, face: team === 0 ? 1 : -1,
      hp: def?.hp ?? 100, maxHp: def?.hp ?? 100, st: "idle", t: 0, move: null, hits: [], buffered: -99,
      stun: 0, inv: 0, flash: 0, grab: -1, knees: 0, weapon: null, distracted: 0, slow: 0, burn: 0,
      cd: 30 + Math.floor(this.rng() * 40), token: false, side: this.rng() < 0.5 ? 1 : -1,
      airAtk: 0, airJumps: 0, running: false, vuln: 1, phase: 1, pat: 0, aux: 0, def,
    };
    this.actors.push(a);
    return a;
  }

  private spawnEnemy(kind: string, side: "L" | "R") {
    const def = ENEMIES[kind];
    if (!def) return null;
    const x = side === "R" ? this.camX + VIEW_W + 30 + this.rng() * 80 : this.camX - 30 - this.rng() * 80;
    const y = FLOOR_TOP + 10 + this.rng() * (FLOOR_BOT - FLOOR_TOP - 20);
    return this.spawn(1, kind, x, y, def);
  }

  get enemies() { return this.actors.filter((a) => a.team === 1 && a.st !== "dead"); }
  get boss() { return this.actors.find((a) => a.boss && a.st !== "dead") ?? null; }

  /** Advance one tick with the given input mask. */
  step(mask: number) {
    if (this.ended) return;
    const pressed = mask & ~this.prev;
    this.prev = mask;
    this.tick++;
    if (this.hitstop > 0) { this.hitstop--; this.bufferInput(pressed); return; }
    this.bufferInput(pressed);
    this.updatePlayer(mask, pressed);
    for (const a of this.actors) if (a.team === 1 && a.st !== "dead") (a.boss ? this.updateBoss(a) : this.updateEnemy(a));
    this.updateProjs();
    this.updateHazards();
    this.updateTiles();
    this.updateCamera();
    if (this.comboT > 0 && --this.comboT === 0) this.combo = 0;
    if (this.special < 100) this.special = Math.min(100, this.special + 0.06);
    if (this.buffT > 0) this.buffT--;
    if (this.shieldT > 0) this.shieldT--;
    if (this.smokeT > 0) this.smokeT--;
    if (this.equipCD > 0) this.equipCD--;
    this.actors = this.actors.filter((a) => a.st !== "dead" || a.t < 60);
    for (const a of this.actors) if (a.st === "dead") a.t++;
  }

  private bufferInput(pressed: number) { if (pressed & B.ATTACK) this.player.buffered = this.tick; }

  // ---------------------------------------------------------------- player
  private updatePlayer(mask: number, pressed: number) {
    const p = this.player;
    p.t++;
    if (p.inv > 0) p.inv--;
    if (p.flash > 0) p.flash--;
    const dirX = (mask & B.RIGHT ? 1 : 0) - (mask & B.LEFT ? 1 : 0);
    const dirY = (mask & B.DOWN ? 1 : 0) - (mask & B.UP ? 1 : 0);
    const tapped = pressed & (B.LEFT | B.RIGHT);
    if (tapped) {
      const d = pressed & B.RIGHT ? 1 : -1;
      if (this.tapDir === d && this.tick - this.tapT < 14) p.running = true;
      this.tapDir = d; this.tapT = this.tick;
    }
    if (!dirX) p.running = false;

    switch (p.st) {
      case "dead": return;
      case "hurt": if (--p.stun <= 0) this.toIdle(p); this.physics(p); return;
      case "down": this.physics(p); if (p.z <= 0 && p.t > 50) { p.st = "getup"; p.t = 0; p.inv = 40; } return;
      case "getup": if (p.t > 20) this.toIdle(p); return;
      case "grabbed": if (pressed & (B.ATTACK | B.LEFT | B.RIGHT | B.JUMP)) p.aux++; if (p.aux >= 6 || p.t > 70) { this.release(p); } return;
      case "dodge": {
        const len = this.fighter.passive.id === "slipstream" ? 22 : 16;
        p.x += p.vx; p.y = clamp(p.y + p.vy, FLOOR_TOP, FLOOR_BOT);
        if (this.fighter.passive.id === "phantom") for (const e of this.enemies) if (Math.abs(e.x - p.x) < 20 && Math.abs(e.y - p.y) < 16 && e.stun <= 0) this.stunActor(e, 50);
        if (p.t >= len) this.toIdle(p);
        this.clampPlayer();
        return;
      }
      case "ability": this.updateAbility(p); this.physics(p); this.clampPlayer(); return;
      case "grab": {
        const v = this.actors.find((a) => a.id === p.grab);
        if (!v || v.st !== "grabbed" || p.t > 110) { if (v && v.st === "grabbed") this.release(v); this.toIdle(p); return; }
        v.x = p.x + p.face * 30; v.y = p.y;
        if (pressed & B.ATTACK) {
          p.knees++;
          this.dealHit(p, v, "knee", MOVES.knee!);
          if (p.knees >= 3) this.throwActor(p, v, p.face);
        } else if (pressed & B.GRAB) {
          const dir = (dirX !== 0 ? dirX : p.face) as 1 | -1;
          this.throwActor(p, v, dir);
        }
        return;
      }
      case "atk": this.updateAttack(p, mask, dirX); return;
      case "air": {
        if (pressed & B.ATTACK && p.airAtk < 2) {
          p.move = p.airAtk === 0 ? "air" : "air2"; p.airAtk++; p.hits = []; p.aux = 0;
        }
        if (pressed & B.JUMP && p.airJumps > 0) { p.airJumps--; p.vz = this.tune.jumpV * 0.85; this.ev({ e: "sfx", name: "jump" }); }
        p.x += dirX * this.tune.walk * 1.1;
        p.y = clamp(p.y + dirY * this.tune.walk * 0.5, FLOOR_TOP, FLOOR_BOT);
        if (dirX) p.face = dirX as 1 | -1;
        if (p.move) {
          const mv = MOVES[p.move]!;
          p.aux++;
          if (p.aux > mv.s && p.aux <= mv.s + mv.a) this.activeHitbox(p, mv);
          if (p.aux > mv.s + mv.a + mv.r) p.move = null;
        }
        this.physics(p);
        if (p.z <= 0) { this.toIdle(p); this.ev({ e: "sfx", name: "land" }); }
        this.clampPlayer();
        return;
      }
    }

    // idle / walk / run / block: free to act
    const special = pressed & B.SPECIAL, ult = pressed & B.ULT;
    if (ult && this.ult >= 100) { this.ult = 0; this.startAbility(p, this.fighter.ultimate, true); return; }
    if (special) {
      const ab = this.fighter.special;
      if (this.special >= ab.cost) { this.special -= ab.cost; this.startAbility(p, ab, false); return; }
      if (p.hp > p.maxHp * 0.2) { p.hp -= Math.round(p.maxHp * 0.08); this.startAbility(p, ab, false); return; }
      this.ev({ e: "sfx", name: "nope" });
    }
    if (pressed & B.EQUIP) this.useEquipment(p);
    if (pressed & B.JUMP) {
      p.st = "air"; p.t = 0; p.vz = this.tune.jumpV; p.airAtk = 0; p.move = null; p.airJumps = this.tune.airJumps;
      this.ev({ e: "sfx", name: "jump" });
      return;
    }
    if (pressed & B.DODGE && (dirX || dirY)) {
      const sp = this.fighter.passive.id === "slipstream" ? 6 : 5;
      p.st = "dodge"; p.t = 0; p.inv = 14; p.vx = dirX * sp; p.vy = dirY * sp * 0.6;
      if (dirX) p.face = dirX as 1 | -1;
      if (this.fighter.passive.id === "slipstream") this.special = Math.min(100, this.special + 4);
      this.ev({ e: "sfx", name: "dodge" });
      return;
    }
    if (pressed & B.GRAB && this.tryGrabOrInteract(p)) return;
    if (this.tick - p.buffered <= 8) {
      p.buffered = -99;
      if (p.running) return this.startMove(p, "blitz");
      if (dirX && dirX !== p.face) { p.face = dirX as 1 | -1; return this.startMove(p, "back"); }
      if (p.weapon) return this.startMove(p, p.weapon.kind === "pipe" ? "pipe1" : "bottle");
      return this.startMove(p, "j1");
    }
    if (mask & B.DODGE && !dirX && !dirY) { if (p.st !== "block") { p.st = "block"; p.t = 0; } return; }
    if (dirX || dirY) {
      const sp = this.tune.walk * (p.running ? 1.7 : 1) * (this.buffKind === "speed" && this.buffT > 0 ? this.buffMul : 1);
      p.x += dirX * sp;
      p.y = clamp(p.y + dirY * sp * 0.6, FLOOR_TOP, FLOOR_BOT);
      if (dirX) p.face = dirX as 1 | -1;
      p.st = p.running ? "run" : "walk";
    } else if (p.st !== "idle") { p.st = "idle"; p.t = 0; }
    this.clampPlayer();
  }

  private toIdle(a: Actor) { a.st = "idle"; a.t = 0; a.move = null; a.vx = 0; a.vy = 0; a.aux = 0; }

  private clampPlayer() {
    const p = this.player;
    const min = this.lock !== null ? this.lock + 16 : Math.max(16, this.camX + 16);
    const max = this.lock !== null ? this.lock + VIEW_W - 16 : Math.min(this.stage.length - 16, this.camX + VIEW_W - 16);
    p.x = clamp(p.x, min, max);
  }

  private startMove(p: Actor, move: string) {
    p.st = "atk"; p.t = 0; p.move = move; p.hits = []; p.aux = 0;
    this.ev({ e: "sfx", name: move === "blitz" || move === "fin" ? "heavy" : "swing" });
  }

  private updateAttack(p: Actor, mask: number, dirX: number) {
    const mv = MOVES[p.move!]!;
    p.aux++;
    if (mv.travel && p.aux <= mv.s + mv.a) p.x += p.face * mv.travel;
    if (p.aux > mv.s && p.aux <= mv.s + mv.a) this.activeHitbox(p, mv);
    // Chain cancel: once the active frames start, a buffered press goes straight into the next move.
    if (mv.next && p.aux > mv.s && this.tick - p.buffered <= 8) {
      p.buffered = -99;
      const next = p.weapon && mv.next === "pipe2" ? "pipe2" : mv.next;
      if (dirX && dirX !== p.face) { p.face = dirX as 1 | -1; return this.startMove(p, "back"); }
      return this.startMove(p, next);
    }
    if (p.aux > mv.s + mv.a + mv.r) this.toIdle(p);
    void mask;
    this.clampPlayer();
  }

  private activeHitbox(p: Actor, mv: Move) {
    const dir = mv.behind ? (-p.face as 1 | -1) : p.face;
    if (mv.behind && p.aux === mv.s + 1) p.face = dir;
    for (const e of this.actors) {
      if (e.team === p.team || e.st === "dead" || p.hits.includes(e.id)) continue;
      if (!this.inBox(p, e, mv, p.face)) continue;
      p.hits.push(e.id);
      this.dealHit(p, e, p.move!, mv);
      if (p.weapon && (p.move === "pipe1" || p.move === "pipe2" || p.move === "bottle")) {
        p.weapon.dur -= this.fighter.passive.id === "tinker" ? 0.5 : 1;
        if (p.weapon.dur <= 0) { this.ev({ e: "break", x: p.x, y: p.y, kind: p.weapon.kind }); p.weapon = null; }
      }
    }
    for (const pr of this.props) {
      if (!pr.alive) continue;
      const dx = (pr.x - p.x) * p.face;
      if (dx > mv.rx[0] - 6 && dx < mv.rx[1] + 10 && Math.abs(pr.y - p.y) < mv.ry + 8) this.breakProp(pr);
    }
  }

  private inBox(p: Actor, e: Actor, mv: Move, face: number) {
    const dx = (e.x - p.x) * face;
    const reach = e.boss ? 24 : 0;
    if (dx < mv.rx[0] - reach || dx > mv.rx[1] + reach) return false;
    if (Math.abs(e.y - p.y) > mv.ry + (e.boss ? 10 : 0)) return false;
    if (mv.air) return Math.abs(e.z - p.z) < 70;
    return e.z < 60 || e.st === "thrown";
  }

  /** Player (or ability) hits an enemy. */
  private dealHit(p: Actor, e: Actor, move: string, mv: { dmg: number; kb: number; stun: number; launch?: boolean; armorBreak?: boolean }, abilityMul = 1) {
    if (e.inv > 0 || e.st === "booth") { if (e.st === "booth") this.ev({ e: "block", x: e.x, y: e.y }); return; }
    let dmg = mv.dmg * this.tune.dmgMul * abilityMul;
    if (this.buffKind === "dmg" && this.buffT > 0) dmg *= this.buffMul;
    if (this.fighter.passive.id === "rhythm" && this.tick % 30 < 6) dmg *= 1.25;
    dmg *= e.vuln;
    const launch = !!mv.launch || (this.fighter.passive.id === "heavy_hands" && move === "fin");
    const armorBroken = mv.armorBreak || (this.fighter.passive.id === "heavy_hands" && move === "fin");
    dmg = Math.round(dmg);
    e.hp -= dmg;
    e.flash = 6;
    this.hitCounter++;
    if (this.fighter.passive.id === "spice" && this.hitCounter % 4 === 0) e.burn = 120;
    if (this.fighter.passive.id === "connected" && this.rng() < 0.15) e.distracted = 60;
    this.combo++; this.comboT = 100; this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.score += Math.round(dmg * 10 * (1 + Math.min(this.combo, 60) * 0.05));
    this.special = Math.min(100, this.special + 1.5);
    this.ult = Math.min(100, this.ult + (this.fighter.passive.id === "crowd" ? 2.4 : 1.6));
    this.hitstop = launch ? 5 : 3;
    this.ev({ e: "hit", x: e.x, y: e.y, z: e.z + 50, dmg, big: launch, team: 0 });
    if (launch) this.ev({ e: "shake", power: 0.25 });
    const armored = e.def && e.def.armor > 0 && mv.dmg < e.def.armor && !armorBroken && (e.st === "wind" || e.st === "strike");
    if (e.hp <= 0) return this.koActor(e, p.face);
    if (e.boss) return; // bosses never flinch; their weak windows are the dazed/pose states
    if (armored) return;
    if (launch && !e.boss) { this.knockdown(e, p.face, mv.kb); }
    else { e.st = "hurt"; e.t = 0; e.stun = mv.stun; e.x += p.face * mv.kb; e.token = false; }
  }

  private knockdown(e: Actor, dir: number, kb: number) {
    e.st = "down"; e.t = 0; e.vz = 6; e.z = Math.max(e.z, 1); e.vx = dir * Math.max(3, kb * 0.8); e.token = false;
  }

  private stunActor(e: Actor, ticks: number) { if (e.boss) return; e.st = "hurt"; e.t = 0; e.stun = ticks; e.token = false; }

  private koActor(e: Actor, dir: number) {
    e.hp = 0;
    if (e.boss) {
      e.st = "dead"; e.t = 0; this.bossDefeated = true; this.kos++;
      this.score += 5000;
      const b = BOSSES[e.kind]!;
      this.ev({ e: "boss", id: e.kind, line: b.defeat });
      this.ev({ e: "shake", power: 0.6 });
      for (const o of this.enemies) this.koActor(o, dir);
      this.tiles.phase = null;
      this.ended = "clear";
      this.ev({ e: "clear" });
      return;
    }
    this.knockdown(e, dir, 6);
    e.st = "dead"; e.t = 0;
    this.kos++;
    this.score += e.def?.score ?? 100;
    this.ev({ e: "ko", x: e.x, y: e.y, kind: e.kind });
    if (this.rng() < 0.12) this.pickups.push({ id: this.nextId++, x: e.x, y: e.y, z: 0, kind: this.rng() < 0.5 ? "suya" : "cash", alive: true });
  }

  private tryGrabOrInteract(p: Actor) {
    for (const k of this.pickups) {
      if (!k.alive || Math.abs(k.x - p.x) > 34 || Math.abs(k.y - p.y) > 20) continue;
      this.collect(p, k);
      return true;
    }
    for (const e of this.enemies) {
      if (e.boss || e.st === "down" || e.st === "thrown" || e.z > 10) continue;
      const dx = (e.x - p.x) * p.face;
      if (dx > -4 && dx < 40 && Math.abs(e.y - p.y) < 16) {
        p.st = "grab"; p.t = 0; p.grab = e.id; p.knees = 0;
        e.st = "grabbed"; e.t = 0; e.token = false; e.face = (-p.face) as 1 | -1;
        this.ev({ e: "sfx", name: "grab" });
        return true;
      }
    }
    return false;
  }

  private collect(p: Actor, k: Pickup) {
    k.alive = false;
    const nourish = this.fighter.passive.id === "nourish" ? 1.6 : 1;
    if (k.kind === "suya") p.hp = Math.min(p.maxHp, p.hp + Math.round(16 * nourish));
    else if (k.kind === "jollof") p.hp = Math.min(p.maxHp, p.hp + Math.round(50 * nourish));
    else if (k.kind === "cash") this.score += 500;
    else if (k.kind === "token") { this.tokens++; this.score += 1000; this.ev({ e: "toast", text: "Hidden Capital token found!" }); }
    else if (k.kind === "pipe" || k.kind === "bottle") p.weapon = { kind: k.kind, dur: k.kind === "pipe" ? 8 : 3 };
    this.ev({ e: "pickup", x: k.x, y: k.y, kind: k.kind });
  }

  private breakProp(pr: Prop) {
    pr.alive = false;
    this.score += 50;
    this.ev({ e: "break", x: pr.x, y: pr.y, kind: pr.kind });
    this.pickups.push({ id: this.nextId++, x: pr.x, y: pr.y, z: 0, kind: pr.drop, alive: true });
  }

  private throwActor(p: Actor, v: Actor, dir: 1 | -1) {
    const grappler = this.fighter.passive.id === "grappler";
    p.face = dir; p.grab = -1;
    this.dealHit(p, v, "throw", { dmg: 16 * (grappler ? 1.4 : 1), kb: 0, stun: 0 });
    if (v.hp > 0) { v.st = "thrown"; v.t = 0; v.vx = dir * 7; v.vz = 5; v.z = 10; }
    this.toIdle(p);
    this.ev({ e: "shake", power: 0.3 });
  }

  private release(v: Actor) {
    const g = this.actors.find((a) => a.grab === v.id);
    if (g) { g.grab = -1; this.toIdle(g); }
    this.toIdle(v); v.aux = 0;
    if (v.team === 0) v.inv = 30;
  }

  private useEquipment(p: Actor) {
    const id = this.cfg.equipment;
    if (!id || this.equipCD > 0) return;
    const eq = EQUIPMENT[id];
    this.equipCD = eq.cooldown * (this.fighter.passive.id === "drill" ? 0.5 : 1);
    this.ev({ e: "ability", who: "equip", kind: id, name: eq.name, ult: false, x: p.x, y: p.y });
    if (id === "smoke") { this.smokeT = 180; for (const e of this.enemies) e.token = false; }
    if (id === "firstaid") p.hp = Math.min(p.maxHp, p.hp + 30);
    if (id === "whistle") for (const e of this.enemies) if (Math.abs(e.x - p.x) < 140 && Math.abs(e.y - p.y) < 60 && !e.boss) this.knockdown(e, Math.sign(e.x - p.x) || 1, 6);
    if (id === "pepper") for (const e of this.enemies) { const dx = (e.x - p.x) * p.face; if (dx > 0 && dx < 160 && Math.abs(e.y - p.y) < 40) this.stunActor(e, 120); }
  }

  // ---------------------------------------------------------------- abilities
  private startAbility(p: Actor, ab: Ability, isUlt: boolean) {
    this.pendingAb = null;
    p.st = "ability"; p.t = 0; p.move = ab.kind; p.hits = []; p.inv = isUlt ? 999 : 20;
    this.ev({ e: "ability", who: this.fighter.id, kind: ab.kind, name: ab.name, ult: isUlt, x: p.x, y: p.y });
    this.ev({ e: "shake", power: isUlt ? 0.5 : 0.2 });
    this.hitstop = isUlt ? 12 : 4;
    const tide = this.fighter.passive.id === "tide";
    const hitAll = (filter: (e: Actor) => boolean, dmg: number, launch: boolean) => {
      for (const e of this.enemies) if (filter(e)) { this.dealHit(p, e, "ability", { dmg, kb: 6, stun: 40, launch, armorBreak: true }, 1); if (tide) e.slow = 180; }
    };
    const near = (r: number) => (e: Actor) => Math.abs(e.x - p.x) < r && Math.abs(e.y - p.y) < Math.max(50, r * 0.45);
    switch (ab.kind) {
      case "shockwave": case "projectile": case "burst": this.pendingAb = { ab, isUlt }; break;
      case "dash": this.dashT = 0; this.dashLeft = ab.ticks ?? 1; this.dashDmg = ab.dmg; this.dashUlt = isUlt; p.aux = Math.round(Math.min(ab.range, 400) / 12); break;
      case "buff": this.buffT = ab.ticks ?? 360; this.buffMul = ab.mul ?? 1.4; this.buffKind = this.fighter.id === "corperada" ? "speed" : "dmg"; break;
      case "pull":
        this.pendingAb = { ab, isUlt }; break;
      case "decoy": for (const e of this.enemies) { e.distracted = ab.ticks ?? 120; e.token = false; } if (isUlt) this.pendingAb = { ab, isUlt }; break;
      case "shield": this.shieldT = ab.ticks ?? 50; break;
      case "summon":
        this.projs.push({ id: this.nextId++, team: 0, kind: `summon_${this.fighter.id}`, x: this.camX - 80, y: (FLOOR_TOP + FLOOR_BOT) / 2, z: 0, vx: 16, vy: 0, dmg: ab.dmg, life: 80, w: 70, d: 140, hit: [], launch: true, slow: tide });
        break;
      case "heal": p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * (ab.mul ?? 0.25))); break;
      case "slam": p.vz = 12; p.z = 1; p.aux = ab.range; break;
    }
  }

  /** Specials land on their active frame (tick 9 of the 24-tick animation) so hits match the art. */
  private resolvePending(p: Actor) {
    const pend = this.pendingAb;
    if (!pend) return;
    const { ab, isUlt } = pend;
    const tide = this.fighter.passive.id === "tide";
    const hitAll = (filter: (e: Actor) => boolean, dmg: number, launch: boolean) => {
      for (const e of this.enemies) if (filter(e)) { this.dealHit(p, e, "ability", { dmg, kb: 6, stun: 40, launch, armorBreak: true }, 1); if (tide) e.slow = 180; }
    };
    const near = (r: number) => (e: Actor) => Math.abs(e.x - p.x) < r && Math.abs(e.y - p.y) < Math.max(50, r * 0.45);
    if (ab.kind === "burst") {
      // three rounds on ticks 6, 11 and 16, each hitting the nearest enemy in the lane in front
      const shots = [6, 11, 16];
      const k = shots.indexOf(p.t);
      if (k < 0) return;
      const last = k === shots.length - 1;
      this.ev({ e: "shot", x: p.x, y: p.y, z: 86, face: p.face, range: ab.range, last });
      this.ev({ e: "shake", power: last ? 0.22 : 0.1 });
      let best: Actor | null = null;
      for (const e of this.enemies) {
        const dx = (e.x - p.x) * p.face;
        if (dx > 10 && dx < ab.range && Math.abs(e.y - p.y) < 34 && e.hp > 0 && (!best || dx < (best.x - p.x) * p.face)) best = e;
      }
      if (best) this.dealHit(p, best, "ability", { dmg: ab.dmg / 3, kb: last ? 7 : 2, stun: 30, launch: last, armorBreak: last }, 1);
      if (last) this.pendingAb = null;
      return;
    }
    if (p.t !== 9) return;
    this.pendingAb = null;
    if (ab.kind === "shockwave") { hitAll(near(ab.range), ab.dmg, true); if (ab.ticks) for (const e of this.enemies) e.distracted = ab.ticks; }
    else if (ab.kind === "projectile") this.projs.push({ id: this.nextId++, team: 0, kind: this.fighter.id, x: p.x + p.face * 30, y: p.y, z: 40, vx: p.face * 8, vy: 0, dmg: ab.dmg, life: Math.round(ab.range / 8), w: 30, d: 22, hit: [], launch: true, slow: tide });
    else if (ab.kind === "decoy" && isUlt) hitAll(() => true, ab.dmg, true);
    else if (ab.kind === "pull") {
      for (const e of this.enemies) {
        const dx = (e.x - p.x) * p.face;
        if (!e.boss && dx > 0 && dx < ab.range && Math.abs(e.y - p.y) < 60) { e.x = p.x + p.face * 44; e.y = p.y; this.dealHit(p, e, "ability", { dmg: ab.dmg, kb: 0, stun: 70 }); }
        else if (e.boss && dx > 0 && dx < ab.range) this.dealHit(p, e, "ability", { dmg: ab.dmg, kb: 0, stun: 0 });
      }
    }
  }

  private updateAbility(p: Actor) {
    this.resolvePending(p);
    const kind = p.move;
    if (kind === "dash" && this.dashLeft > 0) {
      p.x += p.face * 12; this.dashT++;
      for (const e of this.enemies) {
        if (p.hits.includes(e.id)) continue;
        if (Math.abs(e.x - p.x) < 40 && Math.abs(e.y - p.y) < 30) { p.hits.push(e.id); this.dealHit(p, e, "ability", { dmg: this.dashDmg / (this.dashUlt ? 2 : 1), kb: 5, stun: 40, launch: true, armorBreak: true }); }
      }
      if (this.dashT >= p.aux) {
        this.dashLeft--; this.dashT = 0; p.hits = [];
        if (this.dashLeft > 0) p.face = (-p.face) as 1 | -1;
      }
      this.clampPlayer();
      if (this.dashLeft <= 0) { p.inv = 10; this.toIdle(p); }
      return;
    }
    if (kind === "slam") {
      if (p.z <= 0 && p.t > 4) {
        for (const e of this.enemies) if (Math.abs(e.x - p.x) < p.aux && Math.abs(e.y - p.y) < 80) this.dealHit(p, e, "ability", { dmg: this.fighter.ultimate.kind === "slam" && p.inv > 100 ? this.fighter.ultimate.dmg : this.fighter.special.dmg, kb: 7, stun: 40, launch: true, armorBreak: true });
        this.ev({ e: "shake", power: 0.6 });
        p.inv = 10; this.toIdle(p);
      }
      return;
    }
    if (kind === "shield") {
      if (p.t > (this.fighter.special.ticks ?? 50)) { p.inv = 0; this.toIdle(p); }
      return;
    }
    if (p.t > 24) { p.inv = Math.min(p.inv, 10); this.toIdle(p); }
  }

  // ---------------------------------------------------------------- damage to the player
  private hurtPlayer(src: Actor | null, dmg: number, launch: boolean, fromX: number) {
    const p = this.player;
    if (this.ended || p.inv > 0 || p.st === "dead" || p.st === "down" || p.st === "getup") return;
    if (this.shieldT > 0) {
      this.shieldT = 0;
      if (src) this.dealHit(p, src, "ability", { dmg: this.fighter.special.dmg, kb: 6, stun: 50, launch: true });
      this.ev({ e: "block", x: p.x, y: p.y }); p.inv = 20; return;
    }
    const facingAttack = Math.sign(fromX - p.x) === p.face || fromX === p.x;
    if (p.st === "block" && facingAttack) {
      const chip = this.fighter.passive.id === "gatekeeper" ? 0 : Math.round(dmg * 0.15);
      p.hp -= chip; this.dmgTaken += chip;
      if (src && this.fighter.passive.id === "gatekeeper") { src.hp -= Math.round(dmg * 0.25); if (src.hp <= 0) this.koActor(src, p.face); }
      p.x -= p.face * 3;
      this.ev({ e: "block", x: p.x, y: p.y });
      return;
    }
    dmg = Math.round(dmg * this.tune.defMul * (this.buffKind === "speed" && this.buffT > 0 ? 0.7 : 1));
    if (p.st === "grab") { const v = this.actors.find((a) => a.id === p.grab); if (v) this.release(v); }
    p.hp -= dmg; this.dmgTaken += dmg; p.flash = 8;
    this.combo = 0; this.comboT = 0;
    this.ult = Math.min(100, this.ult + dmg * 0.6);
    this.ev({ e: "hit", x: p.x, y: p.y, z: 50, dmg, big: launch, team: 1 });
    if (p.hp <= 0) {
      p.hp = 0; this.lives--;
      if (this.lives < 0) { p.st = "dead"; p.t = 0; this.ended = "fail"; this.ev({ e: "fail" }); return; }
      this.ev({ e: "lifelost" });
      p.hp = p.maxHp; this.knockdown(p, Math.sign(p.x - fromX) || -1, 4); p.inv = 150;
      for (const e of this.enemies) if (!e.boss && Math.abs(e.x - p.x) < 200) this.knockdown(e, Math.sign(e.x - p.x) || 1, 5);
      return;
    }
    if (launch) { this.knockdown(p, Math.sign(p.x - fromX) || -1, 4); this.ev({ e: "shake", power: 0.35 }); }
    else { p.st = "hurt"; p.t = 0; p.stun = 18; p.move = null; }
  }

  // ---------------------------------------------------------------- enemies
  private physics(a: Actor) {
    if (a.z > 0 || a.vz > 0) {
      a.vz -= 0.55; a.z += a.vz;
      if (a.z <= 0) { a.z = 0; a.vz = 0; }
    }
    if (a.vx) { a.x += a.vx; a.vx *= a.z > 0 ? 0.98 : 0.8; if (Math.abs(a.vx) < 0.1) a.vx = 0; }
  }

  private updateEnemy(e: Actor) {
    const def = e.def!;
    const p = this.player;
    e.t++;
    if (e.flash > 0) e.flash--;
    if (e.inv > 0) e.inv--;
    if (e.burn > 0) { e.burn--; if (e.burn % 30 === 0) { e.hp -= 3; if (e.hp <= 0) return this.koActor(e, 1); } }
    const slow = e.slow > 0 ? (e.slow--, 0.5) : 1;
    switch (e.st) {
      case "hurt": if (--e.stun <= 0) this.toIdle(e); this.physics(e); return;
      case "down": this.physics(e); if (e.z <= 0 && e.t > 55) { e.st = "getup"; e.t = 0; e.inv = 30; } return;
      case "getup": if (e.t > 24) this.toIdle(e); return;
      case "grabbed": return;
      case "thrown": {
        this.physics(e);
        for (const o of this.enemies) {
          if (o === e || o.st === "down" || Math.abs(o.x - e.x) > 34 || Math.abs(o.y - e.y) > 20) continue;
          this.dealHit(p, o, "throw", { dmg: this.fighter.passive.id === "grappler" ? 18 : 12, kb: 5, stun: 30, launch: true });
        }
        if (e.z <= 0) { e.st = "down"; e.t = 0; }
        return;
      }
    }
    if (e.cd > 0) e.cd--;
    if (e.distracted > 0) { e.distracted--; e.st = "idle"; return; }
    if (p.st === "dead" || this.smokeT > 0) { e.token = false; if (e.st !== "idle") this.toIdle(e); return; }
    const dx = p.x - e.x, dy = p.y - e.y;
    if (e.st !== "wind" && e.st !== "strike" && e.st !== "recover") e.face = dx >= 0 ? 1 : -1;

    if (e.st === "wind") {
      if (e.t >= def.windup) {
        e.st = "strike"; e.t = 0;
        if (def.ranged) {
          this.projs.push({ id: this.nextId++, team: 1, kind: "flyer", x: e.x + e.face * 20, y: e.y, z: 44, vx: e.face * 5, vy: 0, dmg: def.dmg, life: 90, w: 16, d: 14, hit: [], launch: false, slow: false });
        } else {
          const ddx = (p.x - e.x) * e.face;
          if (ddx > -6 && ddx < def.reach + 8 && Math.abs(p.y - e.y) < 18 && p.z < 30) {
            if (def.grabs && this.rng() < 0.4 && p.st !== "block" && p.inv <= 0) {
              p.st = "grabbed"; p.t = 0; p.aux = 0; e.grab = p.id; e.st = "grab"; e.t = 0;
              this.ev({ e: "sfx", name: "grab" });
            } else this.hurtPlayer(e, def.dmg, def.armor > 0, e.x);
          }
        }
      }
      return;
    }
    if (e.st === "grab") {
      if (p.st !== "grabbed") { e.grab = -1; this.toIdle(e); e.cd = def.cooldown; return; }
      p.x = e.x + e.face * 30; p.y = e.y;
      if (e.t % 30 === 15) { p.hp -= 4; this.dmgTaken += 4; this.ev({ e: "hit", x: p.x, y: p.y, z: 50, dmg: 4, big: false, team: 1 }); if (p.hp <= 0) { p.hp = 1; this.release(p); } }
      return;
    }
    if (e.st === "strike") { if (e.t > 10) { e.st = "recover"; e.t = 0; } return; }
    if (e.st === "recover") { if (e.t > 20) { this.toIdle(e); e.cd = def.cooldown + Math.floor(this.rng() * 30); e.token = false; } return; }

    if (def.ranged) {
      const want = 250;
      const tx = p.x - Math.sign(dx || 1) * want;
      this.moveToward(e, tx, p.y, def.speed * slow);
      if (e.cd <= 0 && Math.abs(dy) < 14 && Math.abs(dx) < 420) { e.st = "wind"; e.t = 0; }
      return;
    }
    const tokens = this.enemies.filter((o) => o.token).length;
    if (!e.token && e.cd <= 0 && tokens < 2) e.token = true;
    if (e.token) {
      const tx = p.x - Math.sign(dx || e.side) * (def.reach * 0.75);
      this.moveToward(e, tx, p.y, def.speed * slow);
      if (Math.abs(dx) < def.reach + 4 && Math.abs(dy) < 12) { e.st = "wind"; e.t = 0; this.ev({ e: "sfx", name: "wind" }); }
    } else {
      const off = 130 + (e.id % 3) * 35;
      const tx = p.x - Math.sign(dx || e.side) * off;
      const ty = clamp(p.y + ((e.id % 3) - 1) * 34, FLOOR_TOP, FLOOR_BOT);
      this.moveToward(e, tx, ty, def.speed * 0.7 * slow);
    }
  }

  private moveToward(e: Actor, tx: number, ty: number, sp: number) {
    // Enemies stay inside the fight: in a locked arena they never kite out of the player's reach.
    if (this.lock !== null) tx = clamp(tx, this.lock + 40, this.lock + VIEW_W - 40);
    else tx = clamp(tx, this.camX - 40, this.camX + VIEW_W + 40);
    const dx = tx - e.x, dy = ty - e.y;
    const moving = Math.abs(dx) > 3 || Math.abs(dy) > 3;
    if (Math.abs(dx) > 3) e.x += Math.sign(dx) * Math.min(sp, Math.abs(dx));
    if (Math.abs(dy) > 3) e.y = clamp(e.y + Math.sign(dy) * Math.min(sp * 0.6, Math.abs(dy)), FLOOR_TOP, FLOOR_BOT);
    e.st = moving ? "walk" : "idle";
  }

  // ---------------------------------------------------------------- bosses
  private spawnBoss() {
    const id = this.bossId!;
    const b = BOSSES[id]!;
    const x = this.camX + VIEW_W - 160;
    const a = this.spawn(1, id, x, id === "madam_crescent" ? FLOOR_TOP - 6 : 460, null);
    a.boss = true; a.hp = a.maxHp = b.hp; a.face = -1;
    a.st = id === "madam_crescent" ? "booth" : "idle"; a.cd = 90; a.pat = 0;
    this.bossSpawned = true;
    this.ev({ e: "boss", id, line: b.intro });
    this.ev({ e: "shake", power: 0.5 });
  }

  private updateBoss(b: Actor) {
    b.t++;
    if (b.flash > 0) b.flash--;
    const frac = b.hp / b.maxHp;
    b.phase = frac > 0.66 ? 1 : frac > 0.33 ? 2 : 3;
    if (b.kind === "oga_danfo") this.ogaDanfo(b);
    else this.madamCrescent(b);
  }

  private ogaDanfo(b: Actor) {
    const p = this.player;
    const dx = p.x - b.x;
    const left = (this.lock ?? this.camX) + 70, right = (this.lock ?? this.camX) + VIEW_W - 70;
    b.vuln = b.st === "dazed" ? 2 : 1;
    switch (b.st) {
      case "idle": case "walk": {
        b.face = dx >= 0 ? 1 : -1;
        if (b.cd > 0) b.cd--;
        if (Math.abs(dx) < 70 && Math.abs(p.y - b.y) < 20 && b.cd <= 0) { b.st = "wind"; b.t = 0; b.aux = 0; return; }
        if (b.cd <= 0 && this.rng() < 0.012 * b.phase) {
          b.st = "horn"; b.t = 0; b.aux = b.phase === 3 ? 2 : 1;
          b.x = dx >= 0 ? left : right; b.face = dx >= 0 ? 1 : -1; b.y = p.y;
          this.ev({ e: "sfx", name: "horn" });
          return;
        }
        if (b.phase >= 2 && b.cd <= 0 && this.enemies.length < 4 && this.rng() < 0.004) {
          this.spawnEnemy("tout", "R"); this.spawnEnemy("grunt", "L"); b.cd = 120;
          this.ev({ e: "boss", id: b.kind, line: "Touts! Collect am!" });
        }
        this.moveToward(b, p.x - Math.sign(dx || 1) * 60, p.y, 1.2 + b.phase * 0.2);
        return;
      }
      case "wind": if (b.t >= 18) { const ddx = (p.x - b.x) * b.face; if (ddx > -10 && ddx < 80 && Math.abs(p.y - b.y) < 22) this.hurtPlayer(b, 12, b.aux >= 1, b.x); b.aux++; b.t = 0; if (b.aux >= 2) { b.st = "recover"; b.t = 0; } } return;
      case "recover": if (b.t > 40) { b.st = "idle"; b.t = 0; b.cd = 70; } return;
      case "horn":
        if (b.t === 30 && b.phase >= 2) {
          // horn shockwave: ground-only, jump to avoid
          if (Math.abs(p.x - b.x) < 220 && p.z < 16) this.hurtPlayer(b, 14, true, b.x);
          this.ev({ e: "shake", power: 0.4 });
        }
        if (b.t >= 50) { b.st = "charge"; b.t = 0; this.ev({ e: "sfx", name: "charge" }); }
        return;
      case "charge": {
        b.x += b.face * (b.phase === 3 ? 12 : 9);
        if (Math.abs(p.x - b.x) < 44 && Math.abs(p.y - b.y) < 24 && p.z < 40) this.hurtPlayer(b, 20, true, b.x - b.face * 10);
        for (const e of this.enemies) if (!e.boss && Math.abs(e.x - b.x) < 40 && Math.abs(e.y - b.y) < 24) this.knockdown(e, b.face, 8);
        if ((b.face > 0 && b.x >= right) || (b.face < 0 && b.x <= left)) {
          b.aux--;
          this.ev({ e: "shake", power: 0.5 });
          if (b.aux > 0) { b.face = (-b.face) as 1 | -1; b.y = p.y; b.st = "horn"; b.t = 20; }
          else { b.st = "dazed"; b.t = 0; this.ev({ e: "toast", text: "Oga Danfo is dazed! Punish him!" }); }
        }
        return;
      }
      case "dazed": if (b.t > 110) { b.st = "idle"; b.t = 0; b.cd = 80; } return;
      case "hurt": b.st = "idle"; return;
      default: b.st = "idle";
    }
  }

  private madamCrescent(b: Actor) {
    const p = this.player;
    const dx = p.x - b.x;
    const x0 = this.lock ?? this.camX;
    b.vuln = b.st === "pose" ? 2 : 1;
    switch (b.st) {
      case "booth": {
        b.inv = 0;
        if (b.t % 140 === 60) {
          // bottle toss: telegraphed landing zone at the player's feet
          this.projs.push({ id: this.nextId++, team: 1, kind: "bottle", x: b.x, y: b.y, z: 120, vx: 0, vy: 0, dmg: 14, life: 55, w: 40, d: 24, hit: [], launch: true, slow: false, tx: p.x, ty: p.y });
        }
        const guards = this.enemies.filter((e) => !e.boss).length;
        if (guards === 0) {
          if (b.pat < 2) {
            b.pat++;
            const wave = b.pat === 1 ? ["bouncer", "grunt", "grunt"] : ["bouncer", "bouncer", "tout"];
            for (const k of wave) this.spawnEnemy(k, this.rng() < 0.5 ? "L" : "R");
            this.ev({ e: "boss", id: b.kind, line: b.pat === 1 ? "Security! See this one out." : "I said OUT." });
          } else if (b.t > 60) {
            b.st = "descend"; b.t = 0;
            this.ev({ e: "boss", id: b.kind, line: "If you want something done properly..." });
          }
        }
        return;
      }
      case "descend": b.y += (460 - b.y) * 0.08; if (b.t > 60) { b.y = 460; b.st = "idle"; b.t = 0; b.cd = 60; } return;
      case "idle": case "walk": {
        b.face = dx >= 0 ? 1 : -1;
        if (b.cd > 0) b.cd--;
        if (b.phase === 3 && b.cd <= 0 && this.tiles.phase === null) { this.startLightShow(x0); b.st = "toss"; b.t = 0; b.aux = 2; return; }
        if (b.cd <= 0 && Math.abs(dx) < 80 && Math.abs(p.y - b.y) < 20) { b.st = "wind"; b.t = 0; b.aux = 0; return; }
        if (b.cd <= 0 && Math.abs(dx) > 160 && this.rng() < 0.02) { b.st = "rope"; b.t = 0; b.y = clamp(b.y, FLOOR_TOP, FLOOR_BOT); this.ev({ e: "sfx", name: "rope" }); return; }
        if (b.cd <= 0 && this.enemies.length < 3 && this.rng() < 0.003) { this.spawnEnemy("grunt", "L"); this.spawnEnemy("grunt", "R"); b.cd = 100; this.ev({ e: "boss", id: b.kind, line: "VIP guests, take care of this." }); }
        this.moveToward(b, p.x - Math.sign(dx || 1) * 70, p.y, 1.6);
        return;
      }
      case "wind":
        if (b.t >= 14) {
          const ddx = (p.x - b.x) * b.face;
          if (ddx > -10 && ddx < 86 && Math.abs(p.y - b.y) < 22) this.hurtPlayer(b, 11, b.aux >= 2, b.x);
          b.aux++; b.t = 0;
          if (b.aux >= 3) { b.st = "recover"; b.t = 0; }
        }
        return;
      case "recover": if (b.t > 36) { b.st = "idle"; b.t = 0; b.cd = 50; } return;
      case "rope":
        // telegraph 40 ticks along her lane, then the velvet rope snaps out
        if (b.t === 40) {
          const ddx = (p.x - b.x) * b.face;
          if (ddx > 0 && ddx < 460 && Math.abs(p.y - b.y) < 20 && p.inv <= 0 && p.z < 30) {
            p.x = b.x + b.face * 50; this.hurtPlayer(b, 18, true, b.x);
          }
        }
        if (b.t > 60) { b.st = "idle"; b.t = 0; b.cd = 70; }
        return;
      case "toss":
        if (this.tiles.phase === null) {
          b.aux--;
          if (b.aux > 0) this.startLightShow(x0);
          else { b.st = "pose"; b.t = 0; this.ev({ e: "toast", text: "Madam Crescent is posing. Now!" }); }
        }
        return;
      case "pose": if (b.t > 110) { b.st = "idle"; b.t = 0; b.cd = 120; } return;
      case "hurt": b.st = "idle"; return;
      default: b.st = "idle";
    }
  }

  private startLightShow(x0: number) {
    const lit: boolean[] = [];
    for (let i = 0; i < 12; i++) lit.push(false);
    let n = 0;
    while (n < 7) { const k = Math.floor(this.rng() * 12); if (!lit[k]) { lit[k] = true; n++; } }
    this.tiles = { lit, phase: "warn", t: 0, x0 };
    this.ev({ e: "sfx", name: "lights" });
  }

  private updateTiles() {
    const T = this.tiles;
    if (!T.phase) return;
    T.t++;
    if (T.phase === "warn" && T.t >= 60) { T.phase = "active"; T.t = 0; }
    else if (T.phase === "active") {
      const p = this.player;
      const k = tileIndex(p.x - T.x0, p.y);
      if (k >= 0 && T.lit[k] && p.z < 10 && T.t % 20 === 1) this.hurtPlayer(null, 16, true, p.x - p.face);
      if (T.t >= 40) { T.phase = null; T.t = 0; }
    }
  }

  // ---------------------------------------------------------------- projectiles and hazards
  private updateProjs() {
    for (const pr of this.projs) {
      pr.life--;
      if (pr.kind === "bottle") {
        if (pr.life === 0) {
          const p = this.player;
          if (Math.abs(p.x - pr.tx!) < pr.w && Math.abs(p.y - pr.ty!) < pr.d) this.hurtPlayer(null, pr.dmg, true, pr.tx! - 1);
          this.ev({ e: "break", x: pr.tx!, y: pr.ty!, kind: "bottle" });
        }
        continue;
      }
      pr.x += pr.vx; pr.y += pr.vy;
      if (pr.team === 0) {
        for (const e of this.enemies) {
          if (pr.hit.includes(e.id) || Math.abs(e.x - pr.x) > pr.w || Math.abs(e.y - pr.y) > pr.d) continue;
          pr.hit.push(e.id);
          this.dealHit(this.player, e, "ability", { dmg: pr.dmg, kb: 4, stun: 40, launch: pr.launch, armorBreak: true });
          if (pr.slow) e.slow = 180;
        }
      } else if (pr.team === 1) {
        const p = this.player;
        if (Math.abs(p.x - pr.x) < pr.w && Math.abs(p.y - pr.y) < pr.d && p.z < 50) { this.hurtPlayer(null, pr.dmg, pr.launch, pr.x - pr.vx); pr.life = 0; }
      } else {
        for (const a of this.actors) {
          if (a.st === "dead" || a.boss || pr.hit.includes(a.id) || Math.abs(a.x - pr.x) > pr.w || Math.abs(a.y - pr.y) > pr.d || a.z > 30) continue;
          pr.hit.push(a.id);
          if (a.team === 0) this.hurtPlayer(null, pr.dmg, true, pr.x - pr.vx);
          else { a.hp -= pr.dmg; if (a.hp <= 0) this.koActor(a, Math.sign(pr.vx) || 1); else this.knockdown(a, Math.sign(pr.vx) || 1, 8); }
        }
      }
    }
    this.projs = this.projs.filter((p) => p.life > 0);
    for (const k of this.pickups) if (k.alive && (k.kind === "cash" || k.kind === "token") && Math.abs(k.x - this.player.x) < 26 && Math.abs(k.y - this.player.y) < 18) this.collect(this.player, k);
  }

  private updateHazards() {
    for (const h of this.stage.hazards) {
      if (this.tick % h.every === 0 && this.tick > 120) {
        if (h.kind === "traffic") this.hazardWarn = { kind: "traffic", y: FLOOR_TOP + 10 + this.rng() * (FLOOR_BOT - FLOOR_TOP - 20), t: 0 };
        else this.hazardWarn = { kind: "pulse", y: 0, t: 0, x: h.x, w: h.w };
        this.ev({ e: "sfx", name: h.kind === "traffic" ? "horn" : "bass" });
      }
    }
    const w = this.hazardWarn;
    if (!w) return;
    w.t++;
    const h = this.stage.hazards.find((z) => z.kind === w.kind)!;
    if (w.t === 60) {
      if (w.kind === "traffic") {
        const fromLeft = this.rng() < 0.5;
        this.projs.push({ id: this.nextId++, team: 2, kind: "keke", x: fromLeft ? this.camX - 120 : this.camX + VIEW_W + 120, y: w.y, z: 0, vx: fromLeft ? 15 : -15, vy: 0, dmg: h.dmg, life: 90, w: 50, d: 20, hit: [], launch: true, slow: false });
      } else {
        for (const a of this.actors) {
          if (a.st === "dead" || a.boss || a.x < w.x! || a.x > w.x! + w.w!) continue;
          if (a.team === 0) this.hurtPlayer(null, h.dmg, true, a.x - 1);
          else { a.hp -= h.dmg; if (a.hp <= 0) this.koActor(a, 1); else this.knockdown(a, 1, 4); }
        }
        this.ev({ e: "shake", power: 0.3 });
      }
    }
    if (w.t > 70) this.hazardWarn = null;
  }

  // ---------------------------------------------------------------- camera, waves, completion
  private updateCamera() {
    const p = this.player;
    const maxCam = this.stage.length - VIEW_W;
    if (this.lock === null) {
      const target = clamp(p.x - VIEW_W * 0.42, 0, maxCam);
      if (target > this.camX) this.camX = Math.min(target, this.camX + 6);
    }
    const wave = this.stage.waves[this.waveIdx];
    if (this.lock === null && wave && this.camX >= Math.min(wave.at, maxCam)) {
      this.lock = this.camX;
      this.waveLive = [];
      for (const g of wave.groups) for (let i = 0; i < g.count; i++) {
        const side = g.side === "both" ? (i % 2 ? "L" : "R") : g.side;
        const a = this.spawnEnemy(g.kind, side);
        if (a) this.waveLive.push(a.id);
      }
      this.ev({ e: "wave" });
    }
    if (this.lock !== null && this.waveLive.length) {
      const alive = this.waveLive.filter((id) => this.actors.some((a) => a.id === id && a.st !== "dead"));
      if (!alive.length) { this.waveLive = []; this.waveIdx++; this.lock = null; this.ev({ e: "go" }); }
    }
    const wavesDone = this.waveIdx >= this.stage.waves.length;
    if (this.bossId && wavesDone && !this.bossSpawned && this.camX >= maxCam - 2) { this.lock = this.camX; this.spawnBoss(); }
    if (!this.bossId && wavesDone && p.x >= this.stage.length - 90 && !this.ended) { this.ended = "clear"; this.ev({ e: "clear" }); }
  }

  result(): RunResult {
    const cleared = this.ended === "clear";
    const secs = this.tick / TPS;
    let rating: RunResult["rating"] = "-";
    if (cleared) {
      const timeS = clamp(this.stage.par / Math.max(1, secs), 0, 1.2);
      const dmgS = clamp(1 - this.dmgTaken / this.tune.maxHp, 0, 1);
      const comboS = clamp(this.maxCombo / 35, 0, 1);
      const v = timeS * 0.35 + dmgS * 0.4 + comboS * 0.25 + this.tokens * 0.02;
      rating = v >= 0.9 ? "S" : v >= 0.7 ? "A" : v >= 0.5 ? "B" : "C";
    }
    return {
      substage: this.stage.id, fighter: this.fighter.id, cleared, failed: this.ended === "fail", ticks: this.tick,
      score: this.score, maxCombo: this.maxCombo, kos: this.kos, damageTaken: this.dmgTaken, tokens: this.tokens,
      bossDefeated: this.bossDefeated, rating,
    };
  }
}

/** Madam Crescent's dance floor: 6 columns × 2 rows across the arena view. */
export function tileIndex(localX: number, y: number): number {
  if (localX < 0 || localX >= VIEW_W) return -1;
  const col = Math.floor(localX / (VIEW_W / 6));
  const row = y < (FLOOR_TOP + FLOOR_BOT) / 2 ? 0 : 1;
  return row * 6 + col;
}

/** Re-run a whole input log. Used by the server to verify a submitted run. */
export function simulate(cfg: SimConfig, inputs: ArrayLike<number>): RunResult {
  const sim = new Sim({ ...cfg, recordEvents: false });
  for (let i = 0; i < inputs.length && !sim.ended; i++) sim.step(inputs[i]!);
  return sim.result();
}
