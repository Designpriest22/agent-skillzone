"use client";
import { useState } from "react";
import { ToneContour } from "@/components/brand/ToneContour";

const EXCHANGES = [
  {
    code: "yo",
    name: "Yoruba",
    call: { text: "Báwo ni?", gloss: "How are you?" },
    response: { text: "Mo wà dáadáa.", gloss: "I'm fine." },
    note: "Yoruba has three tones. The line traces them: high, mid, low.",
  },
  {
    code: "ig",
    name: "Igbo",
    call: { text: "Kedu?", gloss: "How are you?" },
    response: { text: "Ọ dị mma.", gloss: "It is good." },
    note: "Igbo is tonal too, but tone is usually left unwritten — you learn it by ear.",
  },
  {
    code: "ha",
    name: "Hausa",
    call: { text: "Ina kwana?", gloss: "Good morning? — literally, how did you sleep?" },
    response: { text: "Lafiya lau.", gloss: "Very well." },
    note: "Hausa greetings ask after your night, your day, your family.",
  },
] as const;

/** The landing-page signature: a call and its response, in three languages. */
export function HeroExchange() {
  const [i, setI] = useState(0);
  const ex = EXCHANGES[i]!;
  return (
    <div className="relative">
      <div
        role="tablist"
        aria-label="Language"
        className="mb-6 inline-flex rounded-full border-2 border-text/80 p-1"
      >
        {EXCHANGES.map((e, idx) => (
          <button
            key={e.code}
            role="tab"
            type="button"
            aria-selected={i === idx}
            aria-controls="exchange-panel"
            onClick={() => setI(idx)}
            className="rounded-full px-4 py-1.5 text-sm font-semibold aria-selected:bg-text aria-selected:text-bg"
          >
            {e.name}
          </button>
        ))}
      </div>
      <div id="exchange-panel" role="tabpanel" key={ex.code} className="flex flex-col gap-5">
        <div className="max-w-sm self-start rounded-[1.75rem] rounded-bl-md bg-surface px-6 py-5 shadow-[0_1px_0_var(--color-border)]">
          <p className="font-mono text-[0.7rem] uppercase tracking-wider text-muted">The call</p>
          <p lang={ex.code} className="lang-text font-display text-4xl font-extrabold sm:text-5xl">
            {ex.call.text}
          </p>
          <ToneContour text={ex.call.text} className="mt-2" animate />
          <p className="mt-1 text-sm text-muted">{ex.call.gloss}</p>
        </div>
        <div className="max-w-sm self-end rounded-[1.75rem] rounded-br-md bg-primary px-6 py-5 text-on-primary">
          <p className="font-mono text-[0.7rem] uppercase tracking-wider opacity-70">Your response</p>
          <p lang={ex.code} className="lang-text font-display text-4xl font-extrabold sm:text-5xl">
            {ex.response.text}
          </p>
          <ToneContour
            text={ex.response.text}
            className="mt-2 [&_circle]:fill-[var(--color-spark)] [&_polyline]:stroke-[var(--color-spark)]"
            animate
          />
          <p className="mt-1 text-sm opacity-80">{ex.response.gloss}</p>
        </div>
        <p className="text-sm text-muted">{ex.note}</p>
      </div>
    </div>
  );
}
