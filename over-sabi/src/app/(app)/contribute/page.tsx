import type { Metadata } from "next";
import { ContributionForm } from "@/components/app/ContributionForm";
import { Badge, Card, PageHeader } from "@/components/ui/primitives";
import { requirePageUser } from "@/lib/auth/guards";
import { db, withUser } from "@/lib/db";

export const metadata: Metadata = { title: "Contribute" };

export default async function ContributePage() {
  const user = await requirePageUser({ next: "/contribute" });
  const languages =
    await db()`select code, name from languages where modality = 'spoken' and code <> 'en' order by sort_order`;
  const mine = await withUser(
    user.id,
    (tx) => tx`
    select id, language_code, kind, payload, status, created_at from content_contributions where contributor_id = ${user.id} order by created_at desc limit 20`,
  );
  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Community" title="Help build the course">
        Native speakers make Over Sabi accurate. Share words, corrections, regional variants, cultural notes
        or recordings. Nothing is published until a reviewer approves it.
      </PageHeader>
      <Card>
        <ContributionForm languages={languages as never} />
      </Card>
      {mine.length ? (
        <section>
          <h2 className="mb-3 text-xl font-bold">Your contributions</h2>
          <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
            {mine.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span>
                  <span className="lang-text font-semibold">
                    {c.payload.text || c.kind.replace("_", " ")}
                  </span>{" "}
                  · {c.language_code}
                </span>
                <Badge
                  tone={c.status === "accepted" ? "success" : c.status === "rejected" ? "danger" : "warning"}
                >
                  {c.status}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
