import type { Metadata } from "next";
import { NotebookList, type NotebookItem } from "@/components/app/NotebookList";
import { ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/primitives";
import { requirePageUser } from "@/lib/auth/guards";
import { withUser } from "@/lib/db";

export const metadata: Metadata = { title: "Vocabulary" };

export default async function VocabularyPage() {
  const user = await requirePageUser();
  const rows = await withUser(
    user.id,
    (tx) => tx`
    select uv.id, uv.vocab_id, uv.language_code, uv.source, uv.saved, uv.due_at, uv.repetitions,
      coalesce(v.text, uv.custom_term) as term, coalesce(v.translation, uv.custom_meaning) as meaning,
      coalesce(v.context_note, uv.custom_note) as context_note, v.literal_meaning, v.review_status
    from user_vocabulary uv left join vocabulary v on v.id = uv.vocab_id
    where uv.user_id = ${user.id} order by uv.created_at desc`,
  );
  const items = rows.map((r) => ({
    ...r,
    due_at: new Date(r.due_at).toISOString(),
  })) as unknown as NotebookItem[];
  const due = items.filter((i) => new Date(i.due_at) <= new Date()).length;
  return (
    <div>
      <PageHeader eyebrow="Notebook" title="Your words and phrases">
        Everything from your lessons, plus phrases you saved from conversations. Spaced repetition brings each
        one back just before you&apos;d forget it.
      </PageHeader>
      {due ? (
        <ButtonLink href="/review" className="mb-6">
          Review {due} now
        </ButtonLink>
      ) : null}
      <NotebookList items={items} />
    </div>
  );
}
