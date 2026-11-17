"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const SECTIONS: { label: string; items: { href: string; label: string; key?: string }[] }[] = [
  { label: "Command", items: [
    { href: "/os", label: "Executive overview" },
    { href: "/os/command", label: "Command centre" },
    { href: "/os/approvals", label: "Approvals", key: "approvals" },
  ] },
  { label: "Workforce", items: [
    { href: "/os/workforce", label: "AI workforce" },
    { href: "/os/tasks", label: "Tasks" },
  ] },
  { label: "Business", items: [
    { href: "/os/crm", label: "CRM" },
    { href: "/os/projects", label: "Projects" },
    { href: "/os/marketing", label: "Marketing" },
    { href: "/os/finance", label: "Finance" },
  ] },
  { label: "Insight", items: [
    { href: "/os/intelligence", label: "Intelligence" },
    { href: "/os/reports", label: "Reports" },
    { href: "/os/knowledge", label: "Knowledge base" },
  ] },
  { label: "System", items: [
    { href: "/os/integrations", label: "Integrations" },
    { href: "/os/activity", label: "Activity & jobs" },
    { href: "/os/settings", label: "Settings" },
  ] },
];

export function Nav({ counts }: { counts: Record<string, number> }) {
  const path = usePathname();
  return (
    <nav className="space-y-4">
      {SECTIONS.map((s) => (
        <div key={s.label}>
          <div className="mb-1 px-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-fg-3">{s.label}</div>
          {s.items.map((i) => {
            const active = i.href === "/os" ? path === "/os" : path.startsWith(i.href);
            const n = i.key ? counts[i.key] : 0;
            return (
              <Link key={i.href} href={i.href} className={cn("flex items-center justify-between rounded-md px-2 py-[5px] text-[13px]", active ? "bg-panel-2 font-medium text-fg" : "text-fg-2 hover:bg-panel-2 hover:text-fg")}>
                {i.label}
                {n ? <span className="num rounded bg-accent px-1.5 text-[11px] font-semibold text-accent-fg">{n}</span> : null}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
