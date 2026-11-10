import { AdminButton } from "@/components/admin/AdminControls";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/primitives";
import { requireAdminPage } from "@/lib/auth/admin-guard";
import { db } from "@/lib/db";

export const metadata = { title: "Support" };
export const dynamic = "force-dynamic";

export default async function SupportAdminPage() {
  await requireAdminPage("admin");
  const items =
    await db()`select * from support_requests order by (status = 'open') desc, created_at desc limit 100`;
  return (
    <div>
      <PageHeader eyebrow="Support" title="Support requests" />
      {items.length ? (
        <ul className="flex flex-col gap-3">
          {items.map((s) => (
            <Card key={s.id} className="flex flex-col gap-2">
              <p className="flex flex-wrap items-center gap-2">
                <strong>{s.subject}</strong>{" "}
                <Badge tone={s.status === "open" ? "warning" : "neutral"}>{s.status}</Badge>
                <a href={`mailto:${s.email}`} className="text-sm underline">
                  {s.email}
                </a>
                <span className="text-xs text-muted">{new Date(s.created_at).toLocaleString()}</span>
              </p>
              <p className="whitespace-pre-wrap text-sm">{s.message}</p>
              <div className="flex gap-2">
                <AdminButton
                  action="set_support_status"
                  input={{ id: s.id, status: "answered" }}
                  label="Mark answered"
                />
                <AdminButton
                  action="set_support_status"
                  input={{ id: s.id, status: "closed" }}
                  label="Close"
                  variant="ghost"
                />
              </div>
            </Card>
          ))}
        </ul>
      ) : (
        <EmptyState title="No support requests" />
      )}
    </div>
  );
}
