"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { buttonClass } from "./ui";

export function SubmitButton({ children, variant = "primary", size = "md", confirm, name, value }: { children: React.ReactNode; variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md"; confirm?: string; name?: string; value?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" name={name} value={value} disabled={pending} className={buttonClass(variant, size)}
      onClick={(e) => { if (confirm && !window.confirm(confirm)) e.preventDefault(); }}>
      {pending ? "Working…" : children}
    </button>
  );
}

/** Refreshes server data while work is in flight (agents running, jobs queued). */
export function AutoRefresh({ active, intervalMs = 4000 }: { active: boolean; intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(t);
  }, [active, intervalMs, router]);
  return active ? <span className="inline-flex items-center gap-1.5 text-[12px] text-fg-3"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />Live</span> : null;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<string | null>(null);
  useEffect(() => { setTheme(document.documentElement.dataset.theme ?? null); }, []);
  const cycle = () => {
    const next = theme === "dark" ? "light" : theme === "light" ? null : "dark";
    if (next) { document.documentElement.dataset.theme = next; try { localStorage.setItem("prohub-theme", next); } catch {} }
    else { delete document.documentElement.dataset.theme; try { localStorage.removeItem("prohub-theme"); } catch {} }
    setTheme(next);
  };
  return <button onClick={cycle} className="text-[12px] text-fg-3 hover:text-fg" title="Theme">{theme ?? "system"} theme</button>;
}
