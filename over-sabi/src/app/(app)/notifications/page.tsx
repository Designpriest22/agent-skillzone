import type { Metadata } from "next";
import Link from "next/link";
import { MarkAllRead } from "@/components/app/MarkAllRead";
import { EmptyState, PageHeader } from "@/components/ui/primitives";
import { requirePageUser } from "@/lib/auth/guards";
import { withUser } from "@/lib/db";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requirePageUser();
  const items = await withUser(
    user.id,
    (tx) => tx`
    select id, kind, title, body, link, read_at, created_at from notifications where user_id = ${user.id} order by created_at desc limit 50`,
  );
  return (
    <div>
      <PageHeader eyebrow="Inbox" title="Notifications" />
      {items.some((i) => !i.read_at) ? <MarkAllRead /> : null}
      {items.length ? (
        <ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-surface">
          {items.map((n) => (
            <li key={n.id} className="flex gap-3 px-4 py-3">
              <span
                className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${n.read_at ? "bg-transparent" : "bg-ember"}`}
                aria-label={n.read_at ? undefined : "Unread"}
              />
              <div>
                <p className="font-semibold">
                  {n.link ? (
                    <Link href={n.link} className="hover:underline">
                      {n.title}
                    </Link>
                  ) : (
                    n.title
                  )}
                </p>
                <p className="text-sm text-muted">{n.body}</p>
                <p className="text-xs text-muted">
                  {new Date(n.created_at).toLocaleString("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="You're all caught up">
          Revision reminders, streak nudges and weekly summaries appear here.
        </EmptyState>
      )}
    </div>
  );
}
