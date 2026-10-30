"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Notice } from "@/components/ui/primitives";
import { api, ApiError } from "@/lib/client/api";
import { readGuestProgress, clearGuestProgress } from "@/lib/client/guest";

async function mergeGuest() {
  const g = readGuestProgress();
  if (!g.completedLessons.length && !g.savedVocabIds.length) return;
  try {
    await api("/api/guest/merge", { body: g });
    clearGuestProgress();
  } catch {
    /* keep local copy; we'll try again next sign-in */
  }
}

export function SignInForm({
  next,
  googleEnabled,
  error,
}: {
  next?: string;
  googleEnabled: boolean;
  error?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(error ?? null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setPending(true);
    setMessage(null);
    try {
      await api("/api/auth/signin", { body: { email: fd.get("email"), password: fd.get("password") } });
      await mergeGuest();
      router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/home");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Couldn't sign in. Try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {message ? <Notice tone="danger">{message}</Notice> : null}
      <Field id="email" name="email" type="email" label="Email" autoComplete="email" required />
      <Field
        id="password"
        name="password"
        type="password"
        label="Password"
        autoComplete="current-password"
        required
      />
      <Button type="submit" disabled={pending} size="lg">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <div className="flex justify-between text-sm">
        <Link href="/forgot-password" className="underline">
          Forgot password?
        </Link>
        <Link href="/signup" className="font-semibold underline">
          Create an account
        </Link>
      </div>
      {googleEnabled ? <GoogleButton /> : null}
    </form>
  );
}

function GoogleButton() {
  return (
    <>
      <div className="flex items-center gap-3 text-xs text-muted" aria-hidden>
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>
      <a
        href="/api/auth/google/start"
        className="inline-flex min-h-11 items-center justify-center rounded-full border-2 border-border font-semibold hover:bg-surface-2"
      >
        Continue with Google
      </a>
    </>
  );
}

export function SignUpForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const age = fd.get("age");
    setPending(true);
    setMessage(null);
    setFieldErrors({});
    if (age === "under13") {
      setMessage(
        "Over Sabi accounts are for people aged 13 and over. A family plan with parent controls is on our roadmap.",
      );
      setPending(false);
      return;
    }
    try {
      await api("/api/auth/signup", {
        body: {
          displayName: fd.get("displayName"),
          email: fd.get("email"),
          password: fd.get("password"),
          ageConfirmed: age === "teen" || age === "adult",
          ageBand: age === "teen" ? "teen" : "adult",
          acceptTerms: fd.get("terms") === "on",
        },
      });
      await mergeGuest();
      router.replace("/onboarding");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.issues) {
        setFieldErrors(Object.fromEntries(err.issues.map((i) => [String(i.path[0]), i.message])));
      }
      setMessage(err instanceof ApiError ? err.message : "Couldn't create your account. Try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {message ? <Notice tone="danger">{message}</Notice> : null}
      <Field
        id="displayName"
        name="displayName"
        label="What should we call you?"
        autoComplete="nickname"
        required
        maxLength={60}
        error={fieldErrors.displayName}
      />
      <Field
        id="email"
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        required
        error={fieldErrors.email}
      />
      <Field
        id="password"
        name="password"
        type="password"
        label="Password"
        autoComplete="new-password"
        hint="At least 10 characters."
        required
        minLength={10}
        error={fieldErrors.password}
      />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold">How old are you?</legend>
        {[
          ["adult", "18 or older"],
          ["teen", "13 to 17"],
          ["under13", "Under 13"],
        ].map(([v, l]) => (
          <label key={v} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="age"
              value={v}
              required
              className="h-4 w-4 accent-[var(--color-primary)]"
            />{" "}
            {l}
          </label>
        ))}
        {fieldErrors.ageConfirmed ? <p className="text-sm text-danger">{fieldErrors.ageConfirmed}</p> : null}
      </fieldset>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="terms" className="mt-1 h-4 w-4 accent-[var(--color-primary)]" />
        <span>
          I agree to the{" "}
          <Link href="/terms" className="underline">
            terms
          </Link>{" "}
          and have read the{" "}
          <Link href="/privacy" className="underline">
            privacy policy
          </Link>
          .
        </span>
      </label>
      {fieldErrors.acceptTerms ? <p className="text-sm text-danger">{fieldErrors.acceptTerms}</p> : null}
      <Button type="submit" disabled={pending} size="lg">
        {pending ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-sm">
        Already learning?{" "}
        <Link href="/signin" className="font-semibold underline">
          Sign in
        </Link>
      </p>
      {googleEnabled ? <GoogleButton /> : null}
    </form>
  );
}

export function ForgotForm() {
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      await api("/api/auth/forgot", { body: { email: new FormData(e.currentTarget).get("email") } });
      setSent(true);
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Try again.");
    }
  }
  if (sent)
    return (
      <Notice tone="success" title="Check your inbox">
        If an account exists for that email, a reset link is on its way. It expires in an hour.
      </Notice>
    );
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {message ? <Notice tone="danger">{message}</Notice> : null}
      <Field id="email" name="email" type="email" label="Email" autoComplete="email" required />
      <Button type="submit">Send reset link</Button>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      await api("/api/auth/reset", {
        body: { token, password: new FormData(e.currentTarget).get("password") },
      });
      router.replace("/home");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Try again.");
    }
  }
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {message ? <Notice tone="danger">{message}</Notice> : null}
      <Field
        id="password"
        name="password"
        type="password"
        label="New password"
        autoComplete="new-password"
        hint="At least 10 characters."
        required
        minLength={10}
      />
      <Button type="submit">Save new password</Button>
    </form>
  );
}
