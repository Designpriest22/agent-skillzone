"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, TextArea } from "@/components/ui/Field";
import { Notice } from "@/components/ui/primitives";
import { api, ApiError } from "@/lib/client/api";

export function SupportForm({ email }: { email?: string }) {
  const [state, setState] = useState<"idle" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  if (state === "sent")
    return (
      <Notice tone="success" title="Message received">
        We&apos;ll reply by email.
      </Notice>
    );
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        try {
          await api("/api/support", {
            body: { email: fd.get("email"), subject: fd.get("subject"), message: fd.get("message") },
          });
          setState("sent");
        } catch (err) {
          setError(err instanceof ApiError ? err.message : "Couldn't send.");
        }
      }}
    >
      {error ? <Notice tone="danger">{error}</Notice> : null}
      <Field id="email" name="email" type="email" label="Your email" defaultValue={email} required />
      <Field id="subject" name="subject" label="Subject" required maxLength={200} />
      <TextArea
        id="message"
        name="message"
        label="How can we help?"
        required
        minLength={5}
        maxLength={5000}
      />
      <Button type="submit" className="self-start">
        Send message
      </Button>
    </form>
  );
}
