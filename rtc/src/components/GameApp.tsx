"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PlayScreen, type RunSetup } from "./PlayScreen";
import { StageMap } from "./StageMap";
import { api, ApiError, flushQueue, type BoardRow, type FinishOutcome, type MeResponse } from "@/game/client/api";
import { ACTION_LABELS, DEFAULT_KEYS, keyLabel, loadKeys, saveKeys, type Action } from "@/game/client/controls";
import { loadVolume, setVolume, sfx } from "@/game/client/audio";
import { FIGHTERS, ROSTER, STARTERS, type Fighter } from "@/game/data/roster";
import { ACHIEVEMENTS, AREAS, BOSSES, EQUIPMENT, RANKS, STAGES, STORE, SUBSTAGES, SUBSTAGE_ORDER, activeMissions, rankForXp, type EquipmentId } from "@/game/data/world";
import type { RunResult } from "@/game/sim/sim";
import { asset, isPreview } from "@/game/client/assets";

type Screen = "menu" | "auth" | "map" | "select" | "play" | "results" | "boards" | "status" | "store" | "profile" | "settings" | "fighters";

export const portraitOf = (f: Fighter) => (f.art.portrait ? asset(f.art.portrait.replace(".png", ".webp")) : undefined);
const naira = (kobo: number) => `₦${(kobo / 100).toLocaleString("en-NG")}`;
const cc = (n: number) => `${n.toLocaleString("en-NG")} CC`;

/* Guest progress is a convenience only: nothing competitive is ever read from it. */
const GUEST = "rtc.guest.v1";
function guestClears(): string[] { try { return JSON.parse(localStorage.getItem(GUEST) ?? "{}").clears ?? []; } catch { return []; } }
function addGuestClear(id: string) { try { const c = new Set(guestClears()); c.add(id); localStorage.setItem(GUEST, JSON.stringify({ clears: [...c] })); } catch { /* storage blocked */ } }

function lockReason(f: Fighter): string {
  const u = f.unlock;
  if (u.type === "starter") return "Starter";
  if (u.type === "rank") return `Reach ${RANKS[u.rank - 1]?.name ?? "a higher rank"}`;
  if (u.type === "boss") return `Defeat ${BOSSES[u.boss]?.name ?? "the boss"}`;
  return `${cc(u.price)} in the Store`;
}

export function GameApp() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [me, setMe] = useState<MeResponse | null>(null);
  const [substage, setSubstage] = useState("01A");
  const [setup, setSetup] = useState<RunSetup | null>(null);
  const [result, setResult] = useState<{ outcome: FinishOutcome | null; local: RunResult; error?: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [toasts, setToasts] = useState<{ id: number; title: string; sub: string }[]>([]);

  const refresh = useCallback(async () => { try { setMe(await api.me()); } catch { setMe({ user: null }); } }, []);
  useEffect(() => {
    void refresh();
    loadVolume();
    void flushQueue().then((n) => { if (n) { setNotice(`${n} offline run${n > 1 ? "s" : ""} verified.`); void refresh(); } });
    const q = new URLSearchParams(location.search);
    if (q.get("purchase")) { setNotice("Payment received. Your item appears once Paystack confirms it. This can take a minute."); setScreen("store"); history.replaceState(null, "", "/"); }
  }, [refresh]);

  const signedIn = !!me?.user;
  const owned = useMemo(() => new Set(signedIn ? me?.fighters ?? [] : STARTERS), [me, signedIn]);
  const unlocked = useMemo(() => {
    if (signedIn) return new Set(me?.unlockedStages ?? ["01A"]);
    const clears = new Set(guestClears());
    return new Set(SUBSTAGE_ORDER.filter((id) => { const s = SUBSTAGES[id]!; return !s.unlockedBy || clears.has(s.unlockedBy); }));
  }, [me, signedIn, screen]); // eslint-disable-line react-hooks/exhaustive-deps

  const toast = useCallback((title: string, sub: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, title, sub }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const go = (s: Screen) => { sfx("swing"); setScreen(s); };

  const onDone = useCallback((r: { outcome: FinishOutcome | null; local: RunResult; error?: string }) => {
    setResult(r);
    if (r.local.cleared && !r.outcome) addGuestClear(r.local.substage);
    for (const a of r.outcome?.achievements ?? []) { const d = ACHIEVEMENTS.find((x) => x.id === a); if (d) toast(d.name, `${d.xp.toLocaleString()} XP`); }
    if (r.outcome?.rankUp) toast("Rank up", r.outcome.rankUp);
    setScreen("results");
    void refresh();
  }, [refresh, toast]);
  const onExit = useCallback(() => setScreen("map"), []);

  const startRun = (fighter: string, equipment: EquipmentId | null) => {
    setSetup({ substage, fighter, equipment, signedIn });
    if (signedIn && me?.profile?.selectedFighter !== fighter) void api.patchMe({ selectedFighter: fighter, equipment }).catch(() => {});
    setScreen("play");
  };

  return (
    <div className={`app screen-${screen}`}>
      {screen !== "play" && <TopBar me={me} onHome={() => go("menu")} onAuth={() => go("auth")} />}
      {notice && <div className="notice" role="status" onClick={() => setNotice(null)}>{notice}</div>}
      <main className="screen" key={screen}>
        {screen === "menu" && <MainMenu me={me} go={go} />}
        {screen === "auth" && (isPreview() ? <PreviewOnly what="Profiles and sign-in" /> : <Auth onDone={async () => { await refresh(); setScreen("menu"); }} />)}
        {screen === "map" && <StageMap unlocked={unlocked} bests={me?.bests ?? {}} selected={substage} onSelect={setSubstage} onPlay={(id) => { setSubstage(id); go("select"); }} onBack={() => go("menu")} />}
        {(screen === "select" || screen === "fighters") && (
          <FighterSelect owned={owned} me={me} browse={screen === "fighters"} substage={substage}
            onBack={() => go(screen === "fighters" ? "menu" : "map")} onFight={startRun} />
        )}
        {screen === "play" && setup && <PlayScreen setup={setup} onExit={onExit} onDone={onDone} />}
        {screen === "results" && result && (
          <Results r={result} signedIn={signedIn}
            onRetry={() => { setSetup((s) => s && { ...s }); setScreen("play"); }}
            onNext={(id) => { setSubstage(id); setScreen("select"); }}
            onMap={() => go("map")} onAuth={() => go("auth")} />
        )}
        {screen === "boards" && (isPreview() ? <PreviewOnly what="Live leaderboards" /> : <Leaderboards me={me} />)}
        {screen === "status" && <Status me={me} onAuth={() => go("auth")} />}
        {screen === "store" && <Store me={me} onChange={refresh} onAuth={() => go("auth")} />}
        {screen === "profile" && <Profile me={me} onAuth={() => go("auth")} onSignOut={async () => { await api.signOut().catch(() => {}); await refresh(); go("menu"); }} />}
        {screen === "settings" && <Settings />}
      </main>
      <div className="achievements" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="achievement"><span className="trophy" aria-hidden>🏆</span><div><b>{t.title}</b><span>{t.sub}</span></div></div>
        ))}
      </div>
    </div>
  );
}

function PreviewOnly({ what }: { what: string }) {
  return <section className="panel center-panel"><h1>{what}</h1><p>This is the offline preview build. {what} run on the live server at launch; everything else here is playable now.</p></section>;
}

/* ------------------------------------------------------------------ top bar */
function TopBar({ me, onHome, onAuth }: { me: MeResponse | null; onHome: () => void; onAuth: () => void }) {
  const p = me?.profile;
  return (
    <header className="topbar">
      <button className="brand" onClick={onHome} aria-label="Run The Capital home"><img src={asset("/game/logo.webp")} alt="Run The Capital" /></button>
      <div className="topbar-right">
        {p ? (
          <>
            <span className="chip rank">{p.rank.name}<em>LV {p.level}</em></span>
            <span className="chip cash">{cc(p.cash)}</span>
            <span className="chip user">@{p.username}</span>
          </>
        ) : isPreview() ? <span className="chip">Preview build</span> : me ? <button className="btn small" onClick={onAuth}>Sign in</button> : null}
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ main menu */
function MainMenu({ me, go }: { me: MeResponse | null; go: (s: Screen) => void }) {
  const items: [Screen, string, string][] = [
    ["map", "Campaign", "Five districts. Fifteen fights."],
    ["fighters", "Fighters", "The 14 of the capital."],
    ["boards", "Leaderboards", "Who runs the city right now."],
    ["status", "Capital Status", "Ranks, missions, rewards."],
    ["store", "Store", "Cosmetics and boosts. Never pay-to-win."],
    ["profile", "Profile", "Your record and your card."],
    ["settings", "Settings", "Controls, gamepad, sound."],
  ];
  const [hover, setHover] = useState(0);
  const cast = ["odumodu", "settings", "romie", "kekequeen", "agbadadon", "suyaspice", "gateman", "mallamtech"].map((id) => FIGHTERS[id]!).filter((f) => portraitOf(f));
  return (
    <section className="menu">
      <div className="menu-art" aria-hidden>
        {cast.map((f, i) => <img key={f.id} src={portraitOf(f)} alt="" className={`cast c${i}`} style={{ ["--i" as string]: i }} />)}
        <div className="menu-art-fade" />
      </div>
      <nav className="menu-list">
        <img src={asset("/game/logo.webp")} alt="Run The Capital" className="menu-logo" />
        {!me?.user && me && <p className="menu-hint">Playing as a guest. <button className="link" onClick={() => go("auth")}>Create a profile</button> to save XP, cash and ranks.</p>}
        <ul>
          {items.map(([s, label, sub], i) => (
            <li key={s}>
              <button className={hover === i ? "on" : ""} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onClick={() => go(s)}>
                <span>{label}</span><small>{sub}</small>
              </button>
            </li>
          ))}
        </ul>
        <p className="menu-foot">A TCM game · Abuja, Nigeria</p>
      </nav>
    </section>
  );
}

/* ------------------------------------------------------------------ auth */
function Auth({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<"in" | "up">("up");
  const [f, setF] = useState({ email: "", password: "", username: "", homeArea: "wuse", fighter: STARTERS[0]! });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      if (mode === "up") await api.signUp(f); else await api.signIn({ email: f.email, password: f.password });
      onDone();
    } catch (x) { setErr(x instanceof ApiError ? x.message : "Couldn't reach the server."); } finally { setBusy(false); }
  };
  const area = AREAS.find((a) => a.id === f.homeArea);
  return (
    <section className="panel auth">
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={mode === "up"} className={mode === "up" ? "on" : ""} onClick={() => setMode("up")}>New player</button>
        <button role="tab" aria-selected={mode === "in"} className={mode === "in" ? "on" : ""} onClick={() => setMode("in")}>Sign in</button>
      </div>
      <form onSubmit={submit} className="form">
        {mode === "up" && (
          <label>Street name<input required minLength={3} maxLength={20} pattern="[A-Za-z0-9_]+" value={f.username} onChange={set("username")} placeholder="e.g. WuseWarrior" autoComplete="username" /></label>
        )}
        <label>Email<input required type="email" value={f.email} onChange={set("email")} autoComplete="email" /></label>
        <label>Password<input required type="password" minLength={mode === "up" ? 8 : 1} value={f.password} onChange={set("password")} autoComplete={mode === "up" ? "new-password" : "current-password"} /></label>
        {mode === "up" && (
          <>
            <label>Home area
              <select value={f.homeArea} onChange={set("homeArea")}>{AREAS.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
              <small className="muted">{area?.intro} You choose this; we never read your location.</small>
            </label>
            <fieldset className="starter-pick">
              <legend>Starting fighter</legend>
              {STARTERS.map((id) => { const s = FIGHTERS[id]!; return (
                <button type="button" key={id} className={f.fighter === id ? "on" : ""} onClick={() => setF({ ...f, fighter: id })} style={{ ["--c" as string]: s.colors.primary }}>
                  {portraitOf(s) ? <img src={portraitOf(s)} alt="" /> : <span className="initials">{s.name[0]}</span>}<span>{s.name}</span>
                </button>
              ); })}
            </fieldset>
          </>
        )}
        {err && <p className="error" role="alert">{err}</p>}
        <button className="btn" disabled={busy}>{busy ? "…" : mode === "up" ? "Enter the capital" : "Sign in"}</button>
      </form>
    </section>
  );
}

/* ------------------------------------------------------------------ fighter select */
function FighterSelect({ owned, me, browse, substage, onBack, onFight }: { owned: Set<string>; me: MeResponse | null; browse: boolean; substage: string; onBack: () => void; onFight: (f: string, e: EquipmentId | null) => void }) {
  const [sel, setSel] = useState(() => me?.profile?.selectedFighter && owned.has(me.profile.selectedFighter) ? me.profile.selectedFighter : [...owned][0] ?? STARTERS[0]!);
  const inv = new Set((me?.inventory ?? []).map((i) => i.id));
  const equipOwned = (Object.keys(EQUIPMENT) as EquipmentId[]).filter((e) => e === "firstaid" || inv.has(`equip_${e}`));
  const [equip, setEquip] = useState<EquipmentId | null>(() => (me?.profile?.equipment as EquipmentId) ?? "firstaid");
  const f = FIGHTERS[sel]!;
  const locked = !owned.has(sel);
  const st = SUBSTAGES[substage];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const i = ROSTER.findIndex((x) => x.id === sel);
      const cols = 7;
      let n = i;
      if (e.code === "ArrowRight" || e.code === "KeyD") n = (i + 1) % ROSTER.length;
      else if (e.code === "ArrowLeft" || e.code === "KeyA") n = (i - 1 + ROSTER.length) % ROSTER.length;
      else if (e.code === "ArrowDown" || e.code === "KeyS") n = (i + cols) % ROSTER.length;
      else if (e.code === "ArrowUp" || e.code === "KeyW") n = (i - cols + ROSTER.length) % ROSTER.length;
      else if ((e.code === "Enter" || e.code === "KeyJ") && !browse && owned.has(sel)) { onFight(sel, equip); return; }
      else return;
      e.preventDefault(); sfx("swing"); setSel(ROSTER[n]!.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sel, browse, owned, equip, onFight]);

  return (
    <section className="select" style={{ ["--c" as string]: f.colors.primary, ["--c2" as string]: f.colors.secondary }}>
      <div className="select-hero">
        <div className="hero-glow" />
        {portraitOf(f) ? <img key={f.id} src={portraitOf(f)} alt={f.name} className={`hero-img ${locked ? "locked" : ""}`} /> : <div className="hero-pending"><b>{f.name[0]}</b><span>{f.art.pending ?? "Art in production"}</span></div>}
        <div className="hero-name"><small>{f.archetype} · {f.area}</small><h1>{f.name}</h1></div>
      </div>
      <div className="select-info">
        <div className="select-head">
          <button className="btn ghost small" onClick={onBack}>← Back</button>
          {!browse && st && <span className="chip">{st.id} · {st.name}</span>}
        </div>
        <p className="style">{f.style}</p>
        <dl className="stats">
          {(["health", "strength", "speed", "defence"] as const).map((k) => (
            <div key={k}><dt>{k}</dt><dd><i style={{ width: `${f.stats[k] * 10}%` }} /></dd></div>
          ))}
        </dl>
        <div className="abilities">
          <div><em>Special · L</em><b>{f.special.name}</b><span>{f.special.desc}</span></div>
          <div><em>Ultimate · Space</em><b>{f.ultimate.name}</b><span>{f.ultimate.desc}</span></div>
          <div><em>Passive</em><b>{f.passive.name}</b><span>{f.passive.desc}</span></div>
          <div><em>Signature</em><span>{f.signature}</span></div>
        </div>
        <p className="backstory">{f.backstory}</p>
        {!browse && (
          <div className="equip">
            <span className="label">Equipment · Q</span>
            {(Object.keys(EQUIPMENT) as EquipmentId[]).map((e) => {
              const have = equipOwned.includes(e);
              return <button key={e} disabled={!have} title={have ? EQUIPMENT[e].desc : "Unlock in the Store"} className={equip === e ? "on" : ""} onClick={() => setEquip(e)}>{EQUIPMENT[e].name}</button>;
            })}
          </div>
        )}
        {locked ? <p className="lock">🔒 {lockReason(f)}</p> : !browse && <button className="btn big" onClick={() => onFight(sel, equip)}>Fight</button>}
      </div>
      <div className="roster-grid" role="listbox" aria-label="Fighters">
        {ROSTER.map((r) => (
          <button key={r.id} role="option" aria-selected={sel === r.id} className={`tile ${sel === r.id ? "on" : ""} ${owned.has(r.id) ? "" : "locked"}`}
            style={{ ["--c" as string]: r.colors.primary }} onClick={() => { sfx("swing"); setSel(r.id); }} title={r.name}>
            {portraitOf(r) ? <img src={portraitOf(r)} alt="" /> : <span className="initials">{r.name.split(" ").map((w) => w[0]).join("")}</span>}
            <span className="tile-name">{r.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ results */
function Results({ r, signedIn, onRetry, onNext, onMap, onAuth }: { r: { outcome: FinishOutcome | null; local: RunResult; error?: string }; signedIn: boolean; onRetry: () => void; onNext: (id: string) => void; onMap: () => void; onAuth: () => void }) {
  const res = r.outcome?.result ?? r.local;
  const st = SUBSTAGES[res.substage]!;
  const next = SUBSTAGE_ORDER[SUBSTAGE_ORDER.indexOf(res.substage) + 1];
  const nextPlayable = next && STAGES.find((s) => s.id === SUBSTAGES[next]?.stage)?.playable;
  const secs = Math.round(res.ticks / 60);
  return (
    <section className="results">
      <div className={`rating r-${res.rating}`}>{res.cleared ? res.rating : "KO"}</div>
      <h1>{res.cleared ? `${st.name} cleared` : "Knocked out"}</h1>
      <p className="muted">{st.id} · {FIGHTERS[res.fighter]?.name}</p>
      <dl className="tally">
        <div><dt>Score</dt><dd>{res.score.toLocaleString()}</dd></div>
        <div><dt>Best combo</dt><dd>{res.maxCombo}</dd></div>
        <div><dt>KOs</dt><dd>{res.kos}</dd></div>
        <div><dt>Time</dt><dd>{Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")}</dd></div>
        <div><dt>Damage taken</dt><dd>{res.damageTaken}</dd></div>
        <div><dt>Tokens</dt><dd>{res.tokens}</dd></div>
      </dl>
      {r.outcome && !r.outcome.verified && <p className="error">This run couldn&apos;t be verified ({r.outcome.reason ?? "mismatch"}), so no rewards were given.</p>}
      {r.outcome?.verified && (
        <div className="rewards">
          <span className="verified">✔ Verified by the server</span>
          {r.outcome.rewards.map((w, i) => <div key={i} className="reward"><span>{w.label}</span><b>{w.xp ? `+${w.xp} XP` : ""}</b><b>{w.cash ? `+${cc(w.cash)}` : ""}</b></div>)}
          {r.outcome.unlocked.map((u) => <div key={u} className="reward unlock"><span>Unlocked</span><b>{FIGHTERS[u]?.name ?? u}</b></div>)}
        </div>
      )}
      {r.error && <p className="muted">{r.error}</p>}
      {!signedIn && <p className="muted">Guest run: nothing was saved to the leaderboards. <button className="link" onClick={onAuth}>Create a profile</button> to earn XP and Capital Cash.</p>}
      <div className="row">
        <button className="btn" onClick={onRetry}>Run it back</button>
        {res.cleared && next && nextPlayable && <button className="btn" onClick={() => onNext(next)}>Next: {SUBSTAGES[next]!.name}</button>}
        <button className="btn ghost" onClick={onMap}>Map</button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ leaderboards */
const BOARD_TABS: [string, string, string][] = [
  ["overall", "Overall", "XP"], ["weekly", "This week", "Score"], ["monthly", "This month", "Score"], ["combo", "Combo", "Hits"],
  ["bosses", "Bosses", "Defeated"], ["wins", "Wins", "Clears"], ["area", "My area", "XP"], ["stage", "By stage", "Best"],
];
function Leaderboards({ me }: { me: MeResponse | null }) {
  const [board, setBoard] = useState("overall");
  const [area, setArea] = useState(me?.profile?.homeArea ?? "wuse");
  const [stage, setStage] = useState("01A");
  const [data, setData] = useState<{ rows: BoardRow[]; at: string } | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    let live = true;
    const extra = board === "area" ? `&area=${area}` : board === "stage" ? `&stage=${stage}` : "";
    const load = () => api.leaderboard(board, extra).then((d) => { if (live) { setData(d); setErr(false); } }).catch(() => live && setErr(true));
    void load();
    const t = setInterval(() => { if (!document.hidden) void load(); }, 10000);
    return () => { live = false; clearInterval(t); };
  }, [board, area, stage]);
  const tab = BOARD_TABS.find((b) => b[0] === board)!;
  const mine = me?.profile?.username;
  return (
    <section className="panel boards">
      <h1>Leaderboards</h1>
      <div className="tabs scroll">{BOARD_TABS.map(([id, label]) => <button key={id} className={board === id ? "on" : ""} onClick={() => setBoard(id)}>{label}</button>)}</div>
      {board === "area" && <select value={area} onChange={(e) => setArea(e.target.value)}>{AREAS.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>}
      {board === "stage" && <select value={stage} onChange={(e) => setStage(e.target.value)}>{SUBSTAGE_ORDER.map((s) => <option key={s} value={s}>{s} · {SUBSTAGES[s]!.name}</option>)}</select>}
      {err && <p className="error">Can&apos;t reach the leaderboard right now. Retrying…</p>}
      <table className="board">
        <thead><tr><th>#</th><th>Player</th><th className="hide-sm">Area</th><th className="hide-sm">Rank</th><th>{tab[2]}</th></tr></thead>
        <tbody>
          {data?.rows.map((r) => (
            <tr key={r.username} className={r.username === mine ? "me" : ""}>
              <td className="pos">{r.position}</td>
              <td><a href={`/p/${r.username}`}>{FIGHTERS[r.avatar] && portraitOf(FIGHTERS[r.avatar]!) && <img src={portraitOf(FIGHTERS[r.avatar]!)} alt="" />}@{r.username}</a><small>LV {r.level}</small></td>
              <td className="hide-sm">{AREAS.find((a) => a.id === r.area)?.name ?? r.area}</td>
              <td className="hide-sm">{r.rank}</td>
              <td className="val">{r.value.toLocaleString()}{r.rating ? <em> {r.rating}</em> : null}</td>
            </tr>
          ))}
          {data && !data.rows.length && <tr><td colSpan={5} className="muted">No verified runs here yet. Be the first.</td></tr>}
        </tbody>
      </table>
      {data && <p className="muted small">Live from verified runs · updated {new Date(data.at).toLocaleTimeString()}</p>}
    </section>
  );
}

/* ------------------------------------------------------------------ status + missions */
function Status({ me, onAuth }: { me: MeResponse | null; onAuth: () => void }) {
  const xp = me?.profile?.xp ?? 0;
  const cur = rankForXp(xp);
  const missions = me?.missions ?? activeMissions(new Date()).map((m) => ({ ...m, done: false }));
  return (
    <section className="panel status">
      <h1>Capital Status</h1>
      {!me?.user && <p className="muted">Sign in to start climbing. <button className="link" onClick={onAuth}>Create a profile</button></p>}
      <ol className="ladder">
        {RANKS.map((r) => {
          const done = xp >= r.xp, here = cur.rank === r.rank;
          const nextXp = RANKS[r.rank]?.xp;
          const pct = here && nextXp ? ((xp - r.xp) / (nextXp - r.xp)) * 100 : done ? 100 : 0;
          return (
            <li key={r.rank} className={`${done ? "done" : ""} ${here ? "here" : ""}`}>
              <span className="r-num">{r.rank}</span>
              <div><b>{r.name}</b><small>{r.xp.toLocaleString()} XP · {r.reward}</small>{here && nextXp && <div className="bar xp"><i style={{ width: `${pct}%` }} /></div>}</div>
            </li>
          );
        })}
      </ol>
      <h2>Missions</h2>
      <ul className="missions">
        {missions.map((m) => (
          <li key={m.id} className={m.done ? "done" : ""}>
            <span className="period">{m.period}</span>
            <div><b>{m.name}</b><small>{m.desc}</small></div>
            <span className="pay">+{m.xp} XP · +{cc(m.cash)}</span>
            {m.done && <span className="tick" aria-label="Done">✔</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------ store */
function Store({ me, onChange, onAuth }: { me: MeResponse | null; onChange: () => Promise<void>; onAuth: () => void }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const inv = new Set((me?.inventory ?? []).map((i) => i.id));
  const fighters = new Set(me?.fighters ?? []);
  const has = (id: string) => inv.has(id) || (id.startsWith("fighter_") && fighters.has(id.slice(8)));
  const buy = async (id: string, withNaira: boolean) => {
    if (!me?.user) { onAuth(); return; }
    setBusy(id); setMsg(null);
    try {
      if (withNaira) { const { authorizationUrl } = await api.checkout(id); location.href = authorizationUrl; return; }
      await api.buy(id); sfx("pickup"); setMsg("Added to your profile."); await onChange();
    } catch (e) {
      setMsg(e instanceof ApiError ? (e.status === 503 ? "Naira payments open soon. TCM is connecting Paystack." : e.message) : "Couldn't reach the server.");
    } finally { setBusy(null); }
  };
  return (
    <section className="panel store">
      <h1>Store</h1>
      <p className="muted">Cosmetics, convenience and unlocks you can also earn by playing. Nothing here changes damage, health or leaderboard scoring.</p>
      {msg && <p className="notice-inline" role="status">{msg}</p>}
      <div className="store-grid">
        {STORE.map((i) => (
          <article key={i.id} className={`item k-${i.kind}`}>
            <span className="kind">{i.kind}</span>
            <h3>{i.name}</h3>
            <p>{i.desc}</p>
            {(i.effect || i.duration) && <p className="small">{[i.effect, i.duration].filter(Boolean).join(" · ")}</p>}
            {i.restriction && <p className="small muted">{i.restriction}</p>}
            <div className="buy">
              {has(i.id) ? <span className="owned">Owned</span> : (
                <>
                  {i.cash !== null && <button className="btn small" disabled={busy === i.id || (me?.profile?.cash ?? 0) < i.cash && !!me?.user} onClick={() => buy(i.id, false)}>{cc(i.cash)}</button>}
                  {i.naira !== null && <button className="btn small gold" disabled={busy === i.id} onClick={() => buy(i.id, true)}>{naira(i.naira)}</button>}
                </>
              )}
            </div>
          </article>
        ))}
      </div>
      <p className="muted small">Naira purchases are only added after Paystack confirms the payment on our server.</p>
    </section>
  );
}

/* ------------------------------------------------------------------ profile */
function Profile({ me, onAuth, onSignOut }: { me: MeResponse | null; onAuth: () => void; onSignOut: () => void }) {
  const [copied, setCopied] = useState(false);
  const p = me?.profile;
  if (!p) return <section className="panel center-panel"><h1>Profile</h1><p>Create a profile to keep your record, rank and Capital Cash.</p><button className="btn" onClick={onAuth}>Sign in or sign up</button></section>;
  const f = FIGHTERS[p.avatar] ?? FIGHTERS[p.selectedFighter];
  const link = typeof location !== "undefined" ? `${location.origin}/p/${p.username}` : `/p/${p.username}`;
  const share = async () => {
    try { if (navigator.share) await navigator.share({ title: "Run The Capital", text: `I'm ${p.rank.name} in Run The Capital.`, url: link }); else { await navigator.clipboard.writeText(link); setCopied(true); } } catch { /* cancelled */ }
  };
  return (
    <section className="panel profile">
      <div className="card" style={{ ["--c" as string]: f?.colors.primary }}>
        {f && portraitOf(f) && <img src={portraitOf(f)} alt="" />}
        <div><small>{AREAS.find((a) => a.id === p.homeArea)?.name}</small><h1>@{p.username}</h1><b>{p.rank.name} · LV {p.level}</b>
          <div className="bar xp"><i style={{ width: `${p.rank.next ? Math.min(100, (p.xp / p.rank.next.xp) * 100) : 100}%` }} /></div>
          <small>{p.xp.toLocaleString()} XP{p.rank.next ? ` · ${(p.rank.next.xp - p.xp).toLocaleString()} to ${p.rank.next.name}` : ""}</small></div>
      </div>
      <div className="row"><button className="btn small" onClick={share}>{copied ? "Link copied" : "Share profile"}</button><button className="btn small ghost" onClick={onSignOut}>Sign out</button></div>
      <dl className="tally">
        {Object.entries(p.stats).map(([k, v]) => <div key={k}><dt>{k.replace(/([A-Z])/g, " $1")}</dt><dd>{Number(v).toLocaleString()}</dd></div>)}
      </dl>
      <h2>Achievements</h2>
      <ul className="ach-list">{ACHIEVEMENTS.map((a) => <li key={a.id} className={me?.achievements?.includes(a.id) ? "got" : ""}><b>{a.name}</b><small>{a.desc}</small></li>)}</ul>
      <h2>Capital Cash history</h2>
      <ul className="history">{(me?.history ?? []).slice(0, 15).map((h, i) => <li key={i}><span>{h.reason.replace(/_/g, " ")}</span><b className={h.amount < 0 ? "neg" : ""}>{h.amount > 0 ? "+" : ""}{cc(h.amount)}</b><small>{new Date(h.at).toLocaleDateString()}</small></li>)}</ul>
    </section>
  );
}

/* ------------------------------------------------------------------ settings */
function Settings() {
  const [keys, setKeys] = useState(loadKeys);
  const [listen, setListen] = useState<Action | null>(null);
  const [vol, setVol] = useState(() => loadVolume());
  const [pad, setPad] = useState<{ size: number; left: boolean }>(() => { try { return { size: 1, left: false, ...JSON.parse(localStorage.getItem("rtc.pad.v1") ?? "{}") }; } catch { return { size: 1, left: false }; } });
  useEffect(() => { try { localStorage.setItem("rtc.pad.v1", JSON.stringify(pad)); } catch { /* storage blocked */ } }, [pad]);
  useEffect(() => {
    if (!listen) return;
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      if (e.code === "Escape" && listen !== "pause") { setListen(null); return; }
      const next = { ...keys };
      for (const a of Object.keys(next) as Action[]) next[a] = next[a].filter((k) => k !== e.code);
      next[listen] = [e.code, ...(next[listen].filter((k) => k !== e.code).slice(0, 1))];
      setKeys(next); saveKeys(next); setListen(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [listen, keys]);
  return (
    <section className="panel settings">
      <h1>Settings</h1>
      <h2>Keyboard</h2>
      <ul className="keymap">
        {(Object.keys(ACTION_LABELS) as Action[]).map((a) => (
          <li key={a}><span>{ACTION_LABELS[a]}</span>
            <button className={`key ${listen === a ? "listen" : ""}`} onClick={() => setListen(a)}>{listen === a ? "Press a key…" : keys[a].map(keyLabel).join(" / ")}</button>
          </li>
        ))}
      </ul>
      <button className="btn small ghost" onClick={() => { setKeys({ ...DEFAULT_KEYS }); saveKeys({ ...DEFAULT_KEYS }); }}>Reset to defaults</button>
      <h2>Touch gamepad</h2>
      <label className="range">Button size<input type="range" min={0.8} max={1.4} step={0.05} value={pad.size} onChange={(e) => setPad({ ...pad, size: Number(e.target.value) })} /></label>
      <label className="check"><input type="checkbox" checked={pad.left} onChange={(e) => setPad({ ...pad, left: e.target.checked })} />Left-handed layout (buttons on the left)</label>
      <h2>Sound</h2>
      <label className="range">Volume<input type="range" min={0} max={1} step={0.05} value={vol} onChange={(e) => { setVol(Number(e.target.value)); setVolume(Number(e.target.value)); sfx("hit"); }} /></label>
    </section>
  );
}
