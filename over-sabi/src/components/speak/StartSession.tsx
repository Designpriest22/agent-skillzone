"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/primitives";
import { api, ApiError } from "@/lib/client/api";

export function StartSessionButton({
  language,
  tutorId,
  disabled,
}: {
  language: string;
  tutorId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<{ message: string; code: string } | null>(null);
  async function start() {
    setPending(true);
    setError(null);
    try {
      const r = await api<{ sessionId: string }>("/api/tutor/sessions", { body: { language, tutorId } });
      router.push(`/speak/session/${r.sessionId}`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? { message: err.message, code: err.code }
          : { message: "Couldn't start. Try again.", code: "error" },
      );
      setPending(false);
    }
  }
  return (
    <div className="flex flex-col gap-3">
      <Button size="lg" onClick={start} disabled={pending || disabled} className="self-start">
        {pending ? "Connecting to your tutor…" : "Start conversation"}
      </Button>
      {error ? (
        <Notice tone={error.code === "usage_limit" ? "warning" : "danger"}>
          {error.message}{" "}
          {error.code === "usage_limit" ? (
            <a href="/pricing">See plans</a>
          ) : error.code === "tutor_unavailable" || error.code === "tutor_failed" ? (
            <a href="/speak/dialogues">Practise guided dialogues</a>
          ) : null}
        </Notice>
      ) : null}
    </div>
  );
}
