import type { ComponentProps, ReactNode } from "react";

export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={`rounded-[var(--radius-card)] border border-border bg-surface p-5 ${className}`}
    />
  );
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`font-mono text-xs uppercase tracking-[0.14em] text-muted ${className}`}>{children}</p>
  );
}

export function PageHeader({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children?: ReactNode;
}) {
  return (
    <header className="mb-6">
      {eyebrow ? <Eyebrow className="mb-1">{eyebrow}</Eyebrow> : null}
      <h1 className="text-3xl font-extrabold sm:text-4xl">{title}</h1>
      {children ? <div className="mt-2 max-w-2xl text-muted">{children}</div> : null}
    </header>
  );
}

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "accent";
const badgeTones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-text",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/15 text-danger",
  info: "bg-indigo/15 text-text",
  accent: "bg-ember/20 text-accent-safe",
};

export function Badge({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeTones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

const REVIEW_LABEL: Record<string, { label: string; tone: Tone; title: string }> = {
  verified: { label: "Reviewed", tone: "success", title: "Approved by a native-speaker reviewer." },
  editorial_draft: {
    label: "Draft · awaiting review",
    tone: "warning",
    title: "Written by our editorial team; not yet approved by a native-speaker reviewer.",
  },
  in_review: { label: "In review", tone: "info", title: "A native-speaker reviewer is checking this." },
  ai_draft: {
    label: "AI draft",
    tone: "danger",
    title: "Drafted with AI and not yet checked. Treat with caution.",
  },
  disputed: {
    label: "Disputed",
    tone: "danger",
    title: "Reviewers disagree on this item. Treat with caution.",
  },
};

export function ReviewBadge({ status }: { status: string }) {
  const s = REVIEW_LABEL[status] ?? { label: status, tone: "neutral" as Tone, title: "" };
  return (
    <Badge tone={s.tone}>
      <span title={s.title}>{s.label}</span>
    </Badge>
  );
}

type NoticeTone = "info" | "warning" | "danger" | "success";
const noticeTones: Record<NoticeTone, string> = {
  info: "border-indigo/30 bg-indigo/5",
  warning: "border-warning/40 bg-warning/10",
  danger: "border-danger/40 bg-danger/10",
  success: "border-success/40 bg-success/10",
};

export function Notice({
  tone = "info",
  title,
  children,
  className = "",
}: {
  tone?: NoticeTone;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={`rounded-2xl border px-4 py-3 text-sm ${noticeTones[tone]} ${className}`}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      {children ? <div className="text-muted [&_a]:underline">{children}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-border px-6 py-10 text-center">
      <svg width="88" height="40" viewBox="0 0 88 40" aria-hidden className="mb-3">
        <polyline
          points="4,20 22,8 40,20 58,32 84,14"
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="2 7"
        />
      </svg>
      <p className="font-display text-lg font-bold">{title}</p>
      {children ? <div className="mt-1 max-w-md text-sm text-muted">{children}</div> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2"
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-500"
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="font-mono text-[0.7rem] uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 font-display text-3xl font-extrabold">{value}</p>
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
