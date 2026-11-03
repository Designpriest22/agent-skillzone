import type { Metadata } from "next";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { ToneContour } from "@/components/brand/ToneContour";
import { AiBadge, TutorAvatar } from "@/components/brand/TutorAvatar";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import * as Icons from "@/components/ui/icons";
import {
  Badge,
  Card,
  EmptyState,
  Eyebrow,
  Notice,
  ProgressBar,
  ReviewBadge,
} from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Brand",
  description: "The Over Sabi identity kit: strategy, logo, colour, type, voice and components.",
};

const PALETTE = [
  { name: "Sand", hex: "#F4EDE1", rgb: "244 237 225", role: "Page background", text: "#16130F" },
  { name: "Paper", hex: "#FBF7F0", rgb: "251 247 240", role: "Cards, inputs", text: "#16130F" },
  { name: "Clay", hex: "#EADBC6", rgb: "234 219 198", role: "Quiet surfaces", text: "#16130F" },
  { name: "Ink", hex: "#16130F", rgb: "22 19 15", role: "Text, dark sections", text: "#F4EDE1" },
  { name: "Forest", hex: "#0E4A37", rgb: "14 74 55", role: "Primary: actions, the mark", text: "#F4EDE1" },
  { name: "Ember", hex: "#E0552A", rgb: "224 85 42", role: "Accent: tone line, highlights", text: "#16130F" },
  { name: "Ember Deep", hex: "#B23F17", rgb: "178 63 23", role: "Accent as text on light", text: "#F4EDE1" },
  { name: "Indigo", hex: "#27306B", rgb: "39 48 107", role: "Focus rings, info", text: "#F4EDE1" },
  { name: "Spark", hex: "#C8F03C", rgb: "200 240 60", role: "Listening state only", text: "#16130F" },
];

const CONTRAST = [
  ["Ink on Sand", "15.9 : 1", "AAA"],
  ["Forest on Sand", "8.8 : 1", "AAA"],
  ["Sand on Forest", "8.8 : 1", "AAA"],
  ["Ember Deep on Sand", "5.0 : 1", "AA"],
  ["Ink on Ember", "4.9 : 1", "AA"],
  ["Ink on Spark", "14.1 : 1", "AAA"],
  ["Ember on Sand", "3.3 : 1", "Large text & graphics only"],
];

function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="break-inside-avoid-page border-t border-border py-14">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mb-6 mt-2 text-3xl font-extrabold">{title}</h2>
      {children}
    </section>
  );
}

export default function BrandPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <header className="pb-10">
        <Eyebrow>Over Sabi identity kit · v1.0</Eyebrow>
        <h1 className="mt-3 text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-none">
          Call &amp; Response
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Being sabi isn&apos;t memorising words — it&apos;s understanding how people communicate. African
          oral traditions run on call and response: someone speaks, someone answers. Every part of this
          identity is built from that exchange, and from the melody that makes tonal languages sing.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm no-print">
          <a className="underline" href="/brand/over-sabi-brand-guidelines.pdf">
            Download guidelines (PDF)
          </a>
          <a className="underline" href="/brand/over-sabi-logo-horizontal.svg">
            Logo (SVG)
          </a>
          <a className="underline" href="/brand/over-sabi-mark.svg">
            App icon (SVG)
          </a>
          <a className="underline" href="/brand/png/over-sabi-mark-1024.png">
            App icon (PNG 1024)
          </a>
        </div>
      </header>

      <Section id="strategy" eyebrow="01 · Strategy" title="Positioning, mission and values">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <h3 className="font-display text-xl font-bold">Positioning</h3>
            <p className="mt-2 text-muted">
              For Africans and the diaspora who want to speak — not just recognise — the languages of their
              families, friends and futures, Over Sabi is the conversation-first language app that teaches the
              culture inside the words, and is honest about what technology can and can&apos;t do yet.
            </p>
          </Card>
          <Card>
            <h3 className="font-display text-xl font-bold">Mission &amp; vision</h3>
            <p className="mt-2 text-muted">
              <strong>Mission:</strong> help people speak African languages with confidence through real
              conversation and culturally accurate teaching.
              <br />
              <strong>Vision:</strong> a world where no one loses their family&apos;s language for lack of a
              good way to learn it.
            </p>
          </Card>
        </div>
        <ul className="mt-6 grid gap-3 md:grid-cols-5">
          {[
            ["Respect", "For elders, speakers and the languages themselves."],
            ["Accuracy", "Native speakers are the authority; drafts are labelled."],
            ["Warmth", "Learning a language is personal. We make it feel welcoming."],
            ["Honesty", "We say what's tested and what isn't."],
            ["Plurality", "Africa isn't one place, one people or one story."],
          ].map(([v, d]) => (
            <li key={v} className="rounded-2xl border border-border p-4">
              <p className="font-display text-lg font-bold">{v}</p>
              <p className="text-sm text-muted">{d}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="concepts" eyebrow="02 · Exploration" title="Three directions, one choice">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-2 border-primary">
            <Badge tone="success">Chosen</Badge>
            <h3 className="mt-2 font-display text-xl font-bold">A · Call &amp; Response</h3>
            <p className="mt-2 text-sm text-muted">
              An S drawn as two answering arcs; a tone line that traces real Yoruba tones. Warm sand, deep
              forest, ember. Grounded in how language works, not in decoration.
            </p>
          </Card>
          <Card>
            <Badge>Not chosen</Badge>
            <h3 className="mt-2 font-display text-xl font-bold">B · Indigo Cloth</h3>
            <p className="mt-2 text-sm text-muted">
              Indigo resist-dye grids and geometric repeats. Beautiful, but it borrows one community&apos;s
              textile tradition to stand for many languages, and pattern-as-decoration risks the stereotype
              the brief warns against.
            </p>
          </Card>
          <Card>
            <Badge>Not chosen</Badge>
            <h3 className="mt-2 font-display text-xl font-bold">C · Market Signage</h3>
            <p className="mt-2 text-sm text-muted">
              Hand-painted shop-sign lettering, bright yellows and reds. Full of energy and very Lagos — too
              Lagos for Accra, Nairobi and Johannesburg, and hard to make accessible at small sizes.
            </p>
          </Card>
        </div>
      </Section>

      <Section id="logo" eyebrow="03 · Logo" title="The mark and wordmark">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="flex min-h-48 items-center justify-center">
            <Logo size={56} />
          </Card>
          <Card className="flex min-h-48 flex-col items-center justify-center gap-3">
            <LogoMark size={88} />
            <span className="font-display text-3xl font-extrabold">
              over<span className="text-primary">sabi</span>
            </span>
          </Card>
          <Card className="flex min-h-40 items-center justify-center !bg-ink">
            <span className="inline-flex items-center gap-3">
              <LogoMark size={48} />
              <span className="font-display text-3xl font-extrabold text-sand">
                over<span className="text-[#8fd4b2]">sabi</span>
              </span>
            </span>
          </Card>
          <Card className="flex min-h-40 items-center justify-center">
            <span className="inline-flex items-center gap-3 text-ink">
              <svg width="48" height="48" viewBox="0 0 64 64" aria-label="Monochrome mark" role="img">
                <rect width="64" height="64" rx="16" fill="#16130f" />
                <path
                  d="M43 19.5c-2.6-3.4-6.6-5.5-11-5.5-7.2 0-12.5 4.6-12.5 10.6 0 5.3 3.8 7.9 12.5 9.4 8.7 1.5 12.5 4.1 12.5 9.4 0 6-5.3 10.6-12.5 10.6-4.4 0-8.4-2.1-11-5.5"
                  fill="none"
                  stroke="#f4ede1"
                  strokeWidth="6.5"
                  strokeLinecap="round"
                />
                <circle cx="47.5" cy="14.5" r="5" fill="#f4ede1" />
              </svg>
              <span className="font-display text-3xl font-extrabold">oversabi</span>
            </span>
          </Card>
        </div>
        <p className="mt-3 text-sm text-muted">Horizontal (primary), stacked, reversed on Ink, monochrome.</p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="font-display text-xl font-bold">Clear space &amp; minimum size</h3>
            <p className="mt-2 text-sm text-muted">
              Keep clear space equal to the height of the ember dot (¼ of the mark) on every side. Minimum
              size: mark 24 px / 6 mm; horizontal logo 120 px / 30 mm wide.
            </p>
            <div className="mt-4 inline-block border-2 border-dashed border-accent p-4">
              <Logo size={40} />
            </div>
          </div>
          <div>
            <h3 className="font-display text-xl font-bold">Don&apos;t</h3>
            <ul className="mt-2 grid grid-cols-2 gap-3 text-sm">
              {[
                ["Stretch or squash it", "scale-x-150"],
                ["Rotate it", "rotate-12"],
                ["Recolour the dot to green", "hue-rotate-90"],
                ["Put it on busy photos", "opacity-50"],
              ].map(([label, cls]) => (
                <li
                  key={label}
                  className="flex flex-col items-center gap-2 rounded-xl border border-danger/40 p-3 text-center"
                >
                  <span className={`inline-block ${cls}`}>
                    <LogoMark size={36} />
                  </span>
                  <span>✕ {label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section id="tone" eyebrow="04 · Signature" title="The tone line">
        <p className="max-w-2xl text-muted">
          Our one decorative device carries information. Where text is written with tone marks, the tone line
          traces the pitch of the words: acute = high, unmarked = mid, grave = low. It&apos;s never drawn for
          text that isn&apos;t tone-marked, and never invented.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {["Ẹ káàárọ̀", "Mo wà dáadáa", "Ẹ kú ìrọ̀lẹ́"].map((t) => (
            <Card key={t}>
              <p lang="yo" className="lang-text font-display text-3xl font-bold">
                {t}
              </p>
              <ToneContour text={t} showLegend className="mt-2" />
            </Card>
          ))}
        </div>
      </Section>

      <Section id="colour" eyebrow="05 · Colour" title="Palette">
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {PALETTE.map((c) => (
            <li key={c.name} className="overflow-hidden rounded-2xl border border-border">
              <div
                className="flex h-24 items-end p-3 font-display font-bold"
                style={{ background: c.hex, color: c.text }}
              >
                {c.name}
              </div>
              <div className="bg-surface p-3 font-mono text-xs">
                <p>{c.hex}</p>
                <p>RGB {c.rgb}</p>
                <p className="mt-1 font-sans text-muted">{c.role}</p>
              </div>
            </li>
          ))}
        </ul>
        <h3 className="mt-8 font-display text-xl font-bold">Accessible pairs (WCAG 2.2, measured)</h3>
        <table className="mt-3 w-full max-w-xl text-sm">
          <tbody>
            {CONTRAST.map(([p, r, l]) => (
              <tr key={p} className="border-b border-border">
                <td className="py-2">{p}</td>
                <td className="py-2 font-mono">{r}</td>
                <td className="py-2">{l}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-sm text-muted">
          Pan-African flag colours are not used as a set. Spark is reserved for the &quot;listening&quot;
          state so it always means &quot;we hear you&quot;. Dark mode swaps surfaces to Ink tones and lifts
          Forest to #8FD4B2.
        </p>
      </Section>

      <Section id="type" eyebrow="06 · Typography" title="Typefaces">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <p className="font-display text-4xl font-extrabold">Bricolage Grotesque</p>
            <p className="mt-2 text-sm text-muted">
              Display. Headlines and the wordmark. Variable, OFL licence. Use with restraint: 700–800 weight,
              tight tracking.
            </p>
          </Card>
          <Card>
            <p lang="yo" className="lang-text text-3xl">
              Noto Sans · ẹ ọ ṣ ị ụ ṅ ɓ ɗ ƙ
            </p>
            <p className="mt-2 text-sm text-muted">
              Body and all target-language text. Chosen because it renders African Latin letters and stacked
              tone marks correctly. OFL licence.
            </p>
          </Card>
          <Card>
            <p className="font-mono text-2xl">IBM Plex Mono</p>
            <p className="mt-2 text-sm text-muted">
              Utility. Eyebrows, labels, tone legends, data. OFL licence.
            </p>
          </Card>
        </div>
        <p className="mt-4 text-sm text-muted">
          Scale: 14 / 16 / 18 / 24 / 30 / 36 / 48 / 72. Line height 1.55 for body; 0.95–1.1 for display. All
          fonts are self-hosted — no third-party font requests.
        </p>
      </Section>

      <Section id="icons" eyebrow="07 · Iconography &amp; illustration" title="Icons and tutors">
        <div className="flex flex-wrap gap-4">
          {Object.entries(Icons).map(([name, Icon]) => (
            <span
              key={name}
              className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-xl border border-border text-[0.55rem] text-muted"
              title={name}
            >
              <span className="h-6 w-6 text-text">
                <Icon />
              </span>
              {name.replace("Icon", "")}
            </span>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">
          24 px grid, 2 px rounded strokes, currentColor. Drawn for Over Sabi.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-6">
          {["kemi", "tunde", "chiamaka", "obinna", "hauwa", "musa"].map((k) => (
            <TutorAvatar key={k} avatarKey={k} name={k} size={72} />
          ))}
          <AiBadge />
        </div>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          Tutor portraits are abstract and stylised so no one mistakes an AI tutor for a real person. Each
          wears the tone line as a mouth. Always pair a tutor with the &quot;AI tutor&quot; label.
        </p>
      </Section>

      <Section id="components" eyebrow="08 · Components" title="UI building blocks">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="flex flex-wrap gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="accent">Accent</Button>
            <Button variant="ghost">Ghost</Button>
            <Button disabled>Disabled</Button>
          </Card>
          <Card className="flex flex-col gap-3">
            <Field
              id="brand-demo"
              label="Input label"
              hint="Hints sit under the field."
              placeholder="Type here"
            />
          </Card>
          <Card className="flex flex-wrap gap-2">
            <ReviewBadge status="verified" />
            <ReviewBadge status="editorial_draft" />
            <ReviewBadge status="ai_draft" />
            <Badge tone="accent">Up next</Badge>
          </Card>
          <Card className="flex flex-col gap-3">
            <ProgressBar value={60} label="Example progress" />
            <Notice tone="success" title="Correct">
              Feedback is specific and never apologises.
            </Notice>
          </Card>
          <div className="md:col-span-2">
            <EmptyState title="Empty states invite action">
              They explain what will appear and how to get there.
            </EmptyState>
          </div>
        </div>
      </Section>

      <Section id="voice" eyebrow="09 · Voice" title="How we sound">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <h3 className="font-bold">We are</h3>
            <p className="text-sm text-muted">
              Confident, warm, culturally fluent, occasionally witty. Plain verbs, sentence case, specific
              over clever.
            </p>
            <p className="mt-3 text-sm">✓ &quot;Almost — check the tone marks. They change meaning.&quot;</p>
            <p className="text-sm">✓ &quot;You sabi!&quot;</p>
          </Card>
          <Card>
            <h3 className="font-bold">We avoid</h3>
            <p className="text-sm text-muted">
              Safari clichés, &quot;exotic&quot;, treating Africa as one country, fake urgency, invented
              statistics, over-claiming AI.
            </p>
            <p className="mt-3 text-sm">✕ &quot;Unlock the secrets of the Motherland!&quot;</p>
            <p className="text-sm">✕ &quot;Native-level fluency in 30 days.&quot;</p>
          </Card>
        </div>
      </Section>

      <Section id="motion" eyebrow="10 · Motion &amp; imagery" title="Motion and photography">
        <ul className="grid gap-3 text-sm md:grid-cols-2">
          <li className="rounded-2xl border border-border p-4">
            <strong>Motion:</strong> the tone line draws itself (1.2 s, ease-in-out) when a phrase appears;
            the listening ring pulses in Spark; the speaking ring in Ember. Nothing else moves for decoration.
            Everything respects reduced-motion settings.
          </li>
          <li className="rounded-2xl border border-border p-4">
            <strong>Photography:</strong> real people in real settings — family kitchens, markets, offices,
            campuses, phone calls home — across many African cities and the diaspora. Natural light, warm
            grade. No safari animals, no &quot;tribal&quot; costume shoots, no stock poverty imagery. Always
            with consent and model releases.
          </li>
          <li className="rounded-2xl border border-border p-4">
            <strong>App stores:</strong> real screens on Sand, one headline per screen in Bricolage, the tone
            line under the target phrase. Lead with &quot;Speak&quot;, then &quot;Learn&quot;, then &quot;Keep
            it&quot;.
          </li>
          <li className="rounded-2xl border border-border p-4">
            <strong>Social:</strong> templates in /brand/social — achievement card (1080×1080) and story
            (1080×1920). One phrase, its meaning, its tone line.
          </li>
        </ul>
      </Section>
    </div>
  );
}
