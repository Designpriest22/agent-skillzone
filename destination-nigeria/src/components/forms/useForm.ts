"use client";

import { useEffect, useRef, useState } from "react";
import type { z } from "zod";
import { fieldErrors } from "@/lib/forms";

export type SubmitState =
  | { phase: "idle" }
  | { phase: "submitting" }
  | { phase: "success" }
  | { phase: "error"; message: string };

/**
 * Shared submit logic: client validation with the same schema the server uses,
 * spam-guard fields, and honest outcomes — success is shown only when the
 * server confirms delivery.
 */
export function useEnquiryForm<S extends z.ZodType>(schema: S, opts: { onSuccess?: () => void } = {}) {
  const started = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<SubmitState>({ phase: "idle" });

  useEffect(() => {
    started.current = Date.now();
  }, []);

  function focusFirstError(errs: Record<string, string>) {
    const first = Object.keys(errs)[0];
    if (!first || !formRef.current) return;
    const el = formRef.current.querySelector<HTMLElement>(`[name="${first}"]`);
    el?.focus();
  }

  async function submit(values: Record<string, unknown>) {
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const errs = fieldErrors(parsed.error);
      setErrors(errs);
      setState({ phase: "error", message: "Some fields need attention." });
      focusFirstError(errs);
      return;
    }
    setErrors({});
    setState({ phase: "submitting" });
    try {
      const honeypot = formRef.current?.querySelector<HTMLInputElement>('[name="company_url"]')?.value ?? "";
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...(parsed.data as object), company_url: honeypot, started: started.current }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; code?: string; message?: string; errors?: Record<string, string> };
      if (res.ok && data.code === "delivered") {
        setState({ phase: "success" });
        opts.onSuccess?.();
        formRef.current?.reset();
        return;
      }
      if (data.errors) {
        setErrors(data.errors);
        focusFirstError(data.errors);
      }
      setState({ phase: "error", message: data.message ?? "Your details could not be sent. Please try again." });
    } catch {
      setState({ phase: "error", message: "We couldn't reach the server. Check your connection and try again; nothing was sent." });
    }
  }

  return { formRef, errors, state, submit, setState };
}

/** Read a form into a plain object, collecting checkbox groups into arrays. */
export function readForm(form: HTMLFormElement, arrays: string[] = []): Record<string, unknown> {
  const fd = new FormData(form);
  const out: Record<string, unknown> = {};
  for (const [k, v] of fd.entries()) {
    if (k === "company_url") continue;
    if (arrays.includes(k)) out[k] = [...((out[k] as string[]) ?? []), String(v)];
    else out[k] = String(v);
  }
  for (const a of arrays) out[a] ??= [];
  if ("consent" in out) out.consent = out.consent === "on";
  else out.consent = false;
  return out;
}
