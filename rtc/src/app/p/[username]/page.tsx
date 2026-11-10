import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { publicProfile } from "@/lib/services/player";
import { HttpError } from "@/lib/http";
import { FIGHTERS } from "@/game/data/roster";
import { ACHIEVEMENTS } from "@/game/data/world";
import { ProfileActions } from "./ProfileActions";

export const dynamic = "force-dynamic";

async function load(username: string) {
  try { return await publicProfile(username); } catch (e) { if (e instanceof HttpError && e.status === 404) return null; throw e; }
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const p = await load((await params).username);
  if (!p) return { title: "Player not found · Run The Capital" };
  const f = FIGHTERS[p.avatar];
  return {
    title: `@${p.username} · ${p.rank.name} · Run The Capital`,
    description: `${p.rank.name}, level ${p.level}, #${p.position} in the capital. ${p.stats.bossesDefeated} bosses down.`,
    openGraph: { images: [f?.art.portrait?.replace(".png", ".webp") ?? "/game/logo.webp"] },
  };
}

export default async function PlayerPage({ params }: { params: Promise<{ username: string }> }) {
  const p = await load((await params).username);
  if (!p) notFound();
  const f = FIGHTERS[p.avatar] ?? FIGHTERS[p.selectedFighter];
  const portrait = f?.art.portrait?.replace(".png", ".webp");
  return (
    <div className="app">
      <header className="topbar"><a className="brand" href="/"><img src="/game/logo.webp" alt="Run The Capital" /></a><a className="btn small" href="/">Play</a></header>
      <main className="screen">
        <section className="panel profile">
          <div className="card" style={{ ["--c" as string]: f?.colors.primary }}>
            {portrait && <img src={portrait} alt="" />}
            <div><small>{p.area} · #{p.position} in the capital</small><h1>@{p.username}</h1><b>{p.rank.name} · LV {p.level}</b></div>
          </div>
          <ProfileActions username={p.username} />
          <dl className="tally">
            {Object.entries(p.stats).map(([k, v]) => <div key={k}><dt>{k.replace(/([A-Z])/g, " $1")}</dt><dd>{Number(v).toLocaleString()}</dd></div>)}
          </dl>
          <h2>Achievements</h2>
          <ul className="ach-list">{ACHIEVEMENTS.map((a) => <li key={a.id} className={p.achievements.includes(a.id) ? "got" : ""}><b>{a.name}</b><small>{a.desc}</small></li>)}</ul>
        </section>
      </main>
    </div>
  );
}
