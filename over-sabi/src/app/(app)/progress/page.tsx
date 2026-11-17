import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, EmptyState, Notice, PageHeader, Stat } from "@/components/ui/primitives";
import { ShareAchievement } from "@/components/app/ShareAchievement";
import { requirePageUser } from "@/lib/auth/guards";
import { formatDuration } from "@/lib/dates";
import { db, withUser } from "@/lib/db";
import { getDashboard } from "@/lib/services/learner";

export const metadata: Metadata = { title: "Progress" };

const TYPE_LABEL: Record<string, string> = {
  grammar: "Grammar",
  vocabulary: "Word choice",
  spelling: "Spelling",
  tone_marks: "Tone marks & dots",
  register: "Respect & register",
  fluency: "Fluency",
  pronunciation: "Pronunciation",
};

export default async function ProgressPage() {
  const user = await requirePageUser();
  const stats = await getDashboard(user.id);
  const data = await withUser(user.id, async (tx) => {
    const days = await tx`
      select d::date::text as day, coalesce(sum(x.amount), 0)::int as xp
      from generate_series(${stats.today}::date - 13, ${stats.today}::date, interval '1 day') d
      left join xp_events x on x.local_date = d::date and x.user_id = ${user.id}
      group by d order by d`;
    const [listening] = await tx`
      select count(*)::int as total, count(*) filter (where at.correct)::int as correct
      from activity_attempts at join lesson_activities a on a.id = at.activity_id
      where at.user_id = ${user.id} and a.type = 'listening'`;
    const [retention] = await tx`
      select count(*) filter (where repetitions >= 2)::int as remembered, count(*) filter (where last_reviewed_at is not null)::int as reviewed,
        coalesce(sum(lapses), 0)::int as lapses from user_vocabulary where user_id = ${user.id}`;
    const [speaking] = await tx`
      select count(*)::int as sessions, coalesce(sum(duration_seconds), 0)::int as seconds,
        coalesce(sum(greatest(turn_count - 1, 0)), 0)::int as turns from learning_sessions where user_id = ${user.id}`;
    const feedback = await tx`
      select type, count(*)::int as n, (array_agg(json_build_object('o', original, 'c', corrected, 'e', explanation) order by created_at desc))[1:2] as examples
      from feedback_items where user_id = ${user.id} group by type order by n desc`;
    const earned = await tx`select code, earned_at from user_achievements where user_id = ${user.id}`;
    const [profile] = await tx`select leaderboard_opt_in, age_band from profiles where user_id = ${user.id}`;
    return { days, listening, retention, speaking, feedback, earned, profile };
  });
  const achievements = await db()`select code, name, description, icon from achievements order by sort_order`;
  const earnedSet = new Map(data.earned.map((e) => [e.code as string, e.earned_at as Date]));
  const leaderboard = data.profile?.leaderboard_opt_in
    ? await db()`
        select u.display_name, sum(x.amount)::int as xp, (u.id = ${user.id}) as me
        from xp_events x join users u on u.id = x.user_id join profiles p on p.user_id = u.id
        where p.leaderboard_opt_in and p.age_band = 'adult' and x.created_at > now() - interval '7 days'
        group by u.id order by xp desc limit 10`
    : [];
  const maxXp = Math.max(10, ...data.days.map((d) => d.xp as number));

  return (
    <div className="flex flex-col gap-10">
      <PageHeader eyebrow="Progress" title="How you're doing">
        Engagement (XP, streaks) shows effort. Retention and accuracy show what&apos;s actually sticking — we
        show both, separately.
      </PageHeader>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Current streak" value={`${stats.streak}d`} hint={`Longest: ${stats.longest} days`} />
        <Stat label="Total XP" value={stats.xp} />
        <Stat label="Lessons completed" value={stats.lessons} />
        <Stat label="Words & phrases" value={stats.words} />
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">Last 14 days</h2>
        <Card>
          <svg
            viewBox={`0 0 ${14 * 24} 120`}
            className="h-40 w-full"
            role="img"
            aria-label={`XP per day for the last 14 days: ${data.days.map((d) => d.xp).join(", ")}`}
          >
            {data.days.map((d, i) => {
              const h = ((d.xp as number) / maxXp) * 96;
              return (
                <g key={d.day as string}>
                  <rect
                    x={i * 24 + 4}
                    y={104 - h}
                    width={16}
                    height={Math.max(h, 1)}
                    rx={4}
                    fill={(d.day as string) === stats.today ? "var(--color-accent)" : "var(--color-primary)"}
                  />
                  <text
                    x={i * 24 + 12}
                    y={118}
                    textAnchor="middle"
                    fontSize="8"
                    fill="currentColor"
                    opacity="0.6"
                  >
                    {(d.day as string).slice(8)}
                  </text>
                </g>
              );
            })}
          </svg>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <h3 className="font-display text-lg font-bold">Retention</h3>
          <p className="mt-1 font-display text-3xl font-extrabold">{data.retention?.remembered ?? 0}</p>
          <p className="text-sm text-muted">
            words recalled correctly in 2+ reviews · {data.retention?.lapses ?? 0} forgotten and relearned
          </p>
        </Card>
        <Card>
          <h3 className="font-display text-lg font-bold">Listening</h3>
          <p className="mt-1 font-display text-3xl font-extrabold">
            {data.listening?.total
              ? `${Math.round((data.listening.correct / data.listening.total) * 100)}%`
              : "—"}
          </p>
          <p className="text-sm text-muted">accuracy over {data.listening?.total ?? 0} listening exercises</p>
        </Card>
        <Card>
          <h3 className="font-display text-lg font-bold">Speaking</h3>
          <p className="mt-1 font-display text-3xl font-extrabold">{data.speaking?.turns ?? 0}</p>
          <p className="text-sm text-muted">
            replies across {data.speaking?.sessions ?? 0} conversations ·{" "}
            {formatDuration(data.speaking?.seconds ?? 0)}
          </p>
        </Card>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">Grammar and usage insights</h2>
        {data.feedback.length ? (
          <ul className="grid gap-3 md:grid-cols-2">
            {data.feedback.map((f) => (
              <li key={f.type as string}>
                <Card>
                  <p className="flex items-center justify-between font-semibold">
                    {TYPE_LABEL[f.type as string] ?? f.type} <Badge>{f.n} corrections</Badge>
                  </p>
                  {(f.examples as { o: string; c: string; e: string }[]).map((ex, i) => (
                    <p key={i} className="mt-2 text-sm">
                      <span className="lang-text line-through opacity-70">{ex.o}</span> →{" "}
                      <strong className="lang-text">{ex.c}</strong>
                      <span className="block text-muted">{ex.e}</span>
                    </p>
                  ))}
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No corrections yet">
            Patterns from your tutor conversations show up here, so you can see what to work on.
          </EmptyState>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">Pronunciation insights</h2>
        <Notice tone="info">
          Not available yet. We won&apos;t show pronunciation scores until a pronunciation model has been
          tested with native speakers for each language. Meanwhile, record yourself in{" "}
          <Link href="/speak/dialogues">guided dialogues</Link> and compare.
        </Notice>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">Achievements</h2>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {achievements.map((a) => {
            const at = earnedSet.get(a.code as string);
            return (
              <li
                key={a.code as string}
                className={`flex flex-col gap-1 rounded-2xl border-2 p-4 ${at ? "border-primary bg-surface" : "border-dashed border-border opacity-60"}`}
              >
                <p className="font-display font-bold">{a.name}</p>
                <p className="text-xs text-muted">{a.description}</p>
                {at ? (
                  <ShareAchievement name={a.name as string} />
                ) : (
                  <span className="text-xs text-muted">Not yet</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">Weekly leaderboard</h2>
        {data.profile?.age_band === "teen" ? (
          <p className="text-sm text-muted">Leaderboards are only for learners aged 18 and over.</p>
        ) : !data.profile?.leaderboard_opt_in ? (
          <p className="text-sm text-muted">
            Leaderboards are optional and off by default.{" "}
            <Link href="/settings#privacy" className="underline">
              Join in Settings
            </Link>{" "}
            — only your display name and weekly XP are shown.
          </p>
        ) : (
          <ol className="divide-y divide-border rounded-2xl border border-border bg-surface">
            {leaderboard.map((r, i) => (
              <li key={i} className={`flex justify-between px-4 py-2.5 ${r.me ? "font-bold" : ""}`}>
                <span>
                  {i + 1}. {r.display_name || "Learner"}
                  {r.me ? " (you)" : ""}
                </span>
                <span>{r.xp} XP</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
