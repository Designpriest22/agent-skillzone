import type { Metadata } from "next";
import {
  AccountSection,
  BillingActions,
  LearningSection,
  NotificationSection,
  PrivacySection,
} from "@/components/app/Settings";
import { ButtonLink } from "@/components/ui/Button";
import { Card, PageHeader } from "@/components/ui/primitives";
import { requirePageUser } from "@/lib/auth/guards";
import { withUser } from "@/lib/db";
import { getEntitlement, getUsageToday } from "@/lib/entitlements";

export const metadata: Metadata = { title: "Profile and settings" };

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-20">
      <h2 id={`${id}-h`} className="mb-4 text-xl font-bold">
        {title}
      </h2>
      <Card>{children}</Card>
    </section>
  );
}

export default async function SettingsPage() {
  const user = await requirePageUser();
  const { profile, plans } = await withUser(user.id, async (tx) => {
    const [profile] = await tx`select * from profiles where user_id = ${user.id}`;
    const plans = await tx`
      select lp.language_code, l.name as language_name, lp.is_active from learning_plans lp join languages l on l.code = lp.language_code
      where lp.user_id = ${user.id} order by lp.created_at`;
    return { profile: profile!, plans };
  });
  const [ent, usage] = await Promise.all([getEntitlement(user.id), getUsageToday(user.id)]);
  return (
    <div className="flex flex-col gap-10">
      <PageHeader eyebrow="Profile" title="Settings" />
      <nav aria-label="Settings sections" className="-mt-4 flex flex-wrap gap-3 text-sm">
        {[
          ["account", "Account"],
          ["learning", "Learning"],
          ["notifications", "Notifications"],
          ["privacy", "Privacy & data"],
          ["billing", "Plan & usage"],
        ].map(([id, l]) => (
          <a key={id} href={`#${id}`} className="underline">
            {l}
          </a>
        ))}
      </nav>
      <Section id="account" title="Account">
        <AccountSection displayName={user.displayName} email={user.email} verified={user.emailVerified} />
      </Section>
      <Section id="learning" title="Learning">
        <LearningSection
          plans={plans as never}
          explanationLanguage={profile.explanation_language}
          dailyGoal={profile.daily_goal_minutes}
          timezone={profile.timezone}
        />
        <p className="mt-4 text-sm">
          Tutor style, corrections and session length:{" "}
          <a href="/speak/tutors" className="underline">
            Tutor settings
          </a>
        </p>
      </Section>
      <Section id="notifications" title="Notifications">
        <NotificationSection prefs={profile.notification_prefs} />
      </Section>
      <Section id="privacy" title="Privacy & data">
        <PrivacySection
          analyticsOptOut={profile.analytics_opt_out}
          leaderboardOptIn={profile.leaderboard_opt_in}
          voiceConsent={!!profile.voice_processing_consent_at}
          isTeen={profile.age_band === "teen"}
          email={user.email}
        />
      </Section>
      <Section id="billing" title="Plan & usage">
        <div className="flex flex-col gap-3">
          <p>
            You&apos;re on <strong>{ent.planName}</strong>
            {ent.subscription
              ? ` · ${ent.subscription.status.replace("_", "-")}${ent.subscription.currentPeriodEnd ? ` until ${new Date(ent.subscription.currentPeriodEnd).toLocaleDateString("en-GB", { dateStyle: "medium" })}` : ""}`
              : ""}
            .
          </p>
          <ul className="text-sm text-muted">
            <li>
              Tutor replies today: {usage.ai_turns} / {ent.limits.daily_ai_turns}
            </li>
            <li>
              Voice transcription today: {usage.stt_seconds}s / {ent.limits.daily_stt_seconds}s
            </li>
            <li>Longest session: {ent.limits.max_session_minutes} minutes</li>
          </ul>
          {ent.planCode === "free" ? (
            <ButtonLink href="/pricing" className="self-start">
              See plans
            </ButtonLink>
          ) : null}
          <BillingActions
            canCancel={ent.subscription?.provider === "paystack" && ent.subscription.status === "active"}
          />
        </div>
      </Section>
    </div>
  );
}
