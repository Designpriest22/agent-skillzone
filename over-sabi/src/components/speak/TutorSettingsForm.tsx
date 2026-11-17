"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AiBadge, TutorAvatar } from "@/components/brand/TutorAvatar";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/primitives";
import { api, ApiError } from "@/lib/client/api";
import type { TutorSettings } from "@/lib/ai/schemas";

interface Tutor {
  id: string;
  name: string;
  tagline: string;
  bio: string;
  teaching_approach: string;
  correction_style: string;
  specialties: string[];
  avatar_key: string;
}

export function TutorSettingsForm({
  language,
  tutors,
  currentTutorId,
  settings,
  maxSessionMinutes,
}: {
  language: string;
  tutors: Tutor[];
  currentTutorId: string | null;
  settings: TutorSettings;
  maxSessionMinutes: number;
}) {
  const router = useRouter();
  const [tutorId, setTutorId] = useState(currentTutorId ?? tutors[0]?.id ?? "");
  const [s, setS] = useState<TutorSettings>(settings);
  const [status, setStatus] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [pending, setPending] = useState(false);
  const set = <K extends keyof TutorSettings>(k: K, v: TutorSettings[K]) => setS((x) => ({ ...x, [k]: v }));

  async function save() {
    setPending(true);
    setStatus(null);
    try {
      await api("/api/plan", { method: "PUT", body: { language, tutorId, settings: s } });
      setStatus({ tone: "success", text: "Saved. These settings apply to your next conversation." });
      router.refresh();
    } catch (err) {
      setStatus({ tone: "danger", text: err instanceof ApiError ? err.message : "Couldn't save." });
    } finally {
      setPending(false);
    }
  }

  const radio = <K extends keyof TutorSettings>(
    k: K,
    options: [TutorSettings[K], string][],
    legend: string,
    hint?: string,
  ) => (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 font-semibold">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(([v, l]) => (
          <label
            key={String(v)}
            className="flex min-h-10 cursor-pointer items-center gap-2 rounded-full border-2 border-border px-4 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-on-primary"
          >
            <input type="radio" className="sr-only" checked={s[k] === v} onChange={() => set(k, v)} />
            {l}
          </label>
        ))}
      </div>
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </fieldset>
  );

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-3 text-xl font-bold">Your tutor</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {tutors.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={tutorId === t.id}
              onClick={() => setTutorId(t.id)}
              className="flex gap-4 rounded-2xl border-2 border-border bg-surface p-4 text-left hover:border-primary aria-[pressed=true]:border-primary"
            >
              <TutorAvatar avatarKey={t.avatar_key} name={t.name} size={64} />
              <span className="flex flex-col gap-1">
                <span className="flex items-center gap-2 font-display text-lg font-bold">
                  {t.name} <AiBadge />
                </span>
                <span className="text-sm font-semibold">{t.tagline}</span>
                <span className="text-sm text-muted">{t.bio}</span>
                <span className="text-xs text-muted">Corrections: {t.correction_style}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-xl font-bold">How the conversation works</h2>
        {radio(
          "mode",
          [
            ["beginner", "Beginner"],
            ["balanced", "Balanced"],
            ["immersion", "Immersion"],
          ],
          "Conversation mode",
          "Beginner keeps replies short with lots of help. Immersion stays in the language you're learning.",
        )}
        {radio(
          "difficulty",
          [
            ["easier", "Easier"],
            ["standard", "Standard"],
            ["harder", "Harder"],
          ],
          "Difficulty",
        )}
        {radio(
          "correctionFrequency",
          [
            ["minimal", "Only big mistakes"],
            ["balanced", "The important ones"],
            ["thorough", "Every mistake"],
          ],
          "Corrections",
        )}
        <fieldset className="flex flex-col gap-2">
          <legend className="font-semibold">
            How much of the reply should be in the language you&apos;re learning?
          </legend>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={10}
              max={100}
              step={10}
              value={s.targetPercent}
              onChange={(e) => set("targetPercent", Number(e.target.value))}
              className="w-full accent-[var(--color-primary)]"
              aria-label="Target-language percentage"
            />
            <span className="w-12 text-right font-mono">{s.targetPercent}%</span>
          </div>
        </fieldset>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={s.translationAssist}
            onChange={(e) => set("translationAssist", e.target.checked)}
            className="h-5 w-5 accent-[var(--color-primary)]"
          />
          <span className="font-semibold">Show translations of the tutor&apos;s replies</span>
        </label>
        <fieldset className="flex flex-col gap-2">
          <legend className="font-semibold">Tutor speaking speed</legend>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0.6}
              max={1.4}
              step={0.05}
              value={s.speed}
              onChange={(e) => set("speed", Number(e.target.value))}
              className="w-full accent-[var(--color-primary)]"
              aria-label="Speaking speed"
            />
            <span className="w-12 text-right font-mono">{s.speed.toFixed(2)}×</span>
          </div>
          <p className="text-xs text-muted">Applies when an AI voice is available for this language.</p>
        </fieldset>
        {radio(
          "sessionMinutes",
          ([5, 10, 15, 20, 30] as const)
            .filter((m) => m <= maxSessionMinutes)
            .map((m) => [m, `${m} min`] as [TutorSettings["sessionMinutes"], string]),
          "Session length",
          maxSessionMinutes < 30
            ? `Your plan allows sessions up to ${maxSessionMinutes} minutes.`
            : undefined,
        )}
      </section>
      {status ? <Notice tone={status.tone}>{status.text}</Notice> : null}
      <Button size="lg" onClick={save} disabled={pending || !tutorId} className="self-start">
        {pending ? "Saving…" : "Save tutor settings"}
      </Button>
    </div>
  );
}
