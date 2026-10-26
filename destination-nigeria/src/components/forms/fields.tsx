"use client";

import Link from "next/link";
import type { SubmitState } from "./useForm";

type Common = { name: string; label: string; error?: string; hint?: string; required?: boolean; idPrefix: string };

function describedBy(id: string, error?: string, hint?: string) {
  return [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
}

function ErrorText({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p className="field-error" id={`${id}-error`}>
      <span aria-hidden="true">!</span> {error}
    </p>
  );
}

export function TextField({ type = "text", autoComplete, ...p }: Common & { type?: string; autoComplete?: string }) {
  const id = `${p.idPrefix}-${p.name}`;
  return (
    <div className="field">
      <label htmlFor={id}>
        {p.label}
        {p.required ? null : <span className="muted" style={{ fontWeight: 400 }}> (optional)</span>}
      </label>
      {p.hint ? (
        <p className="hint" id={`${id}-hint`}>
          {p.hint}
        </p>
      ) : null}
      <input
        id={id}
        name={p.name}
        type={type}
        className="input"
        autoComplete={autoComplete}
        required={p.required}
        aria-invalid={p.error ? true : undefined}
        aria-describedby={describedBy(id, p.error, p.hint)}
      />
      <ErrorText id={id} error={p.error} />
    </div>
  );
}

export function TextArea(p: Common) {
  const id = `${p.idPrefix}-${p.name}`;
  return (
    <div className="field">
      <label htmlFor={id}>{p.label}</label>
      {p.hint ? (
        <p className="hint" id={`${id}-hint`}>
          {p.hint}
        </p>
      ) : null}
      <textarea id={id} name={p.name} className="textarea" required={p.required} aria-invalid={p.error ? true : undefined} aria-describedby={describedBy(id, p.error, p.hint)} />
      <ErrorText id={id} error={p.error} />
    </div>
  );
}

export function SelectField({ options, placeholder = "Choose…", ...p }: Common & { options: readonly { value: string; label: string }[]; placeholder?: string }) {
  const id = `${p.idPrefix}-${p.name}`;
  return (
    <div className="field">
      <label htmlFor={id}>{p.label}</label>
      {p.hint ? (
        <p className="hint" id={`${id}-hint`}>
          {p.hint}
        </p>
      ) : null}
      <select id={id} name={p.name} className="select" required={p.required} defaultValue="" aria-invalid={p.error ? true : undefined} aria-describedby={describedBy(id, p.error, p.hint)}>
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ErrorText id={id} error={p.error} />
    </div>
  );
}

export function CheckboxGroup({ options, ...p }: Common & { options: readonly { value: string; label: string }[] }) {
  const id = `${p.idPrefix}-${p.name}`;
  return (
    <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }} aria-describedby={describedBy(id, p.error, p.hint)}>
      <legend>
        {p.label} <span className="muted" style={{ fontWeight: 400 }}>(optional)</span>
      </legend>
      <div className="stack" style={{ gap: "0.5rem", marginTop: "0.4rem" }}>
        {options.map((o) => (
          <label key={o.value} className="check">
            <input type="checkbox" name={p.name} value={o.value} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
      <ErrorText id={id} error={p.error} />
    </fieldset>
  );
}

export function Consent({ idPrefix, error, children }: { idPrefix: string; error?: string; children?: React.ReactNode }) {
  const id = `${idPrefix}-consent`;
  return (
    <div className="field">
      <label className="check" htmlFor={id}>
        <input id={id} type="checkbox" name="consent" required aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined} />
        <span>
          {children ?? "I agree that Destination Nigeria may use these details to respond to this enquiry."} Read the{" "}
          <Link href="/privacy">privacy policy</Link>.
        </span>
      </label>
      <ErrorText id={id} error={error} />
    </div>
  );
}

/** Hidden from people and assistive tech; bots tend to fill it. */
export function Honeypot() {
  return (
    <div className="hp-field" aria-hidden="true">
      <label>
        Leave this field empty
        <input type="text" name="company_url" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );
}

export function FormStatus({ state, success }: { state: SubmitState; success: React.ReactNode }) {
  return (
    <div aria-live="polite" role="status">
      {state.phase === "success" ? (
        <div className="status status--success">
          <span aria-hidden="true">✓</span>
          <div>{success}</div>
        </div>
      ) : state.phase === "error" ? (
        <div className="status status--error" role="alert">
          <span aria-hidden="true">!</span>
          <div>
            <strong>Not sent.</strong> {state.message}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SubmitButton({ state, children, className = "btn btn--forest" }: { state: SubmitState; children: React.ReactNode; className?: string }) {
  const busy = state.phase === "submitting";
  return (
    <button type="submit" className={className} aria-disabled={busy} disabled={busy}>
      {busy ? "Sending…" : children}
    </button>
  );
}
