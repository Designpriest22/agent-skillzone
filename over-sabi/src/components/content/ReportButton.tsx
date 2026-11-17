"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/client/api";

const REASONS = [
  ["wrong_translation", "The translation is wrong"],
  ["wrong_spelling", "The spelling is wrong"],
  ["tone_marks", "Tone marks or dots are wrong"],
  ["dialect", "It's different where I'm from"],
  ["offensive", "It's offensive or inappropriate"],
  ["other", "Something else"],
] as const;

/** "Report a problem" — feeds the admin translation-quality queue. */
export function ReportButton({
  entityType,
  entityId,
  language,
}: {
  entityType: "vocabulary" | "lesson" | "activity" | "cultural_note" | "tutor_reply";
  entityId: string | null;
  language: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setState("sending");
    try {
      await api("/api/reports", {
        body: { entityType, entityId, language, reason: fd.get("reason"), details: fd.get("details") ?? "" },
      });
      setState("sent");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't send the report.");
      setState("error");
    }
  }

  return (
    <>
      <button
        type="button"
        className="text-sm text-muted underline"
        onClick={() => {
          setState("idle");
          dialog.current?.showModal();
        }}
      >
        Report a problem
      </button>
      <dialog
        ref={dialog}
        className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl border border-border bg-surface p-0 text-text backdrop:bg-ink/50"
      >
        {state === "sent" ? (
          <div className="flex flex-col gap-4 p-6">
            <p className="font-display text-xl font-bold">Thank you</p>
            <p className="text-sm text-muted">
              A reviewer will look at this. Reports like yours are how the content gets better.
            </p>
            <Button type="button" onClick={() => dialog.current?.close()}>
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4 p-6">
            <p className="font-display text-xl font-bold">What&apos;s wrong?</p>
            <fieldset className="flex flex-col gap-2">
              <legend className="sr-only">Reason</legend>
              {REASONS.map(([v, l], i) => (
                <label key={v} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="reason"
                    value={v}
                    defaultChecked={i === 0}
                    className="accent-[var(--color-primary)]"
                  />
                  {l}
                </label>
              ))}
            </fieldset>
            <label className="flex flex-col gap-1 text-sm font-semibold">
              Details (optional)
              <textarea
                name="details"
                maxLength={2000}
                className="min-h-20 rounded-xl border-2 border-border bg-bg p-2 font-normal"
                placeholder="What should it say?"
              />
            </label>
            {state === "error" ? <p className="text-sm text-danger">{error}</p> : null}
            <div className="flex gap-2">
              <Button type="submit" disabled={state === "sending"}>
                {state === "sending" ? "Sending…" : "Send report"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => dialog.current?.close()}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
