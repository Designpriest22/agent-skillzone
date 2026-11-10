"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AiBadge, TutorAvatar } from "@/components/brand/TutorAvatar";
import { Button } from "@/components/ui/Button";
import { Notice, ProgressBar } from "@/components/ui/primitives";
import { api, ApiError } from "@/lib/client/api";
import { writeGuestProgress } from "@/lib/client/guest";

export interface OnboardingLanguage {
  code: string;
  name: string;
  native_name: string;
  catalogue_status: string;
}
export interface OnboardingTutor {
  id: string;
  name: string;
  language_code: string;
  tagline: string;
  avatar_key: string;
}

const REASONS = [
  ["family", "Speaking with family"],
  ["roots", "Connecting with my roots"],
  ["media", "Understanding films, music and media"],
  ["travel", "Travelling"],
  ["work", "Work and business"],
  ["social", "Social conversations"],
  ["culture", "Cultural exploration"],
  ["teaching", "Teaching children or family members"],
] as const;
const LEVELS = [
  ["beginner", "Complete beginner"],
  ["few_words", "I know a few words"],
  ["understand_more", "I understand more than I can speak"],
  ["simple_conversations", "I can have simple conversations"],
  ["fluency", "I want to improve my fluency"],
] as const;
const EXPLANATIONS = [
  ["en", "English"],
  ["pcm", "Nigerian Pidgin (experimental)"],
  ["fr", "French"],
] as const;
const GOALS = [5, 10, 15, 20, 30] as const;

type Step = "welcome" | "language" | "reason" | "level" | "explain" | "tutor" | "goal";
const STEPS: Step[] = ["welcome", "language", "reason", "level", "explain", "tutor", "goal"];

export function OnboardingFlow({
  mode,
  languages,
  tutors,
  needsAgeBand,
  initialLanguage,
}: {
  mode: "guest" | "user";
  languages: OnboardingLanguage[];
  tutors: OnboardingTutor[];
  needsAgeBand?: boolean;
  initialLanguage?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(initialLanguage ? "reason" : "welcome");
  const [language, setLanguage] = useState(initialLanguage ?? "");
  const [goals, setGoals] = useState<string[]>([]);
  const [level, setLevel] = useState("beginner");
  const [explain, setExplain] = useState("en");
  const [tutorId, setTutorId] = useState<string | null>(null);
  const [minutes, setMinutes] = useState<number>(10);
  const [ageBand, setAgeBand] = useState<"teen" | "adult" | "">("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const i = STEPS.indexOf(step);
  const go = (s: Step) => {
    setError(null);
    setStep(s);
  };
  const nextStep = () => go(STEPS[Math.min(i + 1, STEPS.length - 1)]!);
  const back = () => go(STEPS[Math.max(i - 1, 0)]!);
  const langTutors = tutors.filter((t) => t.language_code === language);
  const langName = languages.find((l) => l.code === language)?.name ?? "";

  async function finish() {
    setPending(true);
    setError(null);
    if (mode === "guest") {
      writeGuestProgress((g) => ({
        ...g,
        onboarding: { language, level, goals, explanationLanguage: explain, dailyGoalMinutes: minutes },
      }));
      router.push(`/try/${language}`);
      return;
    }
    if (needsAgeBand && !ageBand) {
      setError("Tell us your age range to continue.");
      setPending(false);
      return;
    }
    try {
      const r = await api<{ firstLessonId: string | null }>("/api/onboarding", {
        body: {
          language,
          goals,
          level,
          explanationLanguage: explain,
          tutorId,
          dailyGoalMinutes: minutes,
          ageBand: ageBand || undefined,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      });
      router.replace(r.firstLessonId ? `/learn/${r.firstLessonId}` : "/home");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save. Try again.");
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      {step !== "welcome" ? (
        <ProgressBar value={(i / (STEPS.length - 1)) * 100} label={`Step ${i} of ${STEPS.length - 1}`} />
      ) : null}

      {step === "welcome" && (
        <div className="flex flex-col gap-5 py-6">
          <h1 className="text-4xl font-extrabold sm:text-5xl">Welcome to Over Sabi.</h1>
          <p className="text-lg text-muted">
            A few quick questions so we can start you in the right place. You can skip any of them and change
            your answers later.
          </p>
          <Button size="lg" className="self-start" onClick={nextStep}>
            Let&apos;s go
          </Button>
        </div>
      )}

      {step === "language" && (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 font-display text-3xl font-extrabold">
            Which language do you want to speak?
          </legend>
          {languages.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => {
                setLanguage(l.code);
                setTutorId(null);
                go("reason");
              }}
              aria-pressed={language === l.code}
              className="flex min-h-16 items-center justify-between rounded-2xl border-2 border-border bg-surface px-5 text-left hover:border-primary aria-[pressed=true]:border-primary"
            >
              <span>
                <span className="lang-text block font-display text-xl font-bold">{l.native_name}</span>
                <span className="text-sm text-muted">{l.name}</span>
              </span>
              {l.catalogue_status === "beta" ? (
                <span className="font-mono text-xs uppercase text-muted">Beta</span>
              ) : null}
            </button>
          ))}
          <p className="text-sm text-muted">
            More languages are on the way.{" "}
            <Link href="/languages" className="underline">
              See the full catalogue
            </Link>
            .
          </p>
        </fieldset>
      )}

      {step === "reason" && (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 font-display text-3xl font-extrabold">
            Why are you learning {langName}?
          </legend>
          <p className="-mt-2 text-sm text-muted">Pick any that apply.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {REASONS.map(([v, l]) => (
              <label
                key={v}
                className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-2 border-border bg-surface px-4 has-[:checked]:border-primary"
              >
                <input
                  type="checkbox"
                  checked={goals.includes(v)}
                  onChange={(e) => setGoals((g) => (e.target.checked ? [...g, v] : g.filter((x) => x !== v)))}
                  className="h-4 w-4 accent-[var(--color-primary)]"
                />
                {l}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {step === "level" && (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 font-display text-3xl font-extrabold">
            How much {langName} do you know?
          </legend>
          {LEVELS.map(([v, l]) => (
            <label
              key={v}
              className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-2 border-border bg-surface px-4 has-[:checked]:border-primary"
            >
              <input
                type="radio"
                name="level"
                checked={level === v}
                onChange={() => setLevel(v)}
                className="accent-[var(--color-primary)]"
              />
              {l}
            </label>
          ))}
          <p className="text-sm text-muted">
            Right now every course starts at the Starter level; this sets how your AI tutor talks to you.
          </p>
        </fieldset>
      )}

      {step === "explain" && (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 font-display text-3xl font-extrabold">
            Which language should we explain things in?
          </legend>
          {EXPLANATIONS.map(([v, l]) => (
            <label
              key={v}
              className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-2 border-border bg-surface px-4 has-[:checked]:border-primary"
            >
              <input
                type="radio"
                name="explain"
                checked={explain === v}
                onChange={() => setExplain(v)}
                className="accent-[var(--color-primary)]"
              />
              {l}
            </label>
          ))}
          <p className="text-sm text-muted">
            Lessons are written in English for now. This setting changes how your AI tutor explains things.
          </p>
        </fieldset>
      )}

      {step === "tutor" && (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 font-display text-3xl font-extrabold">Pick a tutor style</legend>
          {langTutors.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={tutorId === t.id}
              onClick={() => setTutorId(t.id)}
              className="flex items-center gap-4 rounded-2xl border-2 border-border bg-surface p-4 text-left hover:border-primary aria-[pressed=true]:border-primary"
            >
              <TutorAvatar avatarKey={t.avatar_key} name={t.name} size={56} />
              <span className="flex-1">
                <span className="flex items-center gap-2 font-display text-lg font-bold">
                  {t.name} <AiBadge />
                </span>
                <span className="text-sm text-muted">{t.tagline}</span>
              </span>
            </button>
          ))}
          {!langTutors.length ? <p className="text-muted">No tutors for this language yet.</p> : null}
        </fieldset>
      )}

      {step === "goal" && (
        <div className="flex flex-col gap-5">
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 font-display text-3xl font-extrabold">How much time a day?</legend>
            <div className="grid grid-cols-5 gap-2">
              {GOALS.map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={minutes === m}
                  onClick={() => setMinutes(m)}
                  className="min-h-16 rounded-xl border-2 border-border bg-surface font-display text-xl font-bold aria-[pressed=true]:border-primary aria-[pressed=true]:bg-primary aria-[pressed=true]:text-on-primary"
                >
                  {m}
                  <span className="block text-xs font-normal">min</span>
                </button>
              ))}
            </div>
          </fieldset>
          {mode === "user" && needsAgeBand ? (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 font-semibold">Your age range</legend>
              {[
                ["adult", "18 or older"],
                ["teen", "13 to 17"],
              ].map(([v, l]) => (
                <label key={v} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="age"
                    checked={ageBand === v}
                    onChange={() => setAgeBand(v as "teen" | "adult")}
                    className="accent-[var(--color-primary)]"
                  />{" "}
                  {l}
                </label>
              ))}
            </fieldset>
          ) : null}
          {error ? <Notice tone="danger">{error}</Notice> : null}
          <Button size="lg" onClick={finish} disabled={pending || !language}>
            {pending
              ? "Building your plan…"
              : mode === "guest"
                ? "Start my first lesson"
                : "Build my plan and start"}
          </Button>
        </div>
      )}

      {step !== "welcome" && step !== "goal" ? (
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={back}>
            Back
          </Button>
          <Button onClick={nextStep} disabled={step === "language" && !language}>
            {step === "reason" && !goals.length ? "Skip" : step === "tutor" && !tutorId ? "Skip" : "Continue"}
          </Button>
        </div>
      ) : step === "goal" ? (
        <Button variant="ghost" className="self-start" onClick={back}>
          Back
        </Button>
      ) : null}
    </div>
  );
}
