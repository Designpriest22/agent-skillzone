import Link from "next/link";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { approvals, notifications, tasks } from "@/db/schema";
import { requireUser, logout } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Nav } from "./nav";
import { ThemeToggle } from "@/components/client";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";
export const metadata = { title: { default: "Prohub OS", template: "%s · Prohub OS" }, robots: { index: false } };

async function signOut() {
  "use server";
  await logout();
  redirect("/login");
}

export default async function OSLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [[pending], [unread], [running]] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(approvals).where(eq(approvals.status, "pending")),
    db.select({ n: sql<number>`count(*)::int` }).from(notifications).where(isNull(notifications.readAt)),
    db.select({ n: sql<number>`count(*)::int` }).from(tasks).where(and(sql`${tasks.status} in ('queued','in_progress')`)),
  ]);
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-[220px] shrink-0 flex-col border-r border-line bg-panel px-3 py-4 md:flex">
        <Link href="/os" className="mb-5 flex items-center gap-2 px-2">
          <span className="grid h-6 w-6 place-items-center rounded-[5px] bg-accent text-[12px] font-bold text-accent-fg">P</span>
          <span className="text-[14px] font-semibold tracking-tight">Prohub OS</span>
        </Link>
        <div className="flex-1 overflow-y-auto"><Nav counts={{ approvals: pending.n }} /></div>
        <div className="mt-4 space-y-1 border-t border-line px-2 pt-3 text-[12px]">
          <div className="truncate font-medium">{user.name}</div>
          <div className="text-fg-3">{user.role}</div>
          <div className="flex items-center justify-between pt-1">
            <ThemeToggle />
            <form action={signOut}><button className="text-fg-3 hover:text-fg">Sign out</button></form>
          </div>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex h-11 items-center justify-between gap-3 border-b border-line bg-bg/85 px-5 backdrop-blur">
          <div className="flex items-center gap-3 text-[12px] text-fg-3">
            <Link href="/os" className="font-semibold text-fg md:hidden">Prohub OS</Link>
            <span className="hidden sm:inline">Prohub Creative Solutions</span>
            {running.n > 0 && <Link href="/os/tasks" className="inline-flex items-center gap-1.5 text-fg-2"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />{running.n} task{running.n === 1 ? "" : "s"} running</Link>}
            {env.llmDisabled && <Link href="/os/integrations" className="text-warn">AI engine not connected — add an Anthropic API key</Link>}
          </div>
          <div className="flex items-center gap-3 text-[12.5px]">
            <Link href="/os/approvals" className="text-fg-2 hover:text-fg">Approvals <span className="num">{pending.n}</span></Link>
            <Link href="/os/activity?tab=notifications" className="text-fg-2 hover:text-fg">Notifications <span className="num">{unread.n}</span></Link>
            <Link href="/os/command" className="rounded-md border border-line-strong bg-panel px-2.5 py-1 text-fg-2 hover:text-fg">New command</Link>
          </div>
        </header>
        <main className="mx-auto max-w-[1360px] px-5 py-5">{children}</main>
      </div>
    </div>
  );
}
