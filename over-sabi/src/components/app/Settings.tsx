"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Select } from "@/components/ui/Field";
import { Notice } from "@/components/ui/primitives";
import { api, ApiError } from "@/lib/client/api";

type Status = { tone: "success" | "danger"; text: string } | null;

function useSaver() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(null);
  const [pending, setPending] = useState(false);
  async function run(fn: () => Promise<unknown>, ok = "Saved.") {
    setPending(true);
    setStatus(null);
    try {
      await fn();
      setStatus({ tone: "success", text: ok });
      router.refresh();
    } catch (err) {
      setStatus({ tone: "danger", text: err instanceof ApiError ? err.message : "Couldn't save." });
    } finally {
      setPending(false);
    }
  }
  return { status, pending, run };
}

export function AccountSection({
  displayName,
  email,
  verified,
}: {
  displayName: string;
  email: string;
  verified: boolean;
}) {
  const router = useRouter();
  const s = useSaver();
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        void s.run(() =>
          api("/api/profile", { method: "PATCH", body: { displayName: fd.get("displayName") } }),
        );
      }}
    >
      <Field
        id="displayName"
        name="displayName"
        label="Display name"
        defaultValue={displayName}
        maxLength={60}
        required
      />
      <div>
        <p className="text-sm font-semibold">Email</p>
        <p>
          {email}{" "}
          {verified ? (
            <span className="text-sm text-success">· confirmed</span>
          ) : (
            <span className="text-sm text-warning">· not confirmed</span>
          )}
        </p>
        {!verified ? (
          <button
            type="button"
            className="mt-1 text-sm underline"
            onClick={() =>
              s.run(
                () => api("/api/auth/resend-verification", { method: "POST" }),
                "If email delivery is set up, a new link is on its way.",
              )
            }
          >
            Resend confirmation email
          </button>
        ) : null}
      </div>
      {s.status ? <Notice tone={s.status.tone}>{s.status.text}</Notice> : null}
      <div className="flex gap-3">
        <Button type="submit" disabled={s.pending}>
          Save
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={async () => {
            await api("/api/auth/signout", { method: "POST" }).catch(() => {});
            router.replace("/");
            router.refresh();
          }}
        >
          Sign out
        </Button>
      </div>
    </form>
  );
}

export function LearningSection({
  plans,
  explanationLanguage,
  dailyGoal,
  timezone,
}: {
  plans: { language_code: string; language_name: string; is_active: boolean }[];
  explanationLanguage: string;
  dailyGoal: number;
  timezone: string;
}) {
  const s = useSaver();
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const active = String(fd.get("active"));
        void s.run(async () => {
          await api("/api/profile", {
            method: "PATCH",
            body: {
              explanationLanguage: fd.get("explain"),
              dailyGoalMinutes: Number(fd.get("goal")),
              timezone: fd.get("timezone"),
            },
          });
          if (active) await api("/api/plan", { method: "PUT", body: { language: active, makeActive: true } });
        });
      }}
    >
      <Select
        id="active"
        name="active"
        label="Language you're focusing on"
        defaultValue={plans.find((p) => p.is_active)?.language_code ?? plans[0]?.language_code}
      >
        {plans.map((p) => (
          <option key={p.language_code} value={p.language_code}>
            {p.language_name}
          </option>
        ))}
      </Select>
      <p className="-mt-2 text-xs text-muted">
        To add another language,{" "}
        <a href="/onboarding" className="underline">
          set up a new plan
        </a>
        .
      </p>
      <Select id="explain" name="explain" label="Explanations in" defaultValue={explanationLanguage}>
        <option value="en">English</option>
        <option value="pcm">Nigerian Pidgin (experimental)</option>
        <option value="fr">French</option>
      </Select>
      <Select id="goal" name="goal" label="Daily goal" defaultValue={String(dailyGoal)}>
        {[5, 10, 15, 20, 30].map((m) => (
          <option key={m} value={m}>
            {m} minutes
          </option>
        ))}
      </Select>
      <Field
        id="timezone"
        name="timezone"
        label="Time zone"
        defaultValue={timezone}
        hint="Used to count your streak days, e.g. Africa/Lagos, Europe/London."
      />
      {s.status ? <Notice tone={s.status.tone}>{s.status.text}</Notice> : null}
      <Button type="submit" disabled={s.pending} className="self-start">
        Save learning settings
      </Button>
    </form>
  );
}

export function NotificationSection({
  prefs,
}: {
  prefs: { review_reminders: boolean; streak_reminders: boolean; weekly_summary: boolean; email: boolean };
}) {
  const s = useSaver();
  const [p, setP] = useState(prefs);
  const items: [keyof typeof prefs, string][] = [
    ["review_reminders", "Remind me when words are due for revision"],
    ["streak_reminders", "Remind me to keep my streak"],
    ["weekly_summary", "Weekly progress summary"],
    ["email", "Also send reminders by email (when email is set up)"],
  ];
  return (
    <div className="flex flex-col gap-3">
      {items.map(([k, l]) => (
        <label key={k} className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={p[k]}
            onChange={(e) => setP((x) => ({ ...x, [k]: e.target.checked }))}
            className="h-5 w-5 accent-[var(--color-primary)]"
          />
          {l}
        </label>
      ))}
      {s.status ? <Notice tone={s.status.tone}>{s.status.text}</Notice> : null}
      <Button
        className="self-start"
        disabled={s.pending}
        onClick={() => s.run(() => api("/api/profile", { method: "PATCH", body: { notificationPrefs: p } }))}
      >
        Save notifications
      </Button>
    </div>
  );
}

export function PrivacySection({
  analyticsOptOut,
  leaderboardOptIn,
  voiceConsent,
  isTeen,
  email,
}: {
  analyticsOptOut: boolean;
  leaderboardOptIn: boolean;
  voiceConsent: boolean;
  isTeen: boolean;
  email: string;
}) {
  const router = useRouter();
  const s = useSaver();
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const toggle = (body: Record<string, boolean>) =>
    s.run(() => api("/api/profile", { method: "PATCH", body }));
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            defaultChecked={!analyticsOptOut}
            onChange={(e) => toggle({ analyticsOptOut: !e.target.checked })}
            className="h-5 w-5 accent-[var(--color-primary)]"
          />
          Help improve Over Sabi with anonymous-style usage events (no recordings, no message text)
        </label>
        {!isTeen ? (
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              defaultChecked={leaderboardOptIn}
              onChange={(e) => toggle({ leaderboardOptIn: e.target.checked })}
              className="h-5 w-5 accent-[var(--color-primary)]"
            />
            Show my display name and weekly XP on the leaderboard
          </label>
        ) : null}
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            defaultChecked={voiceConsent}
            onChange={(e) => toggle({ voiceProcessingConsent: e.target.checked })}
            className="h-5 w-5 accent-[var(--color-primary)]"
          />
          Allow my voice recordings to be sent to our speech provider for transcription (audio is not stored)
        </label>
        {s.status ? <Notice tone={s.status.tone}>{s.status.text}</Notice> : null}
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="font-semibold">Your data</h3>
        <p className="text-sm text-muted">
          Download everything we hold about you as a JSON file: profile, progress, notebook, transcripts and
          summaries.
        </p>
        <a
          href="/api/account/export"
          className="self-start rounded-full border-2 border-text px-5 py-2 font-semibold"
        >
          Download my data
        </a>
      </div>
      <div className="flex flex-col gap-3 rounded-2xl border-2 border-danger/50 p-4">
        <h3 className="font-semibold text-danger">Delete account</h3>
        <p className="text-sm">
          This permanently deletes your account, progress, notebook, transcripts and summaries. It can&apos;t
          be undone. Accepted community contributions stay in the course without your name.
        </p>
        <Field
          id="confirmEmail"
          label={`Type ${email} to confirm`}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="off"
        />
        {deleteError ? <Notice tone="danger">{deleteError}</Notice> : null}
        <Button
          variant="danger"
          className="self-start"
          disabled={deleting || confirm.trim().toLowerCase() !== email.toLowerCase()}
          onClick={async () => {
            setDeleting(true);
            setDeleteError(null);
            try {
              const r = await api<{ hadActiveSubscription: boolean }>("/api/account", {
                method: "DELETE",
                body: { confirmEmail: confirm },
              });
              router.replace(`/goodbye${r.hadActiveSubscription ? "?subscription=1" : ""}`);
            } catch (err) {
              setDeleteError(err instanceof ApiError ? err.message : "Couldn't delete the account.");
              setDeleting(false);
            }
          }}
        >
          {deleting ? "Deleting…" : "Permanently delete my account"}
        </Button>
      </div>
    </div>
  );
}

export function BillingActions({ canCancel }: { canCancel: boolean }) {
  const s = useSaver();
  if (!canCancel) return null;
  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="secondary"
        className="self-start"
        disabled={s.pending}
        onClick={() => {
          if (
            window.confirm("Cancel renewal? You keep your plan until the end of the period you've paid for.")
          ) {
            void s.run(
              () => api("/api/billing/cancel", { method: "POST" }),
              "Renewal cancelled. Your plan stays active until the period ends.",
            );
          }
        }}
      >
        Cancel renewal
      </Button>
      {s.status ? <Notice tone={s.status.tone}>{s.status.text}</Notice> : null}
    </div>
  );
}
