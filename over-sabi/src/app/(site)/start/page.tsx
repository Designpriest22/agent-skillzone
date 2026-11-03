import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  OnboardingFlow,
  type OnboardingLanguage,
  type OnboardingTutor,
} from "@/components/onboarding/OnboardingFlow";
import { getCurrentUser } from "@/lib/auth/session";
import { activeTutors } from "@/lib/content/catalog-queries";
import { learnableLanguages } from "@/lib/content/repo";

export const metadata: Metadata = { title: "Start learning" };

/** Guest onboarding: no account needed before a useful first lesson. */
export default async function StartPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.onboarded ? "/home" : "/onboarding");
  const [languages, tutors] = await Promise.all([learnableLanguages(), activeTutors()]);
  return (
    <div className="px-4 py-10">
      <OnboardingFlow
        mode="guest"
        languages={languages as unknown as OnboardingLanguage[]}
        tutors={tutors as unknown as OnboardingTutor[]}
      />
    </div>
  );
}
