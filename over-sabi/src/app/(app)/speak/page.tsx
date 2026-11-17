import type { Metadata } from "next";
import Link from "next/link";
import { AiBadge, TutorAvatar } from "@/components/brand/TutorAvatar";
import { StartSessionButton } from "@/components/speak/StartSession";
import { ButtonLink } from "@/components/ui/Button";
import { Badge, Card, EmptyState, Notice, PageHeader } from "@/components/ui/primitives";
import { requirePageUser } from "@/lib/auth/guards";
import { formatDuration } from "@/lib/dates";
import { db, withUser } from "@/lib/db";
import { getEntitlement, getUsageToday } from "@/lib/entitlements";
import { speakContext } from "@/lib/services/speak-page";

export const metadata: Metadata = { title: "Speak" };

const CAP_TONE = { available: "success", experimental: "warning", unavailable: "neutral" } as const;

export default async function SpeakPage() {
  const user = await requirePageUser();
  const ctx = await speakContext(user.id);
  if (!ctx)
    return (
      <EmptyState
        title="Pick a language first"
        action={<ButtonLink href="/onboarding">Set up your plan</ButtonLink>}
      />
    );
  const tutorId = (ctx.plan.tutor_id as string | null) ?? null;
  const [tutor] = tutorId
    ? await db()`select id, name, tagline, avatar_key from tutors where id = ${tutorId}`
    : await db()`select id, name, tagline, avatar_key from tutors where language_code = ${ctx.language.code} and status = 'active' order by sort_order limit 1`;
  const [ent, usage, sessions] = await Promise.all([
    getEntitlement(user.id),
    getUsageToday(user.id),
    withUser(
      user.id,
      (tx) => tx`
      select s.id, s.started_at, s.duration_seconds, s.turn_count, s.status, t.name as tutor_name, l.name as language_name
      from learning_sessions s left join tutors t on t.id = s.tutor_id join languages l on l.code = s.language_code
      where s.user_id = ${user.id} order by s.started_at desc limit 10`,
    ),
  ]);
  const tutorUnavailable = ctx.language.tutor_status === "unavailable";

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow={`Speaking practice · ${ctx.language.name}`} title="Have a conversation">
        Talk with an AI tutor about everyday things. You&apos;ll get gentle corrections, translations when you
        need them and a summary at the end.
      </PageHeader>

      {!ctx.tutorConfigured ? (
        <Notice tone="warning" title="The AI tutor isn't connected on this server yet">
          The conversation feature needs an AI provider key, which hasn&apos;t been configured. Until then,
          practise with <Link href="/speak/dialogues">guided dialogues</Link> — real conversations from your
          lessons that you can read, record and replay.
        </Notice>
      ) : null}

      {tutor ? (
        <Card className="flex flex-col gap-5 md:flex-row md:items-center">
          <TutorAvatar avatarKey={tutor.avatar_key} name={tutor.name} size={88} />
          <div className="flex flex-1 flex-col gap-2">
            <p className="flex items-center gap-2 font-display text-2xl font-bold">
              {tutor.name} <AiBadge />
            </p>
            <p className="text-muted">{tutor.tagline}</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge tone={ctx.language.tutor_status === "validated" ? "success" : "warning"}>
                {ctx.language.tutor_status === "validated"
                  ? "Tutor quality reviewed"
                  : `AI ${ctx.language.name} is experimental`}
              </Badge>
              <Badge tone={CAP_TONE[ctx.stt.status]}>Voice input: {ctx.stt.status}</Badge>
              <Badge tone={CAP_TONE[ctx.tts.status]}>Tutor voice: {ctx.tts.status}</Badge>
              <Badge>
                {ctx.settings.mode} · {ctx.settings.sessionMinutes} min
              </Badge>
            </div>
            <p className="text-xs text-muted">
              Today: {usage.ai_turns} of {ent.limits.daily_ai_turns} tutor replies used on the {ent.planName}{" "}
              plan.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <StartSessionButton
              language={ctx.language.code}
              tutorId={tutor.id}
              disabled={!ctx.tutorConfigured || tutorUnavailable}
            />
            <Link href="/speak/tutors" className="text-sm underline">
              Change tutor or settings
            </Link>
          </div>
        </Card>
      ) : (
        <EmptyState title="No tutors for this language yet" />
      )}

      {ctx.stt.status !== "available" ? (
        <p className="text-sm text-muted">
          <strong>About voice:</strong> {ctx.stt.reason} You can always type — it works the same way.{" "}
          <Link href={`/languages/${ctx.language.code}`} className="underline">
            What&apos;s tested for {ctx.language.name}?
          </Link>
        </p>
      ) : null}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold">Recent conversations</h2>
          <Link href="/speak/dialogues" className="text-sm underline">
            Guided dialogues
          </Link>
        </div>
        {sessions.length ? (
          <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
            {sessions.map((s) => (
              <li key={s.id}>
                <Link
                  href={s.status === "active" ? `/speak/session/${s.id}` : `/speak/history/${s.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-2"
                >
                  <span>
                    <span className="font-semibold">
                      {s.tutor_name ?? "Tutor"} · {s.language_name}
                    </span>
                    <span className="block text-sm text-muted">
                      {new Date(s.started_at).toLocaleString("en-GB", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}{" "}
                      · {formatDuration(s.duration_seconds)} · {Math.max(0, s.turn_count - 1)} replies
                    </span>
                  </span>
                  <Badge tone={s.status === "active" ? "accent" : "neutral"}>
                    {s.status === "active" ? "Continue" : "Transcript"}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No conversations yet">
            Your transcripts and summaries will appear here.
          </EmptyState>
        )}
      </section>
    </div>
  );
}
