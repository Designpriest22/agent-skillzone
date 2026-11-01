import Link from "next/link";
import { cn } from "@/lib/utils";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[19px] font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-fg-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, actions, children, className, pad = true }: { title?: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={cn("rounded-lg border border-line bg-panel", className)}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-2.5">
          <h2 className="text-[12.5px] font-semibold uppercase tracking-[0.04em] text-fg-2">{title}</h2>
          {actions}
        </header>
      )}
      <div className={pad ? "p-4" : ""}>{children}</div>
    </section>
  );
}

export function Stat({ label, value, sub, tone, href }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: "ok" | "warn" | "bad"; href?: string }) {
  const body = (
    <div className="h-full rounded-lg border border-line bg-panel px-4 py-3 transition-colors hover:border-line-strong">
      <div className="text-[11.5px] font-medium uppercase tracking-[0.05em] text-fg-3">{label}</div>
      <div className={cn("num mt-1 text-[22px] font-semibold tracking-tight", tone === "ok" && "text-ok", tone === "warn" && "text-warn", tone === "bad" && "text-bad")}>{value}</div>
      {sub && <div className="mt-0.5 text-[12px] text-fg-2">{sub}</div>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

const TONES: Record<string, string> = {
  neutral: "bg-panel-2 text-fg-2 border-line",
  ok: "bg-ok-soft text-ok border-transparent",
  warn: "bg-warn-soft text-warn border-transparent",
  bad: "bg-bad-soft text-bad border-transparent",
  info: "bg-info-soft text-info border-transparent",
  violet: "bg-violet-soft text-violet border-transparent",
  accent: "bg-accent-soft text-accent border-transparent",
};

export const STATUS_TONE: Record<string, keyof typeof TONES> = {
  proposed: "violet", approved: "info", queued: "info", in_progress: "accent", awaiting_subtasks: "warn", awaiting_approval: "warn",
  completed: "ok", failed: "bad", rejected: "neutral", cancelled: "neutral",
  pending: "warn", executing: "accent", executed: "ok", expired: "neutral",
  active: "ok", paused: "warn", disabled: "neutral", running: "accent", succeeded: "ok", halted: "bad", dead: "bad",
  draft: "neutral", in_review: "info", changes_requested: "warn", published: "ok", scheduled: "info", manual_publish: "warn",
  sent: "info", partially_paid: "warn", paid: "ok", void: "neutral", accepted: "ok",
  hot: "bad", warm: "warn", cold: "neutral", verified: "ok", likely: "info", assumption: "neutral",
  won: "ok", lost: "neutral", new_lead: "info", contacted: "info", responded: "violet", qualified: "violet", meeting_scheduled: "violet", proposal_sent: "accent", negotiation: "accent", follow_up_required: "warn",
  planning: "neutral", on_hold: "warn", new: "info", actioned: "ok", dismissed: "neutral", open: "warn", done: "ok", implemented: "ok", planned: "neutral",
};

export function Badge({ children, tone = "neutral", className }: { children: React.ReactNode; tone?: keyof typeof TONES; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-[4px] border px-1.5 py-[1px] text-[11.5px] font-medium", TONES[tone], className)}>{children}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status] ?? "neutral"}>{status.replace(/_/g, " ")}</Badge>;
}

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("overflow-x-auto", className)}><table className="w-full border-collapse text-left text-[13px]">{children}</table></div>;
}
export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn("border-b border-line px-3 py-2 text-[11.5px] font-medium uppercase tracking-[0.04em] text-fg-3", className)}>{children}</th>;
}
export function Td({ children, className, colSpan }: { children?: React.ReactNode; className?: string; colSpan?: number }) {
  return <td colSpan={colSpan} className={cn("border-b border-line px-3 py-2 align-top", className)}>{children}</td>;
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-line px-4 py-8 text-center">
      <div className="font-medium">{title}</div>
      {children && <div className="mx-auto mt-1 max-w-md text-fg-2">{children}</div>}
    </div>
  );
}

const btn = {
  primary: "bg-accent text-accent-fg hover:opacity-90 border-transparent",
  secondary: "bg-panel text-fg border-line-strong hover:bg-panel-2",
  ghost: "bg-transparent text-fg-2 border-transparent hover:bg-panel-2 hover:text-fg",
  danger: "bg-panel text-bad border-line-strong hover:bg-bad-soft",
};
export function buttonClass(variant: keyof typeof btn = "secondary", size: "sm" | "md" = "md") {
  return cn("inline-flex items-center justify-center gap-1.5 rounded-md border font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50", size === "sm" ? "h-7 px-2.5 text-[12.5px]" : "h-8 px-3 text-[13px]", btn[variant]);
}
export function LinkButton({ href, children, variant = "secondary", size = "md" }: { href: string; children: React.ReactNode; variant?: keyof typeof btn; size?: "sm" | "md" }) {
  return <Link href={href} className={buttonClass(variant, size)}>{children}</Link>;
}

export const inputClass = "h-8 w-full rounded-md border border-line-strong bg-panel px-2.5 text-[13px] text-fg placeholder:text-fg-3 focus:border-accent focus:outline-none";
export const textareaClass = "w-full rounded-md border border-line-strong bg-panel px-2.5 py-2 text-[13px] text-fg placeholder:text-fg-3 focus:border-accent focus:outline-none";

export function Field({ label, children, hint, className }: { label: string; children: React.ReactNode; hint?: string; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-[12px] font-medium text-fg-2">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11.5px] text-fg-3">{hint}</span>}
    </label>
  );
}

export function Tabs({ tabs, active }: { tabs: { href: string; label: string; count?: number }[]; active: string }) {
  return (
    <nav className="mb-4 flex gap-1 border-b border-line">
      {tabs.map((t) => (
        <Link key={t.href} href={t.href} className={cn("-mb-px border-b-2 px-3 py-2 text-[13px] font-medium", active === t.label ? "border-accent text-fg" : "border-transparent text-fg-2 hover:text-fg")}>
          {t.label}{t.count !== undefined && <span className="num ml-1.5 text-fg-3">{t.count}</span>}
        </Link>
      ))}
    </nav>
  );
}

export function KV({ rows }: { rows: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-[minmax(110px,auto)_1fr] gap-x-4 gap-y-1.5">
      {rows.map((r) => (
        <div key={r.label} className="contents">
          <dt className="text-fg-3">{r.label}</dt>
          <dd className="num min-w-0 break-words">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Progress({ value, tone = "accent" }: { value: number; tone?: "accent" | "ok" | "warn" | "bad" }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-panel-2">
      <div className={cn("h-full rounded-full", tone === "accent" && "bg-accent", tone === "ok" && "bg-ok", tone === "warn" && "bg-warn", tone === "bad" && "bg-bad")} style={{ width: `${v}%` }} />
    </div>
  );
}

export function ErrorNote({ children }: { children: React.ReactNode }) {
  return <div className="rounded-md border border-bad/30 bg-bad-soft px-3 py-2 text-[12.5px] text-bad">{children}</div>;
}
export function InfoNote({ children }: { children: React.ReactNode }) {
  return <div className="rounded-md border border-line bg-panel-2 px-3 py-2 text-[12.5px] text-fg-2">{children}</div>;
}
