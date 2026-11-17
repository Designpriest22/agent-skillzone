import { z } from "zod";
import { withUser } from "@/lib/db";
import { handler, json, parseJson, requireApiUser } from "@/lib/http";

const body = z.object({
  displayName: z.string().trim().min(1).max(60).optional(),
  timezone: z.string().max(60).optional(),
  explanationLanguage: z.enum(["en", "pcm", "fr"]).optional(),
  dailyGoalMinutes: z
    .union([z.literal(5), z.literal(10), z.literal(15), z.literal(20), z.literal(30)])
    .optional(),
  analyticsOptOut: z.boolean().optional(),
  leaderboardOptIn: z.boolean().optional(),
  marketingOptIn: z.boolean().optional(),
  voiceProcessingConsent: z.boolean().optional(),
  notificationPrefs: z
    .object({
      review_reminders: z.boolean(),
      streak_reminders: z.boolean(),
      weekly_summary: z.boolean(),
      email: z.boolean(),
    })
    .optional(),
});

export const PATCH = handler(async (req) => {
  const user = await requireApiUser();
  const b = await parseJson(req, body);
  if (b.timezone) new Intl.DateTimeFormat("en", { timeZone: b.timezone }); // throws on invalid zone
  await withUser(user.id, async (tx) => {
    if (b.displayName)
      await tx`update users set display_name = ${b.displayName}, updated_at = now() where id = ${user.id}`;
    const [p] = await tx`select age_band from profiles where user_id = ${user.id}`;
    await tx`
      update profiles set
        timezone = coalesce(${b.timezone ?? null}, timezone),
        explanation_language = coalesce(${b.explanationLanguage ?? null}, explanation_language),
        daily_goal_minutes = coalesce(${b.dailyGoalMinutes ?? null}, daily_goal_minutes),
        analytics_opt_out = coalesce(${b.analyticsOptOut ?? null}, analytics_opt_out),
        leaderboard_opt_in = case when ${p?.age_band === "teen"} then false else coalesce(${b.leaderboardOptIn ?? null}, leaderboard_opt_in) end,
        marketing_opt_in = coalesce(${b.marketingOptIn ?? null}, marketing_opt_in),
        voice_processing_consent_at = case when ${b.voiceProcessingConsent ?? null}::boolean is null then voice_processing_consent_at
          when ${b.voiceProcessingConsent ?? false} then coalesce(voice_processing_consent_at, now()) else null end,
        notification_prefs = coalesce(${b.notificationPrefs ? tx.json(b.notificationPrefs) : null}, notification_prefs),
        updated_at = now()
      where user_id = ${user.id}`;
  });
  return json({ ok: true });
});
