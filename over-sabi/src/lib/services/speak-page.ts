import "server-only";
import { chatProvider } from "../ai";
import { DEFAULT_TUTOR_SETTINGS, tutorSettingsSchema } from "../ai/schemas";
import { getLanguage } from "../content/repo";
import { speechCapability } from "../speech";
import { getActivePlan } from "./learner";

export async function speakContext(userId: string) {
  const plan = await getActivePlan(userId);
  if (!plan) return null;
  const language = (await getLanguage(plan.language_code))!;
  const parsed = tutorSettingsSchema.safeParse(plan.tutor_settings ?? {});
  return {
    plan,
    language,
    settings: parsed.success ? parsed.data : DEFAULT_TUTOR_SETTINGS,
    tutorConfigured: !!chatProvider(),
    stt: speechCapability("stt", language),
    tts: speechCapability("tts", language),
  };
}
