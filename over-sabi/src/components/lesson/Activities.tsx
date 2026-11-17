"use client";
import { useMemo, useRef, useState } from "react";
import { ToneContour } from "@/components/brand/ToneContour";
import { Button } from "@/components/ui/Button";
import { IconPlay } from "@/components/ui/icons";
import type {
  ActivityResponse,
  DialoguePayload,
  ListeningPayload,
  MatchingPayload,
  RecapPayload,
  ReviewQuestion,
  TranslationPayload,
  WordOrderPayload,
} from "@/lib/content/activity-types";

export interface ActivityProps<P> {
  payload: P;
  language: string;
  disabled: boolean;
  onSubmit: (response: ActivityResponse) => void;
}

/** Letters learners need but most keyboards lack. Tone marks are combining characters. */
const SPECIAL_KEYS: Record<string, { label: string; insert: string; title: string }[]> = {
  yo: [
    { label: "ẹ", insert: "ẹ", title: "e with dot below" },
    { label: "ọ", insert: "ọ", title: "o with dot below" },
    { label: "ṣ", insert: "ṣ", title: "s with dot below" },
    { label: "◌́", insert: "́", title: "High tone (acute) — add after the vowel" },
    { label: "◌̀", insert: "̀", title: "Low tone (grave) — add after the vowel" },
  ],
  ig: [
    { label: "ị", insert: "ị", title: "i with dot below" },
    { label: "ọ", insert: "ọ", title: "o with dot below" },
    { label: "ụ", insert: "ụ", title: "u with dot below" },
    { label: "ṅ", insert: "ṅ", title: "n with dot above" },
  ],
  ha: [
    { label: "ɓ", insert: "ɓ", title: "hooked b" },
    { label: "ɗ", insert: "ɗ", title: "hooked d" },
    { label: "ƙ", insert: "ƙ", title: "hooked k" },
    { label: "ƴ", insert: "ƴ", title: "hooked y" },
    { label: "'", insert: "'", title: "apostrophe (as in 'ya)" },
  ],
};

export function SpecialKeys({ language, onInsert }: { language: string; onInsert: (s: string) => void }) {
  const keys = SPECIAL_KEYS[language];
  if (!keys) return null;
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Special characters">
      {keys.map((k) => (
        <button
          key={k.label}
          type="button"
          title={k.title}
          aria-label={k.title}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onInsert(k.insert)}
          className="lang-text min-h-10 min-w-10 rounded-lg border border-border bg-surface text-lg hover:bg-surface-2"
        >
          {k.label}
        </button>
      ))}
    </div>
  );
}

function ChoiceList({
  options,
  disabled,
  onPick,
  lang,
}: {
  options: string[];
  disabled: boolean;
  onPick: (i: number) => void;
  lang?: boolean;
}) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {options.map((o, i) => (
        <button
          key={`${o}-${i}`}
          type="button"
          disabled={disabled}
          onClick={() => onPick(i)}
          className={`min-h-14 rounded-2xl border-2 border-border bg-surface px-4 py-3 text-left text-base font-medium hover:border-primary disabled:opacity-60 ${lang ? "lang-text text-lg" : ""}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export function ListeningActivity({
  payload,
  language,
  disabled,
  onSubmit,
  audioUrl,
}: ActivityProps<ListeningPayload> & { audioUrl: string | null }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [revealed, setRevealed] = useState(!audioUrl);
  return (
    <div className="flex flex-col gap-5">
      <p className="text-lg font-semibold">{payload.prompt}</p>
      <div className="flex flex-col items-start gap-3 rounded-2xl bg-surface-2 p-5">
        {audioUrl ? (
          <>
            <audio ref={audioRef} src={audioUrl} preload="none" />
            <Button
              type="button"
              variant="primary"
              onClick={() => audioRef.current?.play()}
              aria-label="Play recording"
            >
              <span className="h-5 w-5">
                <IconPlay />
              </span>
              Play
            </Button>
            {!revealed ? (
              <button type="button" className="text-sm underline" onClick={() => setRevealed(true)}>
                Show the words
              </button>
            ) : null}
          </>
        ) : (
          <p className="text-xs text-muted">No native-speaker recording yet — read it, then say it aloud.</p>
        )}
        {revealed ? (
          <div>
            <p className="lang-text font-display text-3xl font-bold" lang={language}>
              {payload.text}
            </p>
            {language === "yo" ? <ToneContour text={payload.text} className="mt-2" showLegend /> : null}
          </div>
        ) : null}
      </div>
      <ChoiceList
        options={payload.options}
        disabled={disabled}
        onPick={(index) => onSubmit({ type: "listening", index })}
      />
    </div>
  );
}

export function TranslationActivity({
  payload,
  language,
  disabled,
  onSubmit,
}: ActivityProps<TranslationPayload>) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const toTarget = payload.direction === "to_target";
  function insert(s: string) {
    const el = inputRef.current;
    if (!el) return setText((t) => t + s);
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const next = text.slice(0, start) + s + text.slice(end);
    setText(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + s.length, start + s.length);
    });
  }
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (text.trim()) onSubmit({ type: "translation", text });
      }}
    >
      <p className="text-sm font-semibold text-muted">
        {toTarget ? "Write this in the language you're learning" : "What does this mean?"}
      </p>
      <p
        className={`font-display text-2xl font-bold ${toTarget ? "" : "lang-text"}`}
        lang={toTarget ? "en" : language}
      >
        {payload.prompt}
      </p>
      {payload.hint ? <p className="text-sm text-muted">Hint: {payload.hint}</p> : null}
      <label htmlFor="answer" className="sr-only">
        Your answer
      </label>
      <input
        id="answer"
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        lang={toTarget ? language : "en"}
        className="lang-text min-h-14 rounded-2xl border-2 border-border bg-surface px-4 text-xl focus:border-primary"
        placeholder="Type your answer"
      />
      {toTarget ? <SpecialKeys language={language} onInsert={insert} /> : null}
      <Button type="submit" disabled={disabled || !text.trim()} className="self-start">
        Check
      </Button>
    </form>
  );
}

export function WordOrderActivity({
  payload,
  language,
  disabled,
  onSubmit,
}: ActivityProps<WordOrderPayload>) {
  const [picked, setPicked] = useState<number[]>([]);
  const remaining = payload.tokens.map((t, i) => ({ t, i })).filter((x) => !picked.includes(x.i));
  return (
    <div className="flex flex-col gap-5">
      <p className="text-lg font-semibold">{payload.prompt}</p>
      <div
        className="flex min-h-16 flex-wrap items-center gap-2 rounded-2xl border-2 border-dashed border-border p-3"
        aria-label="Your sentence"
        aria-live="polite"
      >
        {picked.length === 0 ? <span className="text-sm text-muted">Tap the words in order</span> : null}
        {picked.map((i) => (
          <button
            key={i}
            type="button"
            disabled={disabled}
            onClick={() => setPicked((p) => p.filter((x) => x !== i))}
            className="lang-text rounded-xl bg-primary px-3 py-2 text-lg text-on-primary"
            aria-label={`Remove ${payload.tokens[i]}`}
          >
            {payload.tokens[i]}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {remaining.map(({ t, i }) => (
          <button
            key={i}
            type="button"
            disabled={disabled}
            onClick={() => setPicked((p) => [...p, i])}
            className="lang-text rounded-xl border-2 border-border bg-surface px-3 py-2 text-lg hover:border-primary"
            lang={language}
          >
            {t}
          </button>
        ))}
      </div>
      <Button
        type="button"
        className="self-start"
        disabled={disabled || picked.length !== payload.tokens.length}
        onClick={() => onSubmit({ type: "word_order", order: picked.map((i) => payload.tokens[i]!) })}
      >
        Check
      </Button>
    </div>
  );
}

export function MatchingActivity({ payload, language, disabled, onSubmit }: ActivityProps<MatchingPayload>) {
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [pairs, setPairs] = useState<Record<number, number>>({});
  const usedRight = new Set(Object.values(pairs));
  const complete = Object.keys(pairs).length === payload.left.length;
  return (
    <div className="flex flex-col gap-5">
      <p className="text-lg font-semibold">{payload.prompt}</p>
      <p className="text-sm text-muted">
        Choose a word on the left, then its match on the right. Tap a matched word to undo.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          {payload.left.map((l, i) => {
            const matched = pairs[i] !== undefined;
            return (
              <button
                key={i}
                type="button"
                disabled={disabled}
                aria-pressed={selectedLeft === i}
                onClick={() => {
                  if (matched) {
                    setPairs((p) => {
                      const n = { ...p };
                      delete n[i];
                      return n;
                    });
                  } else setSelectedLeft(i);
                }}
                className={`lang-text min-h-12 rounded-xl border-2 px-3 py-2 text-left text-lg ${
                  matched
                    ? "border-primary bg-primary/10"
                    : selectedLeft === i
                      ? "border-accent bg-accent/10"
                      : "border-border bg-surface"
                }`}
                lang={language}
              >
                {l}
                {matched ? (
                  <span className="block text-xs font-semibold text-muted">→ {payload.right[pairs[i]!]}</span>
                ) : null}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-2">
          {payload.right.map((r, j) => (
            <button
              key={j}
              type="button"
              disabled={disabled || usedRight.has(j) || selectedLeft === null}
              onClick={() => {
                if (selectedLeft === null) return;
                setPairs((p) => ({ ...p, [selectedLeft]: j }));
                setSelectedLeft(null);
              }}
              className="min-h-12 rounded-xl border-2 border-border bg-surface px-3 py-2 text-left disabled:opacity-40"
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <Button
        type="button"
        className="self-start"
        disabled={disabled || !complete}
        onClick={() =>
          onSubmit({
            type: "matching",
            pairs: Object.entries(pairs).map(
              ([l, r]) => [payload.left[Number(l)]!, payload.right[r]!] as [string, string],
            ),
          })
        }
      >
        Check
      </Button>
    </div>
  );
}

export function DialogueActivity({ payload, language, disabled, onSubmit }: ActivityProps<DialoguePayload>) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm italic text-muted">{payload.setting}</p>
      <div className="flex flex-col gap-3">
        {payload.lines.map((line, i) => (
          <div key={i} className="max-w-[85%] rounded-2xl rounded-tl-sm bg-surface-2 px-4 py-3">
            <p className="text-xs font-semibold text-muted">{line.speaker}</p>
            <p className="lang-text text-xl font-semibold" lang={language}>
              {line.text}
            </p>
            <p className="text-sm text-muted">{line.translation}</p>
          </div>
        ))}
      </div>
      <p className="text-lg font-semibold">{payload.prompt}</p>
      <ChoiceList
        lang
        options={payload.options}
        disabled={disabled}
        onPick={(index) => onSubmit({ type: "dialogue", index })}
      />
    </div>
  );
}

export function RecapActivity({
  payload,
  disabled,
  onSubmit,
  vocabulary,
  language,
  onSave,
  saved,
}: ActivityProps<RecapPayload> & {
  vocabulary: {
    id: string;
    text: string;
    translation: string;
    literal_meaning: string;
    context_note: string;
  }[];
  onSave: (vocabId: string) => void;
  saved: Set<string>;
}) {
  const items = useMemo(
    () => vocabulary.filter((v) => payload.vocabIds.includes(v.id)),
    [vocabulary, payload.vocabIds],
  );
  return (
    <div className="flex flex-col gap-5">
      <p className="font-display text-2xl font-bold">{payload.title}</p>
      <ul className="flex list-disc flex-col gap-1.5 pl-5">
        {payload.points.map((p) => (
          <li key={p} className="lang-text">
            {p}
          </li>
        ))}
      </ul>
      <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
        {items.map((v) => (
          <li key={v.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="lang-text text-lg font-semibold" lang={language}>
                {v.text}
              </p>
              <p className="text-sm text-muted">
                {v.translation}
                {v.literal_meaning ? ` · literally “${v.literal_meaning}”` : ""}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant={saved.has(v.id) ? "ghost" : "secondary"}
              disabled={saved.has(v.id)}
              onClick={() => onSave(v.id)}
            >
              {saved.has(v.id) ? "Saved" : "Save"}
            </Button>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        className="self-start"
        disabled={disabled}
        onClick={() => onSubmit({ type: "recap" })}
      >
        Got it
      </Button>
    </div>
  );
}

export function ReviewActivity({
  payload,
  language,
  disabled,
  onSubmit,
  questions,
}: ActivityProps<{ prompt: string }> & { questions: ReviewQuestion[] }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  if (!questions.length) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-lg font-semibold">{payload.prompt}</p>
        <p className="text-muted">Nothing to review yet — you&apos;re all caught up.</p>
        <Button
          type="button"
          className="self-start"
          disabled={disabled}
          onClick={() => onSubmit({ type: "review", answers: [] })}
        >
          Continue
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-6">
      <p className="text-lg font-semibold">{payload.prompt}</p>
      {questions.map((q, qi) => (
        <fieldset key={q.vocabId} className="flex flex-col gap-2">
          <legend className="lang-text mb-2 font-display text-xl font-bold" lang={language}>
            {qi + 1}. {q.prompt}
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {q.options.map((o) => (
              <label
                key={o}
                className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border-2 border-border bg-surface px-3 has-[:checked]:border-primary"
              >
                <input
                  type="radio"
                  name={q.vocabId}
                  value={o}
                  disabled={disabled}
                  checked={answers[q.vocabId] === o}
                  onChange={() => setAnswers((a) => ({ ...a, [q.vocabId]: o }))}
                  className="accent-[var(--color-primary)]"
                />
                {o}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <Button
        type="button"
        className="self-start"
        disabled={disabled || Object.keys(answers).length !== questions.length}
        onClick={() =>
          onSubmit({
            type: "review",
            answers: questions.map((q) => ({ vocabId: q.vocabId, choice: answers[q.vocabId]! })),
          })
        }
      >
        Check
      </Button>
    </div>
  );
}
