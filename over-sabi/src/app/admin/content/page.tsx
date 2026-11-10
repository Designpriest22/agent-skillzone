import { AdminButton, AdminForm } from "@/components/admin/AdminControls";
import { Badge, Card, PageHeader, ReviewBadge } from "@/components/ui/primitives";
import { requireAdminPage } from "@/lib/auth/admin-guard";
import { db } from "@/lib/db";

export const metadata = { title: "Content" };
export const dynamic = "force-dynamic";

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ language?: string; q?: string }>;
}) {
  await requireAdminPage("editor");
  const sp = await searchParams;
  const lang = sp.language ?? "yo";
  const q = sp.q?.trim() || null;
  const [lessons, vocab] = await Promise.all([
    db()`select l.id, l.title, l.status, l.review_status, ch.title as chapter, (select count(*) from lesson_activities a where a.lesson_id = l.id)::int as activities
         from lessons l join chapters ch on ch.id = l.chapter_id join courses c on c.id = ch.course_id
         where c.language_code = ${lang} order by ch.sort_order, l.sort_order`,
    db()`select * from vocabulary where language_code = ${lang}
         and (${q}::text is null or text ilike ${"%" + (q ?? "") + "%"} or translation ilike ${"%" + (q ?? "") + "%"})
         order by topic, created_at limit 200`,
  ]);
  return (
    <div className="flex flex-col gap-10">
      <PageHeader eyebrow="Curriculum" title="Content">
        Editing a word sends it back to review and keeps the previous version in history.
      </PageHeader>
      <form className="flex flex-wrap gap-2">
        <select
          name="language"
          defaultValue={lang}
          className="rounded-lg border-2 border-border bg-surface px-2 py-1.5"
        >
          {["yo", "ig", "ha"].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <input
          name="q"
          defaultValue={sp.q}
          placeholder="Search vocabulary"
          className="lang-text rounded-lg border-2 border-border bg-surface px-2 py-1.5"
        />
        <button className="rounded-lg bg-primary px-3 text-on-primary">Filter</button>
      </form>
      <section>
        <h2 className="mb-3 text-xl font-bold">Lessons</h2>
        <ul className="flex flex-col gap-2">
          {lessons.map((l) => (
            <Card key={l.id} className="flex flex-wrap items-center justify-between gap-3">
              <span>
                <strong>{l.title}</strong>{" "}
                <span className="text-sm text-muted">
                  · {l.chapter} · {l.activities} activities
                </span>{" "}
                <Badge tone={l.status === "published" ? "success" : "neutral"}>{l.status}</Badge>{" "}
                <ReviewBadge status={l.review_status} />
              </span>
              <span className="flex gap-2">
                {l.status !== "published" ? (
                  <AdminButton
                    action="set_lesson_status"
                    input={{ id: l.id, status: "published" }}
                    label="Publish"
                  />
                ) : null}
                {l.status === "published" ? (
                  <AdminButton
                    action="set_lesson_status"
                    input={{ id: l.id, status: "draft" }}
                    label="Unpublish"
                    confirm="Unpublish this lesson? Learners will no longer see it."
                  />
                ) : null}
              </span>
            </Card>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="mb-3 text-xl font-bold">Vocabulary ({vocab.length})</h2>
        <ul className="flex flex-col gap-3">
          {vocab.map((v) => (
            <Card key={v.id}>
              <details>
                <summary className="flex cursor-pointer flex-wrap items-center gap-2">
                  <span className="lang-text font-semibold">{v.text}</span> — {v.translation}{" "}
                  <ReviewBadge status={v.review_status} /> <Badge>v{v.version}</Badge>
                </summary>
                <div className="mt-3">
                  <AdminForm
                    action="update_vocabulary"
                    fixed={{ id: v.id }}
                    submitLabel="Save new version"
                    fields={[
                      { name: "text", label: "Text (with tone marks)", defaultValue: v.text },
                      { name: "translation", label: "Translation", defaultValue: v.translation },
                      { name: "literal_meaning", label: "Literal meaning", defaultValue: v.literal_meaning },
                      {
                        name: "register",
                        label: "Register",
                        type: "select",
                        options: ["neutral", "formal", "informal", "respectful", "intimate"],
                        defaultValue: v.register,
                      },
                      {
                        name: "confidence",
                        label: "Confidence",
                        type: "select",
                        options: ["low", "medium", "high"],
                        defaultValue: v.confidence,
                      },
                      {
                        name: "context_note",
                        label: "Context note",
                        type: "textarea",
                        defaultValue: v.context_note,
                      },
                    ]}
                  />
                </div>
              </details>
            </Card>
          ))}
        </ul>
      </section>
    </div>
  );
}
