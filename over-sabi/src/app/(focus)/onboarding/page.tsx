import type { Metadata } from "next";
import {
  OnboardingFlow,
  type OnboardingLanguage,
  type OnboardingTutor,
} from "@/components/onboarding/OnboardingFlow";
import { requirePageUser } from "@/lib/auth/guards";
import { activeTutors } from "@/lib/content/catalog-queries";
import { learnableLanguages } from "@/lib/content/repo";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Set up your plan" };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ language?: string }>;
}) {
  const user = await requirePageUser({ allowUnonboarded: true, next: "/onboarding" });
  const sp = await searchParams;
  const [languages, tutors] = await Promise.all([learnableLanguages(), activeTutors()]);
  // OAuth sign-ups haven't confirmed an age band yet.
  const [oauth] = await db()`select 1 from oauth_accounts where user_id = ${user.id} limit 1`;
  return (
    <OnboardingFlow
      mode="user"
      languages={languages as unknown as OnboardingLanguage[]}
      tutors={tutors as unknown as OnboardingTutor[]}
      needsAgeBand={!!oauth && !user.onboarded}
      initialLanguage={languages.some((l) => l.code === sp.language) ? sp.language : undefined}
    />
  );
}
