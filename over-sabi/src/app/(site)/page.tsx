import Image from "next/image";
import Link from "next/link";
import { AiBadge, TutorAvatar } from "@/components/brand/TutorAvatar";
import { ToneContour } from "@/components/brand/ToneContour";
import { HeroExchange } from "@/components/site/HeroExchange";
import { ButtonLink } from "@/components/ui/Button";
import { Badge, Eyebrow } from "@/components/ui/primitives";
import { activeTutors } from "@/lib/content/catalog-queries";
import { listLanguages } from "@/lib/content/repo";

export const revalidate = 300;

const STATUS_TONE = {
  available: "success",
  beta: "warning",
  in_development: "info",
  roadmap: "neutral",
} as const;
const STATUS_LABEL = {
  available: "Available",
  beta: "Beta",
  in_development: "In development",
  roadmap: "Roadmap",
} as const;

export default async function LandingPage() {
  const [languages, tutors] = await Promise.all([listLanguages(), activeTutors()]);
  const launch = languages.filter((l) => ["yo", "ig", "ha", "pcm"].includes(l.code));
  const roadmapCount = languages.filter((l) => l.catalogue_status === "roadmap" && l.code !== "en").length;

  return (
    <>
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-12 md:grid-cols-[1.15fr_1fr] md:pt-20">
        <div>
          <Eyebrow>Yoruba · Igbo · Hausa — and more to come</Eyebrow>
          <h1 className="mt-4 text-[clamp(2.75rem,7vw,5.25rem)] font-extrabold leading-[0.95]">
            Your language.
            <br />
            Your people.
            <br />
            <span className="text-primary">Your voice.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg text-muted">
            Learn Nigerian and African languages through real conversations, AI tutors, and the everyday
            expressions that bring you closer to the people and cultures that matter to you.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/start" size="lg">
              Start learning
            </ButtonLink>
            <ButtonLink href="/try" size="lg" variant="secondary">
              Try a conversation
            </ButtonLink>
          </div>
          <p className="mt-4 text-sm text-muted">Free to start. No account needed for your first lesson.</p>
        </div>
        <HeroExchange />
      </section>

      {/* What sabi means */}
      <section className="bg-ink py-20 text-sand">
        <div className="mx-auto max-w-6xl px-4">
          <Eyebrow className="!text-sand/60">What it means to sabi</Eyebrow>
          <h2 className="mt-3 max-w-3xl text-4xl font-extrabold sm:text-5xl">
            Knowing the words is the start. Knowing how people talk is the point.
          </h2>
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            <div>
              <p lang="yo" className="lang-text font-display text-3xl font-bold">
                Ẹ káàárọ̀ <span className="opacity-50">/</span> Káàárọ̀
              </p>
              <h3 className="mt-3 text-xl font-bold">Respect is grammar</h3>
              <p className="mt-2 text-sand/75">
                In Yoruba, that first Ẹ is how you greet an elder. Leave it off with your grandmother and she
                will notice. We teach both — and when to use each.
              </p>
            </div>
            <div>
              <p lang="yo" className="lang-text font-display text-3xl font-bold">
                Mo wà dáadáa
              </p>
              <ToneContour
                text="Mo wà dáadáa"
                className="mt-1 [&_circle]:fill-[var(--color-spark)] [&_polyline]:stroke-[var(--color-spark)]"
              />
              <h3 className="mt-3 text-xl font-bold">Tone carries meaning</h3>
              <p className="mt-2 text-sand/75">
                Tonal languages change meaning with pitch. Wherever tone marks are written, Over Sabi draws
                the melody so you can see it as well as hear it.
              </p>
            </div>
            <div>
              <p lang="ha" className="lang-text font-display text-3xl font-bold">
                Yaya sunanka? <span className="opacity-50">/</span> sunanki?
              </p>
              <h3 className="mt-3 text-xl font-bold">Context changes everything</h3>
              <p className="mt-2 text-sand/75">
                Hausa asks a man and a woman their name differently. Igbo greetings shift by time of day.
                Small details, big difference.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works with real screenshots */}
      <section className="mx-auto max-w-6xl px-4 py-24">
        <Eyebrow>How it works</Eyebrow>
        <h2 className="mt-3 max-w-2xl text-4xl font-extrabold">Learn it. Say it. Keep it.</h2>
        <div className="mt-12 grid gap-12 md:grid-cols-3">
          {[
            {
              title: "Learn",
              body: "Five-minute lessons built from listening, matching, translation, word order and short dialogues — with culture notes where they matter.",
              img: "/screenshots/lesson.png",
              alt: "The Over Sabi lesson player on a phone, showing a dialogue where the learner greets an aunt",
            },
            {
              title: "Speak",
              body: "Practise with an AI tutor who adapts to your level, corrects you gently and gives you a summary at the end. Type or, where supported, speak.",
              img: "/screenshots/speak.png",
              alt: "The Over Sabi speaking page with the AI tutor Kẹ́mi, voice status and settings",
            },
            {
              title: "Keep it",
              body: "Every word lands in your notebook, and spaced repetition brings it back just before you'd forget it.",
              img: "/screenshots/review.png",
              alt: "An Over Sabi revision card for a Yoruba word, with its meaning revealed",
            },
          ].map((s) => (
            <div key={s.title} className="flex flex-col gap-4">
              <div className="overflow-hidden rounded-[1.75rem] border-[6px] border-ink bg-surface">
                <Image src={s.img} alt={s.alt} width={390} height={720} className="h-auto w-full" />
              </div>
              <h3 className="text-2xl font-extrabold">{s.title}</h3>
              <p className="text-muted">{s.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs text-muted">Screenshots of the current product.</p>
      </section>

      {/* Tutors */}
      <section className="border-y border-border bg-surface py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Eyebrow>Tutors</Eyebrow>
              <h2 className="mt-3 text-4xl font-extrabold">Different styles. Same goal.</h2>
              <p className="mt-2 max-w-xl text-muted">
                Our tutors are AI characters — each with a teaching style you can tune. They&apos;ll always
                tell you they&apos;re AI.
              </p>
            </div>
            <ButtonLink href="/tutors" variant="secondary">
              Meet the tutors
            </ButtonLink>
          </div>
          <ul className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-6">
            {tutors.map((t) => (
              <li key={t.id as string} className="flex flex-col items-center gap-2 text-center">
                <TutorAvatar avatarKey={t.avatar_key as string} name={t.name as string} size={80} />
                <p className="font-display font-bold">{t.name as string}</p>
                <AiBadge />
                <p className="text-xs text-muted">{t.tagline as string}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Honesty */}
      <section className="mx-auto max-w-6xl px-4 py-24">
        <div className="grid gap-10 md:grid-cols-[1fr_1.3fr]">
          <div>
            <Eyebrow>What&apos;s ready, honestly</Eyebrow>
            <h2 className="mt-3 text-4xl font-extrabold">
              We label what&apos;s been checked — and what hasn&apos;t.
            </h2>
            <p className="mt-4 text-muted">
              Speech technology for African languages is uneven. We test each language separately, label beta
              content, and never pass off an English speech model as Yoruba support.
            </p>
            <Link href="/languages" className="mt-6 inline-block font-semibold underline">
              See the full catalogue — {roadmapCount} more languages on the roadmap
            </Link>
          </div>
          <div className="overflow-x-auto rounded-[var(--radius-card)] border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Launch language status</caption>
              <thead className="border-b border-border font-mono text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="p-4">Language</th>
                  <th className="p-4">Course</th>
                  <th className="p-4">AI tutor</th>
                  <th className="p-4">Voice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {launch.map((l) => (
                  <tr key={l.code}>
                    <td className="p-4">
                      <Link href={`/languages/${l.code}`} className="lang-text font-semibold hover:underline">
                        {l.native_name}
                      </Link>
                      <span className="block text-xs text-muted">{l.name}</span>
                    </td>
                    <td className="p-4">
                      <Badge tone={STATUS_TONE[l.catalogue_status]}>{STATUS_LABEL[l.catalogue_status]}</Badge>
                    </td>
                    <td className="p-4">
                      {l.tutor_status === "unavailable"
                        ? "Not yet"
                        : l.tutor_status === "experimental"
                          ? "Experimental"
                          : "Reviewed"}
                    </td>
                    <td className="p-4">
                      {l.stt_status === "validated"
                        ? "Tested"
                        : l.stt_status === "unsupported"
                          ? "Not supported"
                          : "Not yet tested"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-start gap-6 rounded-[2rem] bg-primary px-8 py-14 text-on-primary md:flex-row md:items-center md:justify-between md:px-14">
          <div>
            <p className="lang-text font-display text-4xl font-extrabold">Nnọọ. Ẹ kú àbọ̀. Barka da zuwa.</p>
            <p className="mt-2 opacity-80">Welcome — three ways. Your first lesson takes five minutes.</p>
          </div>
          <ButtonLink href="/start" size="lg" variant="accent">
            Start learning
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
