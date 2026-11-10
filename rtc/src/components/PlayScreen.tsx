"use client";
import { useEffect, useRef, useState } from "react";
import { Sim, TPS } from "@/game/sim/sim";
import { B, encodeInputs } from "@/game/sim/input";
import { Renderer, assetManifest, preload } from "@/game/client/render";
import { Controls, loadKeys } from "@/game/client/controls";
import { sfx, startMusic, stopMusic } from "@/game/client/audio";
import { api, ApiError, queueRun, type FinishOutcome } from "@/game/client/api";
import { FIGHTERS } from "@/game/data/roster";
import { BOSSES, SUBSTAGES, type EquipmentId } from "@/game/data/world";

export interface RunSetup { substage: string; fighter: string; equipment: EquipmentId | null; signedIn: boolean }
interface Hud { hp: number; maxHp: number; special: number; ult: number; score: number; combo: number; lives: number; boss: { name: string; hp: number; max: number; id: string } | null; go: boolean; equipReady: number }

const SFX_MAP: Record<string, string> = { hit: "hit", block: "block", ko: "ko", break: "break", pickup: "pickup", wave: "wave", go: "go" };

export function PlayScreen({ setup, onExit, onDone }: { setup: RunSetup; onExit: () => void; onDone: (o: { outcome: FinishOutcome | null; local: ReturnType<Sim["result"]>; error?: string }) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const [hud, setHud] = useState<Hud | null>(null);
  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);
  const [banner, setBanner] = useState<{ title: string; sub: string } | null>(null);
  const controlsRef = useRef<Controls | null>(null);
  const stage = SUBSTAGES[setup.substage]!;
  const fighter = FIGHTERS[setup.fighter]!;

  useEffect(() => { pausedRef.current = paused; }, [paused]);

  useEffect(() => {
    let raf = 0;
    let disposed = false;
    const controls = new Controls(loadKeys());
    controlsRef.current = controls;
    controls.onPause = () => setPaused((p) => !p);
    let toastId = 0;
    const toast = (text: string) => { const id = ++toastId; setToasts((t) => [...t.slice(-2), { id, text }]); setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200); };

    (async () => {
      let start: { runId: string; seed: number; equipment: string | null };
      if (!setup.signedIn) start = { runId: "", seed: (Math.random() * 2 ** 31) >>> 0, equipment: setup.equipment };
      else {
        try { start = await api.startRun({ substage: setup.substage, fighter: setup.fighter, equipment: setup.equipment }); }
        catch (e) { setError(e instanceof ApiError ? e.message : "Couldn't reach the server. Check your connection."); return; }
      }
      const assets = await preload(assetManifest(stage.bg, setup.fighter), (f) => !disposed && setLoading(f));
      if (disposed) return;
      const sim = new Sim({ seed: start.seed, substage: setup.substage, fighter: setup.fighter, equipment: (start.equipment as EquipmentId) ?? null });
      const canvas = canvasRef.current!, wrap = wrapRef.current!;
      const renderer = new Renderer(canvas, assets, stage.night, stage.bg);
      const fit = () => { const r = wrap.getBoundingClientRect(); renderer.resize(r.width, r.height, Math.min(window.devicePixelRatio || 1, 2)); };
      fit();
      const ro = new ResizeObserver(fit); ro.observe(wrap);
      controls.attach();
      startMusic(stage.night);
      setLoading(1);
      setBanner({ title: `${stage.id} · ${stage.name}`, sub: stage.objective });
      setTimeout(() => setBanner(null), 2600);
      const log: number[] = [];
      let acc = 0, last = performance.now(), hudTick = 0, finished = false;

      const frame = (now: number) => {
        if (disposed) return;
        raf = requestAnimationFrame(frame);
        const dt = Math.min(0.1, (now - last) / 1000); last = now;
        if (pausedRef.current || finished) { renderer.draw(sim, wrap.clientWidth, wrap.clientHeight, Math.min(window.devicePixelRatio || 1, 2)); return; }
        // KO slow-motion is presentation only: the sim still advances in whole ticks.
        acc += dt * (renderer.slowmo > 0 ? 0.35 : 1);
        if (renderer.slowmo > 0) renderer.slowmo--;
        let steps = 0;
        while (acc >= 1 / TPS && steps < 5 && !sim.ended) {
          const m = controls.mask();
          log.push(m); sim.step(m); acc -= 1 / TPS; steps++;
          for (const e of sim.events) {
            if (e.e === "sfx") sfx(e.name);
            else if (SFX_MAP[e.e]) sfx(e.e === "hit" && e.big ? "bighit" : SFX_MAP[e.e]!);
            if (e.e === "ability") { sfx("ability"); toast(`${e.ult ? "ULTIMATE · " : ""}${e.name}`); }
            if (e.e === "toast") toast(e.text);
            if (e.e === "boss") { const b = BOSSES[e.id]!; setBanner({ title: b.name, sub: `“${e.line}”` }); setTimeout(() => setBanner(null), 3200); }
            if (e.e === "lifelost") toast("Life lost. Get back up!");
          }
          renderer.consume(sim.events, sim);
          sim.events.length = 0;
        }
        if (steps >= 5) acc = 0;
        renderer.draw(sim, wrap.clientWidth, wrap.clientHeight, Math.min(window.devicePixelRatio || 1, 2));
        if (++hudTick % 4 === 0) {
          const b = sim.boss;
          setHud({ hp: sim.player.hp, maxHp: sim.player.maxHp, special: sim.special, ult: sim.ult, score: sim.score, combo: sim.combo, lives: sim.lives,
            boss: b ? { name: BOSSES[b.kind]!.name, hp: b.hp, max: b.maxHp, id: b.kind } : null, go: sim.lock === null && sim.waveIdx > 0 && sim.waveIdx < sim.stage.waves.length + 1 && sim.tick % 60 < 40 && !sim.boss, equipReady: sim.equipCD });
        }
        if (sim.ended && !finished) {
          finished = true;
          stopMusic();
          const local = sim.result();
          const body = { runId: start.runId, inputs: encodeInputs(log), claimed: { score: local.score, ticks: local.ticks, cleared: local.cleared } };
          setTimeout(async () => {
            if (!setup.signedIn) { onDone({ outcome: null, local }); return; }
            try { onDone({ outcome: await api.finishRun(body), local }); }
            catch (e) {
              if (!(e instanceof ApiError) || e.status >= 500) queueRun(body);
              onDone({ outcome: null, local, error: e instanceof ApiError ? e.message : "Offline: your run will be verified when you reconnect." });
            }
          }, 1200);
        }
      };
      raf = requestAnimationFrame(frame);
      (canvas as unknown as { _ro: ResizeObserver })._ro = ro;
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      controls.detach();
      stopMusic();
      const ro = (canvasRef.current as unknown as { _ro?: ResizeObserver } | null)?._ro; ro?.disconnect();
    };
  }, [setup, stage, onDone]);

  const press = (bit: number, on: boolean) => {
    const c = controlsRef.current; if (!c) return;
    c.touch = on ? c.touch | bit : c.touch & ~bit;
  };

  if (error) return (
    <div className="panel center-panel"><h2>Can&apos;t start this run</h2><p>{error}</p><button className="btn" onClick={onExit}>Back</button></div>
  );

  const pct = (v: number, m: number) => `${Math.max(0, Math.min(100, (v / m) * 100))}%`;
  return (
    <div className="play">
      <div className="stage-wrap" ref={wrapRef}>
        <canvas ref={canvasRef} className="stage-canvas" aria-label={`${stage.name} gameplay`} />
        {loading < 1 && <div className="loading"><div className="loading-bar"><i style={{ width: `${loading * 100}%` }} /></div><span>Loading {stage.name}…</span></div>}
        {hud && (
          <div className="hud">
            <div className="hud-player">
              <div className="hud-portrait" style={{ backgroundImage: fighter.art.portrait ? `url(${fighter.art.portrait.replace(".png", ".webp")})` : undefined, backgroundColor: fighter.colors.primary }} />
              <div className="hud-bars">
                <div className="hud-name">{fighter.name} <span className="lives">×{hud.lives + 1}</span><span className="score">{hud.score.toString().padStart(7, "0")}</span></div>
                <div className="bar hp"><i style={{ width: pct(hud.hp, hud.maxHp) }} /></div>
                <div className="bar sp"><i style={{ width: pct(hud.special, 100) }} /><em>SPECIAL</em></div>
                <div className={`bar ult ${hud.ult >= 100 ? "ready" : ""}`}><i style={{ width: pct(hud.ult, 100) }} /><em>{hud.ult >= 100 ? "ULTIMATE READY" : "ULTIMATE"}</em></div>
              </div>
            </div>
            <button className="pause-btn" onClick={() => setPaused(true)} aria-label="Pause">❚❚</button>
            {hud.combo >= 2 && <div className="combo" key={hud.combo}><b>{hud.combo}</b>hits</div>}
            {hud.go && <div className="go">GO ➜</div>}
            {hud.boss && <div className="boss-bar"><div className="boss-face" style={{ backgroundImage: `url(/game/portraits/${hud.boss.id}.webp)` }} /><div><span>{hud.boss.name}</span><div className="bar boss"><i style={{ width: pct(hud.boss.hp, hud.boss.max) }} /></div></div></div>}
          </div>
        )}
        {banner && <div className="stage-banner"><b>{banner.title}</b><span>{banner.sub}</span></div>}
        <div className="toasts">{toasts.map((t) => <div key={t.id} className="toast">{t.text}</div>)}</div>
        {paused && (
          <div className="pause-menu">
            <h2>Paused</h2>
            <button className="btn" onClick={() => setPaused(false)}>Resume</button>
            <button className="btn ghost" onClick={onExit}>Quit run</button>
            {!setup.signedIn && <p className="muted">Playing as a guest: sign in to earn XP and Capital Cash.</p>}
          </div>
        )}
        <div className="rotate-hint">↻ Turn your phone sideways for the full street</div>
        <Gamepad press={press} />
      </div>
    </div>
  );
}

function Gamepad({ press }: { press: (bit: number, on: boolean) => void }) {
  const [cfg] = useState(() => { try { return JSON.parse(localStorage.getItem("rtc.pad.v1") ?? "{}") as { size?: number; left?: boolean }; } catch { return {}; } });
  const size = cfg.size ?? 1;
  const dpad = useRef<HTMLDivElement>(null);
  const dirRef = useRef(0);
  const setDir = (e: React.PointerEvent | null) => {
    let bits = 0;
    if (e && dpad.current) {
      const r = dpad.current.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const dead = r.width * 0.14;
      if (dx < -dead) bits |= B.LEFT; if (dx > dead) bits |= B.RIGHT;
      if (dy < -dead) bits |= B.UP; if (dy > dead) bits |= B.DOWN;
    }
    for (const b of [B.LEFT, B.RIGHT, B.UP, B.DOWN]) press(b, !!(bits & b));
    dirRef.current = bits;
  };
  const btn = (bit: number, label: string, cls: string) => (
    <button className={`pad-btn ${cls}`} aria-label={label}
      onPointerDown={(e) => { e.preventDefault(); (e.target as HTMLElement).setPointerCapture?.(e.pointerId); press(bit, true); }}
      onPointerUp={() => press(bit, false)} onPointerCancel={() => press(bit, false)} onPointerLeave={() => press(bit, false)}>{label}</button>
  );
  return (
    <div className={`gamepad ${cfg.left ? "lefty" : ""}`} style={{ ["--pad" as string]: size }}>
      <div className="dpad" ref={dpad}
        onPointerDown={(e) => { e.preventDefault(); (e.target as HTMLElement).setPointerCapture?.(e.pointerId); setDir(e); }}
        onPointerMove={(e) => { if (e.buttons || e.pointerType === "touch") setDir(e); }}
        onPointerUp={() => setDir(null)} onPointerCancel={() => setDir(null)}>
        <span className="dpad-knob" />
      </div>
      <div className="pad-buttons">
        {btn(B.ULT, "★", "ult")}
        {btn(B.SPECIAL, "SP", "special")}
        {btn(B.GRAB, "GRAB", "grab")}
        {btn(B.DODGE, "DODGE", "dodge")}
        {btn(B.JUMP, "JUMP", "jump")}
        {btn(B.ATTACK, "✊", "attack")}
      </div>
    </div>
  );
}
