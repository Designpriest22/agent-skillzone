"use client";
import { useEffect, useMemo, useState } from "react";
import type { Dashboard } from "@/lib/services/analytics";
import { FIGHTERS } from "@/game/data/roster";
import { SUBSTAGES } from "@/game/data/world";

/* Live player-behaviour dashboard. Single-series charts use TCM red; two-series charts use red + steel blue
   (validated for colour-blind separation); magnitude uses one red ramp. Every mark has a hover readout. */

const fmt = (n: number) => n.toLocaleString("en-NG");
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "–");
const dur = (s: number) => (s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`);

type Tip = { x: number; y: number; text: string } | null;

export function AdminDashboard() {
  const [d, setD] = useState<Dashboard | null>(null);
  const [days, setDays] = useState(30);
  const [err, setErr] = useState<string | null>(null);
  const [tip, setTip] = useState<Tip>(null);

  useEffect(() => {
    let live = true;
    const load = () => fetch(`/api/admin/analytics?days=${days}`, { credentials: "same-origin", cache: "no-store" })
      .then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error ?? "Failed"); if (live) { setD(j); setErr(null); } })
      .catch((e: Error) => live && setErr(e.message));
    void load();
    const t = setInterval(() => { if (!document.hidden) void load(); }, 15000);
    return () => { live = false; clearInterval(t); };
  }, [days]);

  const show = (e: React.MouseEvent, text: string) => setTip({ x: e.clientX, y: e.clientY, text });
  const hide = () => setTip(null);

  if (err && !d) return <section className="panel center-panel"><h1>Analytics</h1><p className="error">{err}</p></section>;
  if (!d) return <section className="panel center-panel"><h1>Analytics</h1><p className="muted">Loading live data…</p></section>;

  const f0 = d.funnel[0]!.n;
  return (
    <div className="dash" onMouseLeave={hide}>
      <header className="dash-head">
        <div><h1>Player behaviour</h1><p className="muted small">Live from first-party events · refreshed {new Date(d.at).toLocaleTimeString()} · every 15s</p></div>
        <div className="tabs">{[7, 30, 90].map((n) => <button key={n} className={days === n ? "on" : ""} onClick={() => setDays(n)}>{n} days</button>)}</div>
      </header>

      <div className="tiles">
        <Tile label="Playing now" value={fmt(d.live.players)} sub={`${fmt(d.live.sessions)} sessions · last 5 min`} pulse />
        <Tile label="Daily players" value={fmt(d.kpi.dau)} sub={`${fmt(d.kpi.wau)} weekly · ${fmt(d.kpi.mau)} monthly`} />
        <Tile label="Stickiness" value={pct(d.kpi.dau, d.kpi.mau)} sub="daily ÷ monthly players" />
        <Tile label="Runs today" value={fmt(d.kpi.runsToday)} sub={`${fmt(d.kpi.signupsToday)} new profiles today`} />
        <Tile label="Session length" value={dur(d.kpi.medianSessionS)} sub={`median · mean ${dur(d.kpi.avgSessionS)}`} />
      </div>

      <div className="grid2">
        <Card title="Daily players" note={`Last ${d.days} days · distinct anonymous players per day`}>
          <LineChart points={d.daily.map((p) => ({ label: p.day, v: p.players }))} show={show} hide={hide} unit="players" />
        </Card>
        <Card title="Funnel · last 7 days" note="Share of visitors reaching each step">
          <div className="funnel">
            {d.funnel.map((s) => (
              <div key={s.step} className="f-row" onMouseMove={(e) => show(e, `${s.step}: ${fmt(s.n)} (${pct(s.n, f0)} of visitors)`)} onMouseLeave={hide}>
                <span className="f-label">{s.step}</span>
                <span className="f-bar"><i style={{ width: f0 ? `${(s.n / f0) * 100}%` : 0 }} /></span>
                <span className="f-val">{fmt(s.n)} <em>{pct(s.n, f0)}</em></span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid2">
        <Card title="Where players win and quit" note="Runs started vs cleared per substage">
          <div className="legend"><span><i className="sw s1" />Started</span><span><i className="sw s2" />Cleared</span></div>
          <GroupedBars rows={d.stages.map((s) => ({ label: s.substage, title: SUBSTAGES[s.substage]?.name ?? s.substage, a: s.starts, b: s.clears, extra: `${fmt(s.fails)} KO'd · ${fmt(s.quits)} quit` }))} show={show} hide={hide} />
        </Card>
        <Card title="When Abuja plays" note="Distinct players by weekday and hour (WAT), last 28 days">
          <Heatmap cells={d.hourly} show={show} hide={hide} />
        </Card>
      </div>

      <div className="grid3">
        <Card title="Home areas" note="Signed-in players by self-selected area">
          <HBars rows={d.areas.map((a) => ({ label: a.name, v: a.players }))} show={show} hide={hide} unit="players" />
        </Card>
        <Card title="Fighter picks" note="Runs started per fighter">
          <HBars rows={d.fighters.slice(0, 10).map((f) => ({ label: FIGHTERS[f.fighter]?.name ?? f.fighter, v: f.runs }))} show={show} hide={hide} unit="runs" />
        </Card>
        <Card title="Traffic sources" note="Sessions by ?src= / utm_source / referrer domain">
          <HBars rows={d.sources.map((s) => ({ label: s.source, v: s.sessions }))} show={show} hide={hide} unit="sessions" />
          <div className="plat">{d.platforms.map((p) => <span key={p.platform}><b>{fmt(p.players)}</b> {p.platform}</span>)}</div>
        </Card>
      </div>

      <Card title="Retention by first-visit cohort" note="Share of each day's new players who came back exactly 1, 7 and 30 days later">
        <Retention rows={d.retention} />
      </Card>
      {tip && <div className="tip" style={{ left: tip.x + 14, top: tip.y + 14 }} role="status">{tip.text}</div>}
    </div>
  );
}

function Tile({ label, value, sub, pulse }: { label: string; value: string; sub: string; pulse?: boolean }) {
  return <div className="tile-kpi"><span className="k-label">{pulse && <i className="live-dot" aria-hidden />}{label}</span><b>{value}</b><small>{sub}</small></div>;
}
function Card({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return <section className="card-viz"><h3>{title}</h3><p className="muted small">{note}</p>{children}</section>;
}

type Show = (e: React.MouseEvent, t: string) => void;

function LineChart({ points, show, hide, unit }: { points: { label: string; v: number }[]; show: Show; hide: () => void; unit: string }) {
  const W = 560, H = 200, P = { l: 36, r: 12, t: 12, b: 24 };
  const max = Math.max(1, ...points.map((p) => p.v));
  const nice = Math.ceil(max / 5) * 5 || 5;
  const x = (i: number) => P.l + (points.length < 2 ? 0 : (i / (points.length - 1)) * (W - P.l - P.r));
  const y = (v: number) => H - P.b - (v / nice) * (H - P.t - P.b);
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.v)}`).join("");
  const [hi, setHi] = useState<number | null>(null);
  if (!points.length) return <Empty />;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="viz" role="img" aria-label={`Daily ${unit}`}>
      {[0, 0.5, 1].map((t) => <g key={t}><line x1={P.l} x2={W - P.r} y1={y(nice * t)} y2={y(nice * t)} className="grid" /><text x={P.l - 6} y={y(nice * t) + 4} className="axis" textAnchor="end">{fmt(Math.round(nice * t))}</text></g>)}
      <path d={`${path}L${x(points.length - 1)},${y(0)}L${x(0)},${y(0)}Z`} className="area" />
      <path d={path} className="line" />
      {[0, points.length - 1].map((i) => <text key={i} x={x(i)} y={H - 6} className="axis" textAnchor={i ? "end" : "start"}>{points[i]!.label.slice(5)}</text>)}
      {hi !== null && <><line x1={x(hi)} x2={x(hi)} y1={P.t} y2={H - P.b} className="cross" /><circle cx={x(hi)} cy={y(points[hi]!.v)} r={5} className="dot" /></>}
      {points.map((p, i) => (
        <rect key={i} x={x(i) - (W / points.length) / 2} y={0} width={W / points.length} height={H} fill="transparent"
          onMouseMove={(e) => { setHi(i); show(e, `${p.label}: ${fmt(p.v)} ${unit}`); }} onMouseLeave={() => { setHi(null); hide(); }} />
      ))}
    </svg>
  );
}

function GroupedBars({ rows, show, hide }: { rows: { label: string; title: string; a: number; b: number; extra: string }[]; show: Show; hide: () => void }) {
  const W = 560, H = 200, P = { l: 36, r: 8, t: 10, b: 24 };
  const max = Math.max(1, ...rows.map((r) => Math.max(r.a, r.b)));
  const bw = (W - P.l - P.r) / rows.length;
  const y = (v: number) => (v / max) * (H - P.t - P.b);
  if (!rows.some((r) => r.a)) return <Empty />;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="viz" role="img" aria-label="Runs started and cleared per substage">
      <line x1={P.l} x2={W - P.r} y1={H - P.b} y2={H - P.b} className="grid" />
      {rows.map((r, i) => {
        const x0 = P.l + i * bw + bw * 0.18, w = (bw * 0.64 - 2) / 2;
        const tip = `${r.label} ${r.title}: ${fmt(r.a)} started, ${fmt(r.b)} cleared (${pct(r.b, r.a)}) · ${r.extra}`;
        return (
          <g key={r.label} onMouseMove={(e) => show(e, tip)} onMouseLeave={hide}>
            <rect x={P.l + i * bw} y={0} width={bw} height={H} fill="transparent" />
            <rect x={x0} y={H - P.b - y(r.a)} width={w} height={Math.max(0, y(r.a))} rx={3} className="s1" />
            <rect x={x0 + w + 2} y={H - P.b - y(r.b)} width={w} height={Math.max(0, y(r.b))} rx={3} className="s2" />
            <text x={P.l + i * bw + bw / 2} y={H - 6} className="axis" textAnchor="middle">{r.label}</text>
            <text x={P.l + i * bw + bw / 2} y={H - P.b - y(r.a) - 5} className="val" textAnchor="middle">{pct(r.b, r.a)}</text>
          </g>
        );
      })}
    </svg>
  );
}

function HBars({ rows, show, hide, unit }: { rows: { label: string; v: number }[]; show: Show; hide: () => void; unit: string }) {
  const max = Math.max(1, ...rows.map((r) => r.v));
  const sorted = useMemo(() => [...rows].sort((a, b) => b.v - a.v), [rows]);
  if (!rows.some((r) => r.v)) return <Empty />;
  return (
    <div className="hbars">
      {sorted.map((r) => (
        <div key={r.label} className="hb" onMouseMove={(e) => show(e, `${r.label}: ${fmt(r.v)} ${unit}`)} onMouseLeave={hide}>
          <span className="hb-l">{r.label}</span><span className="hb-b"><i style={{ width: `${(r.v / max) * 100}%` }} /></span><span className="hb-v">{fmt(r.v)}</span>
        </div>
      ))}
    </div>
  );
}

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
function Heatmap({ cells, show, hide }: { cells: { dow: number; hour: number; players: number }[]; show: Show; hide: () => void }) {
  const max = Math.max(1, ...cells.map((c) => c.players));
  const get = (d: number, h: number) => cells.find((c) => c.dow === d && c.hour === h)?.players ?? 0;
  if (!cells.length) return <Empty />;
  return (
    <div className="heat" role="img" aria-label="Players by weekday and hour">
      {DOW.map((name, di) => (
        <div key={name} className="heat-row"><span className="axis-l">{name}</span>
          {Array.from({ length: 24 }, (_, h) => {
            const v = get(di + 1, h);
            return <span key={h} className="hc" style={{ ["--a" as string]: v ? 0.12 + 0.88 * (v / max) : 0 }}
              onMouseMove={(e) => show(e, `${name} ${String(h).padStart(2, "0")}:00 · ${fmt(v)} players`)} onMouseLeave={hide} />;
          })}
        </div>
      ))}
      <div className="heat-row"><span className="axis-l" />{Array.from({ length: 24 }, (_, h) => <span key={h} className="hx">{h % 6 === 0 ? h : ""}</span>)}</div>
    </div>
  );
}

function Retention({ rows }: { rows: { cohort: string; size: number; d1: number | null; d7: number | null; d30: number | null }[] }) {
  if (!rows.length) return <Empty />;
  const cell = (n: number | null, size: number) => {
    if (n === null) return <td className="immature" title="Cohort too young">–</td>;
    const r = size ? n / size : 0;
    return <td style={{ ["--a" as string]: r ? 0.1 + Math.min(1, r * 2.2) * 0.8 : 0 }}>{size ? `${Math.round(r * 100)}%` : "–"}</td>;
  };
  return (
    <div className="ret-wrap">
      <table className="ret">
        <thead><tr><th>Cohort</th><th>New players</th><th>Day 1</th><th>Day 7</th><th>Day 30</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.cohort}><td>{r.cohort}</td><td>{fmt(r.size)}</td>{cell(r.d1, r.size)}{cell(r.d7, r.size)}{cell(r.d30, r.size)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function Empty() { return <p className="muted small empty">No events in this window yet.</p>; }
