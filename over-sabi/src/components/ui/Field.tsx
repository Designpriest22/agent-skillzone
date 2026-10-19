import type { ComponentProps } from "react";

export function Field({
  label,
  hint,
  error,
  id,
  className = "",
  ...input
}: ComponentProps<"input"> & { label: string; hint?: string; error?: string; id: string }) {
  const describedBy =
    [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...input}
        className="min-h-11 rounded-xl border-2 border-border bg-surface px-3.5 text-base text-text placeholder:text-muted/70 focus:border-primary aria-[invalid=true]:border-danger"
      />
      {hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextArea({
  label,
  id,
  hint,
  ...rest
}: ComponentProps<"textarea"> & { label: string; id: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <textarea
        id={id}
        aria-describedby={hint ? `${id}-hint` : undefined}
        {...rest}
        className="min-h-24 rounded-xl border-2 border-border bg-surface px-3.5 py-2.5 text-base text-text focus:border-primary"
      />
      {hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Select({
  label,
  id,
  children,
  hint,
  ...rest
}: ComponentProps<"select"> & { label: string; id: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <select
        id={id}
        {...rest}
        className="min-h-11 rounded-xl border-2 border-border bg-surface px-3 text-base text-text focus:border-primary"
      >
        {children}
      </select>
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
