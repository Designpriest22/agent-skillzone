import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ButtonLink } from "@/components/ui/Button";
import { Notice, PageHeader } from "@/components/ui/primitives";
import type { SessionSummary } from "@/lib/ai/schemas";
import { requirePageUser } from "@/lib/auth/guards";
import { formatDuration } from "@/lib/dates";
import { withUser } from "@/lib/db";
import { getTranscript } from "@/lib/services/tutor";

export const metadata: Metadata = { title: "Conversation transcript" };

export default async function HistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePageUser();
  if (!z.string().uuid().safeParse(id).success) notFound();
  const [s] = await withUser(
    user.id,
    (tx) => tx`
    select s.*, l.name as language_name from learning_sessions s join languages l on l.code = s.language_code where s.id = ${id}`,
  );
  if (!s) notFound();
  const turns = await getTranscript(user.id, id);
  const summary = s.summary as SessionSummary | null;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={`${s.language_name} · ${new Date(s.started_at).toLocaleDateString("en-GB", { dateStyle: "long" })}`}
        title="Conversation transcript"
      >
        {formatDuration(s.duration_seconds)} · {turns.filter((t) => t.role === "learner").length} messages
        from you.
        {s.transcript_expires_at
          ? ` Transcript kept until ${new Date(s.transcript_expires_at).toLocaleDateString("en-GB", { dateStyle: "medium" })}; the summary stays.`
          : ""}
      </PageHeader>
      {summary ? (
        <Notice tone="info" title="Summary">
          {summary.summary} <strong>Next:</strong> {summary.nextStep}
        </Notice>
      ) : null}
      {turns.length ? (
        <ol className="flex flex-col gap-3">
          {turns.map((t) => (
            <li
              key={t.id}
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${t.role === "learner" ? "self-end bg-primary text-on-primary" : "self-start bg-surface-2"}`}
            >
              <p className="lang-text">{t.text}</p>
              {t.translation ? <p className="text-sm text-muted">{t.translation}</p> : null}
              {t.corrections.map((c, i) => (
                <p key={i} className="mt-1 text-sm">
                  <span className="line-through opacity-70">{c.original}</span> →{" "}
                  <strong>{c.corrected}</strong> — {c.explanation}
                </p>
              ))}
            </li>
          ))}
        </ol>
      ) : (
        <Notice tone="info">
          This transcript has been deleted under our retention policy. The summary above is kept.
        </Notice>
      )}
      <ButtonLink href="/speak" variant="secondary" className="self-start">
        Back to Speak
      </ButtonLink>
    </div>
  );
}
