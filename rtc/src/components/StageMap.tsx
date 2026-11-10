"use client";
import { useMemo, useState } from "react";
import { BOSSES, STAGES, SUBSTAGES } from "@/game/data/world";
import { sfx } from "@/game/client/audio";

/** Isometric Abuja: an original stylised plan (lake west, rock east, the expressway cutting through), not a real map tile. */
const W = 1000, H = 600;
const iso = (x: number, y: number): [number, number] => [W / 2 + (x - y) * 430, 70 + (x + y) * 225];
const pts = (list: [number, number][]) => list.map(([x, y]) => iso(x, y).join(",")).join(" ");

function rand(seed: number) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; }; }

function Box({ x, y, w, d, h, fill }: { x: number; y: number; w: number; d: number; h: number; fill: string }) {
  const a = iso(x, y), b = iso(x + w, y), c = iso(x + w, y + d), e = iso(x, y + d);
  const up = (p: [number, number]) => `${p[0]},${p[1] - h}`;
  return (
    <g>
      <polygon points={`${e.join(",")} ${c.join(",")} ${up(c)} ${up(e)}`} fill={fill} />
      <polygon points={`${e.join(",")} ${c.join(",")} ${up(c)} ${up(e)}`} fill="#000" opacity={0.25} />
      <polygon points={`${c.join(",")} ${b.join(",")} ${up(b)} ${up(c)}`} fill={fill} />
      <polygon points={`${c.join(",")} ${b.join(",")} ${up(b)} ${up(c)}`} fill="#000" opacity={0.45} />
      <polygon points={`${up(a)} ${up(b)} ${up(c)} ${up(e)}`} fill={fill} />
      <polyline points={`${up(a)} ${up(b)} ${up(c)} ${up(e)} ${up(a)}`} fill="none" stroke="#14161C" strokeWidth={1.2} />
    </g>
  );
}

export function StageMap({ unlocked, bests, selected, onSelect, onPlay, onBack }: {
  unlocked: Set<string>; bests: Record<string, { score: number; rating: string; clears: number }>;
  selected: string; onSelect: (id: string) => void; onPlay: (id: string) => void; onBack: () => void;
}) {
  const [stageId, setStageId] = useState(() => SUBSTAGES[selected]?.stage ?? "01");
  const stage = STAGES.find((s) => s.id === stageId)!;

  const buildings = useMemo(() => {
    const r = rand(7);
    const out: { x: number; y: number; w: number; d: number; h: number; fill: string }[] = [];
    for (let i = 0; i < 70; i++) {
      const x = 0.08 + r() * 0.84, y = 0.08 + r() * 0.84;
      if (Math.hypot(x - 0.13, y - 0.2) < 0.13) continue; // lake
      if (Math.abs(x - y) < 0.035) continue; // expressway
      out.push({ x, y, w: 0.025 + r() * 0.03, d: 0.025 + r() * 0.03, h: 8 + r() * 34, fill: r() > 0.85 ? "#e8c9a6" : r() > 0.5 ? "#5a2a14" : "#3f1d0e" });
    }
    return out.sort((a, b) => a.x + a.y - (b.x + b.y));
  }, []);

  const lake: [number, number][] = Array.from({ length: 18 }, (_, i) => { const t = (i / 18) * Math.PI * 2; return [0.13 + Math.cos(t) * 0.1 * (1 + 0.15 * Math.sin(3 * t)), 0.2 + Math.sin(t) * 0.07]; });

  return (
    <section className="map">
      <div className="map-canvas">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Map of the capital's districts">
          <defs>
            <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#ffffff10" /></pattern>
          </defs>
          <polygon points={pts([[0, 0], [1, 0], [1, 1], [0, 1]])} fill="#2a120a" stroke="#14161C" strokeWidth={3} />
          <polygon points={pts([[0, 0], [1, 0], [1, 1], [0, 1]])} fill="url(#grid)" />
          <polygon points={pts([[0, 1], [1, 1], [1, 1.03], [0, 1.03]])} fill="#120603" />
          <polygon points={pts(lake)} fill="#1e7aa8" stroke="#e8f5ec66" strokeWidth={2} />
          {/* roads */}
          <polyline points={pts([[0.02, 0.02], [0.98, 0.98]])} stroke="#e8c9a6" strokeWidth={9} fill="none" opacity={0.5} />
          <polyline points={pts([[0.1, 0.62], [0.5, 0.52], [0.92, 0.58]])} stroke="#e8c9a6" strokeWidth={6} fill="none" opacity={0.35} />
          <polyline points={pts([[0.55, 0.05], [0.5, 0.5], [0.45, 0.95]])} stroke="#e8c9a6" strokeWidth={6} fill="none" opacity={0.35} />
          {/* Aso Rock: a stylised mound, east */}
          <polygon points={`${iso(0.84, 0.12).join(",")} ${iso(0.95, 0.2)[0]},${iso(0.95, 0.2)[1] - 70} ${iso(1, 0.32).join(",")} ${iso(0.88, 0.32).join(",")}`} fill="#7a4a2a" stroke="#14161C" strokeWidth={2} />
          {buildings.map((b, i) => <Box key={i} {...b} />)}
          {STAGES.map((s) => {
            const [px, py] = iso(s.mapPos[0], s.mapPos[1]);
            const open = s.playable && s.substages.some((id) => unlocked.has(id));
            const cleared = s.substages.every((id) => bests[id]);
            return (
              <g key={s.id} className={`pin ${s.id === stageId ? "on" : ""} ${open ? "" : "locked"}`} transform={`translate(${px},${py})`} tabIndex={0} role="button"
                aria-label={`${s.name}${open ? "" : " (locked)"}`}
                onClick={() => { sfx("swing"); setStageId(s.id); }} onKeyDown={(e) => { if (e.key === "Enter") setStageId(s.id); }}>
                <ellipse rx={26} ry={13} fill="#00000055" />
                <path d="M0 0 C -18 -26 -18 -50 0 -56 C 18 -50 18 -26 0 0Z" fill={open ? (cleared ? "#FFC93C" : "#E8452C") : "#6b5040"} stroke="#14161C" strokeWidth={3} />
                <text y={-30} textAnchor="middle" className="pin-num">{s.id}</text>
                <text y={24} textAnchor="middle" className="pin-label">{s.name.toUpperCase()}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <aside className="map-side panel">
        <button className="btn ghost small" onClick={onBack}>← Menu</button>
        <small className="muted">Stage {stage.id} · {stage.district}</small>
        <h1>{stage.name}</h1>
        <p>{stage.blurb}</p>
        {!stage.playable && <p className="lock">Coming in a later update.</p>}
        <ul className="substages">
          {stage.substages.map((id) => {
            const s = SUBSTAGES[id];
            const open = !!s && stage.playable && unlocked.has(id);
            const best = bests[id];
            return (
              <li key={id}>
                <button disabled={!open} className={selected === id ? "on" : ""} onClick={() => { onSelect(id); sfx("swing"); }} onDoubleClick={() => open && onPlay(id)}>
                  <span className="sid">{s?.bonus ? "★" : id}</span>
                  <span className="sname">{s?.name ?? "???"}{s?.boss && <em> · Boss: {BOSSES[s.boss]?.name}</em>}{s?.bonus && <em className="bonus-tag"> · Bonus stage · XP party</em>}<small>{s ? (open ? s.objective : "Clear the previous fight to unlock.") : ""}</small></span>
                  <span className={`best r-${best?.rating ?? "none"}`}>{best?.rating ?? (open ? "–" : "🔒")}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {SUBSTAGES[selected]?.stage === stage.id && unlocked.has(selected) && (
          <button className="btn big" onClick={() => onPlay(selected)}>Choose fighter →</button>
        )}
      </aside>
    </section>
  );
}
