import type { Metadata } from "next";
import { DialoguePractice, type PracticeDialogue } from "@/components/speak/DialoguePractice";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, Notice, PageHeader } from "@/components/ui/primitives";
import { requirePageUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getActivePlan } from "@/lib/services/learner";

export const metadata: Metadata = { title: "Guided dialogues" };

export default async function DialoguesPage() {
  const user = await requirePageUser();
  const plan = await getActivePlan(user.id);
  if (!plan)
    return (
      <EmptyState
        title="Pick a language first"
        action={<ButtonLink href="/onboarding">Set up your plan</ButtonLink>}
      />
    );
  const rows = await db()`
    select a.id, a.payload, a.answer from lesson_activities a
    join lessons l on l.id = a.lesson_id join chapters ch on ch.id = l.chapter_id join courses c on c.id = ch.course_id
    where c.language_code = ${plan.language_code} and a.type = 'dialogue' and l.status = 'published' and ch.status = 'published'
    order by ch.sort_order, l.sort_order, a.sort_order`;
  const dialogues: PracticeDialogue[] = rows.map((r) => ({
    id: r.id,
    setting: r.payload.setting,
    lines: r.payload.lines,
    prompt: r.payload.prompt,
    modelReply: r.payload.options[r.answer.index],
    explanation: r.answer.explanation,
  }));
  return (
    <div>
      <PageHeader eyebrow={`${plan.language_name} · no AI needed`} title="Guided dialogues">
        Read each exchange, say the reply out loud and record yourself, then compare with the model reply.
      </PageHeader>
      <Notice tone="info" className="mb-6">
        Recordings stay in your browser — they aren&apos;t uploaded or stored. No native-speaker audio has
        been recorded for these dialogues yet.
      </Notice>
      {dialogues.length ? (
        <DialoguePractice dialogues={dialogues} language={plan.language_code} />
      ) : (
        <EmptyState title="No dialogues yet" />
      )}
    </div>
  );
}
