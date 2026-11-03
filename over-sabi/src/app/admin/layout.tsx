import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { requirePageUser } from "@/lib/auth/guards";
import { hasRole } from "@/lib/auth/session";

export const metadata = {
  title: { default: "Admin", template: "%s · Admin · Over Sabi" },
  robots: { index: false },
};

const NAV: [string, string, "reviewer" | "editor" | "admin"][] = [
  ["/admin", "Overview", "reviewer"],
  ["/admin/review", "Review queue", "reviewer"],
  ["/admin/reports", "Reports", "reviewer"],
  ["/admin/content", "Content", "editor"],
  ["/admin/languages", "Languages", "editor"],
  ["/admin/tutors", "Tutors", "editor"],
  ["/admin/users", "Users", "admin"],
  ["/admin/plans", "Plans", "admin"],
  ["/admin/flags", "Flags & providers", "admin"],
  ["/admin/support", "Support", "admin"],
  ["/admin/audit", "Audit log", "admin"],
];

/** Server-side role gate. Reviewers and above only; each page and action re-checks its own minimum role. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser({ role: "reviewer", next: "/admin", allowUnonboarded: true });
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[14rem_1fr]">
      <aside className="border-b border-border p-4 lg:sticky lg:top-0 lg:h-dvh lg:border-b-0 lg:border-r">
        <Link href="/home" aria-label="Back to app">
          <Logo size={26} />
        </Link>
        <p className="mt-2 font-mono text-xs uppercase tracking-wider text-muted">Admin · {user.role}</p>
        <nav aria-label="Admin" className="mt-4 flex flex-wrap gap-1 lg:flex-col">
          {NAV.filter(([, , role]) => hasRole(user, role)).map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-surface-2"
            >
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main id="main" className="min-w-0 p-4 lg:p-8">
        {children}
      </main>
    </div>
  );
}
