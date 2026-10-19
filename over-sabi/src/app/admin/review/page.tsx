import { AdminButton } from "@/components/admin/AdminControls";
import { Badge, Card, EmptyState, PageHeader, ReviewBadge } from "@/components/ui/primitives";
import { requireAdminPage } from "@/lib/auth/admin-guard";
import { db } from "@/lib/db";

export const metadata = { title: "Review queue" };
export const dynamic = "force-dynamic";

function Decisions({ entityType, id }: { entityType: string; id: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <AdminButton
        action="review_content"
        input={{ entityType, entityId: id, decision: "approve" }}
        label="Approve"
        variant="primary"
        prompt={{ field: "notes", question: "Optional note for the record:" }}
      />
      <AdminButton
        action="review_content"
        input={{ entityType, entityId: id, decision: "request_changes" }}
        label="Request changes"
        prompt={{ field: "notes", question: "What needs to change?", required: true }}
      />
      <AdminButton
        action="review_content"
        input={{ entityType, entityId: id, decision: "dispute" }}
        label="Dispute"
        prompt={{ field: "notes", question: "What's disputed (e.g. dialect difference)?", required: true }}
      />
      <AdminButton
        action="review_content"
        input={{ entityType, entityId: id, decision: "reject" }}
        label="Reject"
        variant="ghost"
        prompt={{ field: "notes", question: "Why reject?", required: true }}
      />
    </div>
  );
}

export default async function ReviewQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ language?: string }>;
}) {
  await requireAdminPage("reviewer");
  const sp = await searchParams;
  const lang = sp.language ?? null;
  const [contributions, vocab, notes, audio, lessons] = await Promise.all([
    db()`select c.*, u.display_name from content_contributions c left join users u on u.id = c.contributor_id
         where c.status = 'pending' and (${lang}::text is null or c.language_code = ${lang}) order by c.created_at limit 50`,
    db()`select v.*, (select json_agg(json_build_object('decision', r.decision, 'notes', r.notes, 'at', r.created_at) order by r.created_at desc)
                    from content_reviews r where r.entity_type = 'vocabulary' and r.entity_id = v.id) as history
         from vocabulary v where v.review_status in ('editorial_draft', 'in_review', 'disputed', 'ai_draft')
           and (${lang}::text is null or v.language_code = ${lang}) order by v.language_code, v.topic, v.created_at limit 100`,
    db()`select * from cultural_notes where review_status in ('editorial_draft', 'in_review', 'disputed') and (${lang}::text is null or language_code = ${lang}) limit 50`,
    db()`select * from audio_assets where review_status = 'in_review' and (${lang}::text is null or language_code = ${lang}) limit 50`,
    db()`select l.id, l.title, l.review_status, c.language_code from lessons l join chapters ch on ch.id = l.chapter_id join courses c on c.id = ch.course_id
         where l.review_status <> 'verified' and (${lang}::text is null or c.language_code = ${lang}) order by c.language_code, ch.sort_order, l.sort_order`,
  ]);
  return (
    <div className="flex flex-col gap-10">
      <PageHeader eyebrow="Native-speaker review" title="Review queue">
        Approve only what you&apos;d teach your own family. Use “Dispute” for regional differences so
        they&apos;re recorded rather than lost.
      </PageHeader>
      <nav className="flex flex-wrap gap-2 text-sm">
        {[null, "yo", "ig", "ha", "pcm"].map((c) => (
          <a
            key={c ?? "all"}
            href={c ? `?language=${c}` : "?"}
            className={`rounded-full border px-3 py-1 ${lang === c ? "border-primary font-bold" : "border-border"}`}
          >
            {c ?? "All"}
          </a>
        ))}
      </nav>

      <section>
        <h2 className="mb-3 text-xl font-bold">Community contributions ({contributions.length})</h2>
        {contributions.length ? (
          <ul className="flex flex-col gap-3">
            {contributions.map((c) => (
              <Card key={c.id} className="flex flex-col gap-2">
                <p className="text-xs text-muted">
                  {c.language_code} · {c.kind} · from {c.display_name || "a former contributor"} ·{" "}
                  {new Date(c.created_at).toLocaleDateString()}
                </p>
                <p className="lang-text text-lg font-semibold">{c.payload.text || "(no text)"}</p>
                {c.payload.translation ? <p>{c.payload.translation}</p> : null}
                {c.payload.dialect ? <p className="text-sm">Dialect: {c.payload.dialect}</p> : null}
                {c.payload.notes ? <p className="text-sm text-muted">{c.payload.notes}</p> : null}
                {c.audio_asset_id ? (
                  <p className="text-sm">Includes a recording — review it under Audio below.</p>
                ) : null}
                <div className="flex gap-2">
                  <AdminButton
                    action="review_contribution"
                    input={{ id: c.id, decision: "accepted" }}
                    label="Accept"
                    variant="primary"
                    prompt={{ field: "notes", question: "Optional note:" }}
                  />
                  <AdminButton
                    action="review_contribution"
                    input={{ id: c.id, decision: "rejected" }}
                    label="Reject"
                    variant="ghost"
                    prompt={{
                      field: "notes",
                      question: "Reason (shared with the contributor):",
                      required: true,
                    }}
                  />
                </div>
              </Card>
            ))}
          </ul>
        ) : (
          <EmptyState title="No pending contributions" />
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">Vocabulary awaiting review ({vocab.length})</h2>
        <ul className="flex flex-col gap-3">
          {vocab.map((v) => (
            <Card key={v.id} className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="lang-text text-lg font-semibold">{v.text}</span>
                <span>— {v.translation}</span>
                <ReviewBadge status={v.review_status} />
                <Badge>{v.language_code}</Badge>
                <Badge>{v.register}</Badge>
                <Badge>confidence: {v.confidence}</Badge>
              </div>
              {v.literal_meaning ? <p className="text-sm">Literally: {v.literal_meaning}</p> : null}
              {v.context_note ? <p className="text-sm text-muted">{v.context_note}</p> : null}
              <p className="text-xs text-muted">
                Source: {v.source} · v{v.version}
              </p>
              {v.history?.length ? (
                <ul className="text-xs text-muted">
                  {v.history.map((h: { decision: string; notes: string; at: string }, i: number) => (
                    <li key={i}>
                      {new Date(h.at).toLocaleDateString()}: {h.decision} {h.notes ? `— ${h.notes}` : ""}
                    </li>
                  ))}
                </ul>
              ) : null}
              <Decisions entityType="vocabulary" id={v.id} />
            </Card>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">Cultural notes ({notes.length})</h2>
        <ul className="flex flex-col gap-3">
          {notes.map((n) => (
            <Card key={n.id} className="flex flex-col gap-2">
              <p className="font-semibold">
                {n.title} <Badge>{n.language_code}</Badge> <ReviewBadge status={n.review_status} />
              </p>
              <p className="text-sm">{n.body}</p>
              <Decisions entityType="cultural_note" id={n.id} />
            </Card>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">Audio recordings ({audio.length})</h2>
        {audio.length ? (
          <ul className="flex flex-col gap-3">
            {audio.map((a) => (
              <Card key={a.id} className="flex flex-col gap-2">
                <p className="text-sm">
                  {a.language_code} · {a.speaker_label} · consent: {a.speaker_consent ? "yes" : "no"} ·{" "}
                  {a.license}
                </p>
                <audio controls preload="none" src={`/api/audio/${a.storage_path}`} className="w-full" />
                <Decisions entityType="audio_asset" id={a.id} />
              </Card>
            ))}
          </ul>
        ) : (
          <EmptyState title="No recordings to review" />
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">Lessons not yet verified ({lessons.length})</h2>
        <p className="mb-3 text-sm text-muted">
          Verify a lesson once all of its vocabulary, activities and culture notes are approved.
        </p>
        <ul className="flex flex-col gap-2">
          {lessons.map((l) => (
            <Card key={l.id} className="flex flex-wrap items-center justify-between gap-3">
              <span>
                {l.title} <Badge>{l.language_code}</Badge> <ReviewBadge status={l.review_status} />
              </span>
              <Decisions entityType="lesson" id={l.id} />
            </Card>
          ))}
        </ul>
      </section>
    </div>
  );
}
