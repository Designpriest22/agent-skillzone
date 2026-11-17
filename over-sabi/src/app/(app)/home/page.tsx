import type { Metadata } from "next";
import Link from "next/link";
import { ToneContour } from "@/components/brand/ToneContour";
import { ButtonLink } from "@/components/ui/Button";
import { IconFlame } from "@/components/ui/icons";
import { Card, Eyebrow, Notice, Stat } from "@/components/ui/primitives";
import { requirePageUser } from "@/lib/auth/guards";
import { getActivePlan, getDashboard, nextLesson } from "@/lib/services/learner";

export const metadata: Metadata = { title: "Home" };

const GREET: Record<string, string> = { yo: "Ẹ kú àbọ̀", ig: "Nnọọ", ha: "Barka da zuwa" };

export default async function HomePage({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requirePageUser();
  const sp = await searchParams;
  const [plan, stats] = await Promise.all([getActivePlan(user.id), getDashboard(user.id)]);
  const next = plan?.course_id ? await nextLesson(user.id, plan.course_id) : null;
  const practisedToday = stats.last_active === stats.today;
  const greeting = plan ? GREET[plan.language_code as string] : undefined;

  return (
    <div className="flex flex-col gap-8">
      {sp.denied ? <Notice tone="warning">You don&apos;t have access to that page.</Notice> : null}
      <section>
        <Eyebrow>{plan ? `Learning ${plan.language_name}` : "Welcome"}</Eyebrow>
        <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">
          {greeting ? (
            <span className="lang-text" lang={plan!.language_code}>
              {greeting}
            </span>
          ) : (
            "Welcome"
          )}
          , {user.displayName || "friend"}.
        </h1>
        {plan?.language_code === "yo" && greeting ? <ToneContour text={greeting} className="mt-2" /> : null}
      </section>

      <section className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <Card className="flex flex-col gap-3 border-2 border-primary/40">
          <Eyebrow>Next up</Eyebrow>
          {next ? (
            <>
              <p className="text-sm text-muted">{next.chapter_title}</p>
              <p className="font-display text-2xl font-bold">{next.title}</p>
              <p className="text-muted">{next.summary}</p>
              <ButtonLink href={`/learn/${next.id}`} size="lg" className="mt-2 self-start">
                Start lesson · {next.estimated_minutes} min
              </ButtonLink>
            </>
          ) : (
            <>
              <p className="font-display text-2xl font-bold">You&apos;ve finished every published lesson.</p>
              <p className="text-muted">
                New chapters arrive as native-speaker reviewers approve them. Meanwhile, practise speaking or
                revise your words.
              </p>
              <ButtonLink href="/speak" className="mt-2 self-start">
                Practise speaking
              </ButtonLink>
            </>
          )}
        </Card>
        <Card className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className={`h-7 w-7 ${practisedToday ? "text-accent" : "text-muted"}`} aria-hidden>
              <IconFlame />
            </span>
            <p className="font-display text-2xl font-bold">
              {stats.streak} day{stats.streak === 1 ? "" : "s"}
            </p>
          </div>
          <p className="text-sm text-muted">
            {practisedToday ? "You've practised today. Nice." : "Practise today to keep your streak going."}
          </p>
          <p className="text-sm">
            Daily goal: <strong>{stats.dailyGoal} minutes</strong> · Today:{" "}
            <strong>{stats.xp_today} XP</strong>
          </p>
          {stats.due ? (
            <ButtonLink href="/review" variant="secondary" className="self-start">
              Review {stats.due} word{stats.due === 1 ? "" : "s"}
            </ButtonLink>
          ) : (
            <p className="text-sm text-muted">No revision due right now.</p>
          )}
        </Card>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total XP" value={stats.xp} />
        <Stat label="Lessons" value={stats.lessons} />
        <Stat label="Words & phrases" value={stats.words} />
        <Stat label="Conversations" value={stats.conversations} />
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/speak"
          className="rounded-[var(--radius-card)] bg-ink p-6 text-sand hover:brightness-110"
        >
          <Eyebrow className="!text-sand/70">Speak</Eyebrow>
          <p className="mt-2 font-display text-2xl font-bold">Have a conversation</p>
          <p className="mt-1 text-sm text-sand/80">
            Practise with {plan?.tutor_id ? "your AI tutor" : "an AI tutor"} — by voice where supported, or by
            typing.
          </p>
        </Link>
        <Link
          href="/vocabulary"
          className="rounded-[var(--radius-card)] border-2 border-border bg-surface p-6 hover:border-primary"
        >
          <Eyebrow>Notebook</Eyebrow>
          <p className="mt-2 font-display text-2xl font-bold">Your words</p>
          <p className="mt-1 text-sm text-muted">
            Everything you&apos;ve learned and saved, with revision dates.
          </p>
        </Link>
      </section>
    </div>
  );
}
