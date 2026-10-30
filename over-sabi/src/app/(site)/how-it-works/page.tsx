import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";
import { Card, Eyebrow, PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "How it works" };

const ACTIVITIES = [
  ["Listening", "Hear (or read, until native audio is recorded) a phrase and pick its meaning."],
  ["Translation", "Write phrases both ways, with a keyboard for tone marks, under-dots and hooked letters."],
  ["Word order", "Build a sentence from its words."],
  ["Matching", "Pair words and phrases with their meanings."],
  ["Dialogue", "Step into a short real-life exchange and choose the right reply."],
  ["Recap", "See what you learned, save words, read the culture notes."],
  ["Review", "Words you've met before come back, scheduled by spaced repetition."],
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <PageHeader eyebrow="How it works" title="From your first greeting to real conversations">
        Over Sabi combines short guided lessons, conversation practice with AI tutors, and revision that
        adapts to what you forget.
      </PageHeader>
      <section className="mt-10">
        <h2 className="text-2xl font-extrabold">1. Learn in short lessons</h2>
        <p className="mt-2 max-w-2xl text-muted">
          Each lesson takes about five minutes and mixes seven kinds of activity. Answers are checked
          carefully: if you get the letters right but miss a tone mark, we tell you it was almost right — and
          why it matters.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {ACTIVITIES.map(([t, d]) => (
            <Card key={t}>
              <p className="font-display text-lg font-bold">{t}</p>
              <p className="text-sm text-muted">{d}</p>
            </Card>
          ))}
        </div>
      </section>
      <section className="mt-14">
        <h2 className="text-2xl font-extrabold">2. Speak with an AI tutor</h2>
        <p className="mt-2 max-w-2xl text-muted">
          Choose a tutor style — patient, playful, precise, culture-focused, business or heritage — and set
          the pace, how often you&apos;re corrected, how much translation you get and how long you practise.
          Each session ends with a summary: useful expressions, important corrections, grammar notes and what
          to try next.
        </p>
        <p className="mt-3 max-w-2xl text-muted">
          You can always type. Voice input and an AI voice are switched on per language only where a speech
          service supports it, and clearly labelled as experimental until we&apos;ve tested them with native
          speakers.
        </p>
      </section>
      <section className="mt-14">
        <h2 className="text-2xl font-extrabold">3. Keep what you learn</h2>
        <p className="mt-2 max-w-2xl text-muted">
          Every word from your lessons goes into your notebook. Spaced repetition schedules each one — forget
          it and it comes back in minutes; know it well and it waits weeks.
        </p>
      </section>
      <section className="mt-14">
        <Eyebrow>Built for real connections</Eyebrow>
        <p className="mt-2 max-w-2xl text-muted">
          Lessons work on ordinary phones and patchy connections. Text lessons you&apos;ve opened are cached,
          so they keep working when the network drops. AI conversations need a connection.
        </p>
      </section>
      <div className="mt-12 flex flex-wrap gap-3">
        <ButtonLink href="/start" size="lg">
          Start learning
        </ButtonLink>
        <ButtonLink href="/try" size="lg" variant="secondary">
          Try a lesson first
        </ButtonLink>
      </div>
    </div>
  );
}
