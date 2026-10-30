import { AdminButton } from "@/components/admin/AdminControls";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/primitives";
import { requireAdminPage } from "@/lib/auth/admin-guard";
import { db } from "@/lib/db";

export const metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  await requireAdminPage("reviewer");
  const reports = await db()`
    select r.*,
      case r.entity_type
        when 'vocabulary' then (select text || ' — ' || translation from vocabulary where id = r.entity_id)
        when 'activity' then (select type || ': ' || coalesce(payload->>'prompt', payload->>'title', '') from lesson_activities where id = r.entity_id)
        when 'tutor_reply' then (select text from conversation_turns where id = r.entity_id)
        when 'cultural_note' then (select title from cultural_notes where id = r.entity_id)
        else null end as subject
    from content_reports r where r.status = 'open' order by r.created_at limit 100`;
  return (
    <div>
      <PageHeader eyebrow="Quality" title="Reports from learners">
        Translation, spelling, tone-mark and dialect problems reported from lessons and tutor replies.
      </PageHeader>
      {reports.length ? (
        <ul className="flex flex-col gap-3">
          {reports.map((r) => (
            <Card key={r.id} className="flex flex-col gap-2">
              <p className="flex flex-wrap gap-2 text-sm">
                <Badge tone="warning">{r.reason.replace("_", " ")}</Badge>
                <Badge>{r.entity_type}</Badge>
                {r.language_code ? <Badge>{r.language_code}</Badge> : null}
                <span className="text-muted">{new Date(r.created_at).toLocaleString()}</span>
              </p>
              {r.subject ? <p className="lang-text font-semibold">{r.subject}</p> : null}
              {r.details ? <p className="text-sm">“{r.details}”</p> : null}
              <div className="flex gap-2">
                <AdminButton
                  action="resolve_report"
                  input={{ id: r.id, status: "resolved" }}
                  label="Mark resolved"
                  variant="primary"
                />
                <AdminButton
                  action="resolve_report"
                  input={{ id: r.id, status: "dismissed" }}
                  label="Dismiss"
                  variant="ghost"
                />
              </div>
            </Card>
          ))}
        </ul>
      ) : (
        <EmptyState title="No open reports" />
      )}
    </div>
  );
}
