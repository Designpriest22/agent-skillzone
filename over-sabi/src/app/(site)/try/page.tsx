import type { Metadata } from "next";
import Link from "next/link";
import { ToneContour } from "@/components/brand/ToneContour";
import { PageHeader } from "@/components/ui/primitives";
import { getSampleLessonId, learnableLanguages } from "@/lib/content/repo";

export const metadata: Metadata = {
  title: "Try a lesson",
  description: "Take a five-minute Yoruba, Igbo or Hausa lesson — no account needed.",
};

const GREETING: Record<string, string> = { yo: "Ẹ káàárọ̀", ig: "Ụtụtụ ọma", ha: "Ina kwana?" };

export default async function TryPage() {
  const langs = await learnableLanguages();
  const withSample = (
    await Promise.all(langs.map(async (l) => ({ ...l, sample: await getSampleLessonId(l.code) })))
  ).filter((l) => l.sample);
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <PageHeader eyebrow="Sample lesson · no account needed" title="Try a five-minute lesson">
        Learn to greet someone properly. Your progress is kept on this device until you create an account.
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-3">
        {withSample.map((l) => (
          <Link
            key={l.code}
            href={`/try/${l.code}`}
            className="group flex flex-col gap-3 rounded-[var(--radius-card)] border-2 border-border bg-surface p-6 hover:border-primary"
          >
            <span className="font-mono text-xs uppercase tracking-wider text-muted">{l.name}</span>
            <span className="lang-text font-display text-3xl font-extrabold" lang={l.code}>
              {GREETING[l.code] ?? l.native_name}
            </span>
            {l.code === "yo" ? <ToneContour text={GREETING.yo!} /> : null}
            <span className="mt-auto font-semibold text-primary group-hover:underline">
              Start the lesson →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
