import type { Metadata } from "next";
import { TutorSettingsForm } from "@/components/speak/TutorSettingsForm";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, PageHeader } from "@/components/ui/primitives";
import { requirePageUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getEntitlement } from "@/lib/entitlements";
import { speakContext } from "@/lib/services/speak-page";

export const metadata: Metadata = { title: "Tutors" };

export default async function TutorsSettingsPage() {
  const user = await requirePageUser();
  const ctx = await speakContext(user.id);
  if (!ctx)
    return (
      <EmptyState
        title="Pick a language first"
        action={<ButtonLink href="/onboarding">Set up your plan</ButtonLink>}
      />
    );
  const tutors = await db()`
    select id, name, tagline, bio, teaching_approach, correction_style, specialties, avatar_key
    from tutors where language_code = ${ctx.language.code} and status = 'active' order by sort_order`;
  const ent = await getEntitlement(user.id);
  return (
    <div>
      <PageHeader eyebrow={ctx.language.name} title="Tutors and conversation settings">
        All tutors are AI characters with different teaching styles. Pick one and tune how they talk to you.
      </PageHeader>
      <TutorSettingsForm
        language={ctx.language.code}
        tutors={tutors as never}
        currentTutorId={ctx.plan.tutor_id}
        settings={{
          ...ctx.settings,
          sessionMinutes: Math.min(ctx.settings.sessionMinutes, ent.limits.max_session_minutes) as never,
        }}
        maxSessionMinutes={ent.limits.max_session_minutes}
      />
    </div>
  );
}
