"use client";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/client/api";

function useAdmin() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  async function run(action: string, input: unknown, success = "Saved.") {
    setPending(true);
    setMessage(null);
    try {
      await api("/api/admin", { body: { action, input } });
      setMessage({ ok: true, text: success });
      router.refresh();
    } catch (err) {
      setMessage({ ok: false, text: err instanceof ApiError ? err.message : "Failed." });
    } finally {
      setPending(false);
    }
  }
  return { pending, message, run };
}

export function AdminButton({
  action,
  input,
  label,
  confirm,
  variant = "secondary",
  prompt,
}: {
  action: string;
  input: Record<string, unknown>;
  label: string;
  confirm?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  prompt?: { field: string; question: string; required?: boolean };
}) {
  const a = useAdmin();
  return (
    <span className="inline-flex flex-col gap-1">
      <Button
        size="sm"
        variant={variant}
        disabled={a.pending}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          let extra: Record<string, unknown> = {};
          if (prompt) {
            const v = window.prompt(prompt.question) ?? null;
            if (v === null || (prompt.required && !v.trim())) return;
            extra = { [prompt.field]: v };
          }
          void a.run(action, { ...input, ...extra });
        }}
      >
        {label}
      </Button>
      {a.message && !a.message.ok ? <span className="text-xs text-danger">{a.message.text}</span> : null}
    </span>
  );
}

export interface FieldDef {
  name: string;
  label: string;
  type?: "text" | "number" | "textarea" | "select" | "checkbox";
  options?: string[];
  defaultValue?: string | number | boolean;
}

/** Generic admin form: renders fields, posts { action, input } and refreshes. */
export function AdminForm({
  action,
  fields,
  fixed = {},
  submitLabel = "Save",
  children,
}: {
  action: string;
  fields: FieldDef[];
  fixed?: Record<string, unknown>;
  submitLabel?: string;
  children?: ReactNode;
}) {
  const a = useAdmin();
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const input: Record<string, unknown> = { ...fixed };
        for (const f of fields) {
          if (f.type === "checkbox") input[f.name] = fd.get(f.name) === "on";
          else if (f.type === "number") input[f.name] = Number(fd.get(f.name));
          else input[f.name] = String(fd.get(f.name) ?? "");
        }
        void a.run(action, input);
      }}
    >
      {children}
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((f) => {
          const id = `${action}-${f.name}-${String(fixed.id ?? fixed.code ?? "")}`;
          const cls = "w-full rounded-lg border-2 border-border bg-surface px-2.5 py-1.5 text-sm";
          return (
            <label
              key={f.name}
              htmlFor={id}
              className={`flex flex-col gap-1 text-xs font-semibold ${f.type === "textarea" ? "sm:col-span-2" : ""} ${f.type === "checkbox" ? "flex-row items-center gap-2" : ""}`}
            >
              {f.type === "checkbox" ? (
                <input
                  id={id}
                  name={f.name}
                  type="checkbox"
                  defaultChecked={!!f.defaultValue}
                  className="accent-[var(--color-primary)]"
                />
              ) : null}
              {f.label}
              {f.type === "textarea" ? (
                <textarea
                  id={id}
                  name={f.name}
                  defaultValue={String(f.defaultValue ?? "")}
                  className={`${cls} lang-text min-h-20 font-normal`}
                />
              ) : f.type === "select" ? (
                <select id={id} name={f.name} defaultValue={String(f.defaultValue ?? "")} className={cls}>
                  {f.options?.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              ) : f.type === "checkbox" ? null : (
                <input
                  id={id}
                  name={f.name}
                  type={f.type ?? "text"}
                  defaultValue={String(f.defaultValue ?? "")}
                  className={`${cls} lang-text font-normal`}
                />
              )}
            </label>
          );
        })}
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={a.pending}>
          {submitLabel}
        </Button>
        {a.message ? (
          <span className={`text-sm ${a.message.ok ? "text-success" : "text-danger"}`}>{a.message.text}</span>
        ) : null}
      </div>
    </form>
  );
}
