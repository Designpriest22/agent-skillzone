"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { IconCheck, IconX } from "@/components/ui/icons";
import { Notice, ProgressBar, ReviewBadge } from "@/components/ui/primitives";
import { ReportButton } from "@/components/content/ReportButton";
import { api, ApiError } from "@/lib/client/api";
import { anonymousId, readGuestProgress, writeGuestProgress } from "@/lib/client/guest";
import type { ActivityResponse, ActivityResult } from "@/lib/content/activity-types";
import type { LessonForPlayer } from "@/lib/content/repo";
import { ACHIEVEMENT_NAMES } from "@/lib/achievement-names";
import {
  DialogueActivity,
  ListeningActivity,
  MatchingActivity,
  RecapActivity,
  ReviewActivity,
  TranslationActivity,
  WordOrderActivity,
} from "./Activities";

interface Completion {
  score: number;
  xpEarned?: number;
  newAchievements?: string[];
  streakDays?: number;
}

export function LessonPlayer({ lesson, mode }: { lesson: LessonForPlayer; mode: "guest" | "user" }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<ActivityResult | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [completion, setCompletion] = useState<Completion | null>(null);
  const [saved, setSaved] = useState<Set<string>>(() =>
    mode === "guest" ? new Set(readGuestProgress().savedVocabIds) : new Set(),
  );
  const [attemptKey, setAttemptKey] = useState(0);

  const activity = lesson.activities[index];
  const total = lesson.activities.length;
  const lang = lesson.language.code;

  async function submit(response: ActivityResponse) {
    if (!activity) return;
    setPending(true);
    setError(null);
    try {
      const r = await api<ActivityResult>(`/api/lessons/${lesson.id}/attempt`, {
        body: { activityId: activity.id, response },
      });
      setResult(r);
      if (activity.type !== "recap") setScores((s) => ({ ...s, [activity.id]: r.score }));
      if (activity.type === "recap") next(r);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't check your answer. Try again.");
    } finally {
      setPending(false);
    }
  }

  async function finish() {
    const graded = lesson.activities.filter((a) => a.type !== "recap");
    const score = graded.length
      ? Math.round((graded.reduce((s, a) => s + (scores[a.id] ?? 0), 0) / graded.length) * 100)
      : 100;
    if (mode === "guest") {
      writeGuestProgress((g) => ({
        ...g,
        completedLessons: [
          ...g.completedLessons.filter((l) => l.lessonId !== lesson.id),
          { lessonId: lesson.id, score },
        ],
      }));
      api("/api/guest/event", {
        body: { name: "guest_lesson_completed", anonymousId: anonymousId(), language: lang },
      }).catch(() => {});
      setCompletion({ score });
      return;
    }
    setPending(true);
    try {
      setCompletion(await api<Completion>(`/api/lessons/${lesson.id}/complete`, { method: "POST" }));
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save your progress. Try again.");
    } finally {
      setPending(false);
    }
  }

  function next(r: ActivityResult | null = result) {
    void r;
    setResult(null);
    setAttemptKey((k) => k + 1);
    if (index + 1 >= total) void finish();
    else setIndex((i) => i + 1);
  }

  async function save(vocabId: string) {
    if (mode === "guest") {
      writeGuestProgress((g) => ({ ...g, savedVocabIds: [...new Set([...g.savedVocabIds, vocabId])] }));
      setSaved((s) => new Set(s).add(vocabId));
      return;
    }
    try {
      await api("/api/vocabulary", { body: { vocabId } });
      setSaved((s) => new Set(s).add(vocabId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save that word.");
    }
  }

  if (completion) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-5 py-10 text-center" aria-live="polite">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">Lesson complete</p>
        <h2 className="text-4xl font-extrabold">
          {completion.score >= 80 ? "You sabi!" : completion.score >= 50 ? "Good work." : "That's a start."}
        </h2>
        <p className="text-lg">
          Score <strong>{completion.score}%</strong>
          {completion.xpEarned !== undefined ? (
            <>
              {" "}
              · <strong>+{completion.xpEarned} XP</strong>
            </>
          ) : null}
          {completion.streakDays ? <> · {completion.streakDays}-day streak</> : null}
        </p>
        {completion.newAchievements?.length ? (
          <Notice tone="success" title="New achievement">
            {completion.newAchievements.map((a) => ACHIEVEMENT_NAMES[a] ?? a).join(", ")}
          </Notice>
        ) : null}
        {mode === "guest" ? (
          <div className="flex w-full flex-col gap-3 rounded-2xl bg-surface-2 p-5">
            <p className="font-semibold">Keep this progress</p>
            <p className="text-sm text-muted">
              Create a free account to save your lesson, keep a streak and practise speaking with an AI tutor.
            </p>
            <ButtonLink href="/signup" size="lg">
              Save my progress
            </ButtonLink>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-3">
            {lesson.nextLessonId ? (
              <ButtonLink href={`/learn/${lesson.nextLessonId}`} size="lg">
                Next lesson
              </ButtonLink>
            ) : null}
            <ButtonLink href="/speak" variant="secondary" size="lg">
              Practise speaking
            </ButtonLink>
            <ButtonLink href="/learn" variant="ghost" size="lg">
              Back to course
            </ButtonLink>
          </div>
        )}
      </div>
    );
  }

  if (!activity) return <Notice tone="warning">This lesson has no activities yet.</Notice>;

  const common = { language: lang, disabled: pending || !!result };
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link
          href={mode === "guest" ? "/try" : "/learn"}
          className="rounded-full p-2 hover:bg-surface-2"
          aria-label="Leave lesson"
        >
          <span className="block h-5 w-5">
            <IconX />
          </span>
        </Link>
        <ProgressBar value={(index / total) * 100} label={`Activity ${index + 1} of ${total}`} />
        <span className="shrink-0 font-mono text-xs text-muted">
          {index + 1}/{total}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <span>
          {lesson.language.name} · {lesson.chapterTitle} · {lesson.title}
        </span>
        <ReviewBadge status={lesson.reviewStatus} />
      </div>

      <section key={`${activity.id}-${attemptKey}`} aria-label={`Activity ${index + 1}`} className="min-h-72">
        {activity.type === "listening" && (
          <ListeningActivity
            {...common}
            payload={activity.payload}
            audioUrl={activity.audioUrl}
            onSubmit={submit}
          />
        )}
        {activity.type === "translation" && (
          <TranslationActivity {...common} payload={activity.payload} onSubmit={submit} />
        )}
        {activity.type === "word_order" && (
          <WordOrderActivity {...common} payload={activity.payload} onSubmit={submit} />
        )}
        {activity.type === "matching" && (
          <MatchingActivity {...common} payload={activity.payload} onSubmit={submit} />
        )}
        {activity.type === "dialogue" && (
          <DialogueActivity {...common} payload={activity.payload} onSubmit={submit} />
        )}
        {activity.type === "review" && (
          <ReviewActivity
            {...common}
            payload={activity.payload}
            questions={activity.questions}
            onSubmit={submit}
          />
        )}
        {activity.type === "recap" && (
          <>
            <RecapActivity
              {...common}
              payload={activity.payload}
              vocabulary={lesson.vocabulary}
              onSave={save}
              saved={saved}
              onSubmit={submit}
            />
            {lesson.culturalNotes.map((n) => (
              <aside key={n.id} className="mt-6 rounded-2xl border-l-4 border-accent bg-surface p-4">
                <div className="flex items-center gap-2">
                  <p className="font-display font-bold">Culture note: {n.title}</p>
                  <ReviewBadge status={n.review_status} />
                </div>
                <p className="mt-1 text-sm">{n.body}</p>
              </aside>
            ))}
          </>
        )}
      </section>

      {error ? <Notice tone="danger">{error}</Notice> : null}

      {result && activity.type !== "recap" ? (
        <div
          role="status"
          aria-live="polite"
          className={`sticky bottom-20 flex flex-col gap-3 rounded-2xl border-2 p-4 lg:bottom-4 ${
            result.correct
              ? "border-success bg-success/10"
              : result.nearMiss
                ? "border-warning bg-warning/10"
                : "border-danger bg-danger/10"
          }`}
        >
          <div className="flex items-start gap-3">
            <span
              className={`mt-0.5 h-6 w-6 shrink-0 ${result.correct ? "text-success" : "text-danger"}`}
              aria-hidden
            >
              {result.correct ? <IconCheck /> : <IconX />}
            </span>
            <div>
              <p className="font-bold">
                {result.correct ? "Correct" : result.nearMiss ? "Almost" : "Not quite"}
              </p>
              <p className="text-sm">{result.feedback}</p>
              {!result.correct && result.expected ? (
                <p className="lang-text mt-1 text-sm" lang={lang}>
                  Answer: <strong>{result.expected}</strong>
                </p>
              ) : null}
              {result.items
                ?.filter((i) => !i.correct)
                .map((i) => (
                  <p key={i.vocabId} className="text-sm">
                    Remember: <strong>{i.expected}</strong>
                  </p>
                ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={() => next()} autoFocus>
              Continue
            </Button>
            {!result.correct ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setResult(null);
                  setAttemptKey((k) => k + 1);
                }}
              >
                Try again
              </Button>
            ) : null}
            <ReportButton entityType="activity" entityId={activity.id} language={lang} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
