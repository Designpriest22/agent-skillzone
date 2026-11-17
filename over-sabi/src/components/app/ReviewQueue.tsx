"use client";
import { useEffect, useState } from "react";
import { ToneContour } from "@/components/brand/ToneContour";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Badge, EmptyState, Notice, ProgressBar, Skeleton } from "@/components/ui/primitives";
import { api, ApiError } from "@/lib/client/api";

interface Card {
  id: string;
  language_code: string;
  term: string;
  meaning: string;
  context_note: string | null;
  literal_meaning: string | null;
  unverified: boolean;
}

const GRADES = [
  { grade: 0, label: "Forgot", hint: "Again in 10 minutes" },
  { grade: 3, label: "Hard", hint: "Sooner" },
  { grade: 4, label: "Good", hint: "On schedule" },
  { grade: 5, label: "Easy", hint: "Later" },
] as const;

/** Flashcard revision: recall the meaning, reveal, then rate how well you remembered. */
export function ReviewQueue() {
  const [cards, setCards] = useState<Card[] | null>(null);
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(0);

  useEffect(() => {
    api<{ cards: Card[] }>("/api/review")
      .then((r) => setCards(r.cards))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load your cards."));
  }, []);

  async function grade(g: number) {
    const card = cards?.[i];
    if (!card) return;
    setPending(true);
    try {
      await api("/api/review", { body: { id: card.id, grade: g } });
      setDone((d) => d + 1);
      setRevealed(false);
      setI((x) => x + 1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save. Try again.");
    } finally {
      setPending(false);
    }
  }

  if (error) return <Notice tone="danger">{error}</Notice>;
  if (!cards)
    return (
      <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading cards">
        <Skeleton className="h-48" />
        <Skeleton className="h-12 w-1/2" />
      </div>
    );
  if (!cards.length)
    return (
      <EmptyState
        title="Nothing due right now"
        action={<ButtonLink href="/learn">Learn something new</ButtonLink>}
      >
        You&apos;re up to date. New and forgotten words come back here on schedule.
      </EmptyState>
    );
  const card = cards[i];
  if (!card)
    return (
      <EmptyState
        title={`Done — ${done} card${done === 1 ? "" : "s"} reviewed`}
        action={<ButtonLink href="/home">Back home</ButtonLink>}
      >
        Nice work. We&apos;ll bring these back at the right time.
      </EmptyState>
    );
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <ProgressBar value={(i / cards.length) * 100} label={`Card ${i + 1} of ${cards.length}`} />
      <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border-2 border-border bg-surface p-8 text-center">
        {card.unverified ? <Badge tone="danger">Unverified · from a conversation</Badge> : null}
        <p className="lang-text font-display text-4xl font-extrabold" lang={card.language_code}>
          {card.term}
        </p>
        {card.language_code === "yo" ? <ToneContour text={card.term} /> : null}
        {revealed ? (
          <div aria-live="polite">
            <p className="text-xl">{card.meaning}</p>
            {card.literal_meaning ? (
              <p className="text-sm text-muted">Literally: {card.literal_meaning}</p>
            ) : null}
            {card.context_note ? <p className="mt-2 text-sm text-muted">{card.context_note}</p> : null}
          </div>
        ) : (
          <p className="text-muted">What does it mean? Say it out loud, then check.</p>
        )}
      </div>
      {revealed ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {GRADES.map((g) => (
            <button
              key={g.grade}
              type="button"
              disabled={pending}
              onClick={() => grade(g.grade)}
              className="flex min-h-16 flex-col items-center justify-center rounded-2xl border-2 border-border bg-surface font-semibold hover:border-primary disabled:opacity-50"
            >
              {g.label}
              <span className="text-xs font-normal text-muted">{g.hint}</span>
            </button>
          ))}
        </div>
      ) : (
        <Button size="lg" onClick={() => setRevealed(true)}>
          Show answer
        </Button>
      )}
    </div>
  );
}
