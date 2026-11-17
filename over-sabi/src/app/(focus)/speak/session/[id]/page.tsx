import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { SpeakingRoom } from "@/components/speak/SpeakingRoom";
import { tutorSettingsSchema } from "@/lib/ai/schemas";
import { requirePageUser } from "@/lib/auth/guards";
import { getLanguage } from "@/lib/content/repo";
import { db, withUser } from "@/lib/db";
import { getTranscript } from "@/lib/services/tutor";
import { speechCapability } from "@/lib/speech";

export const metadata: Metadata = { title: "Speaking room" };

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePageUser({ next: `/speak/session/${id}` });
  if (!z.string().uuid().safeParse(id).success) notFound();
  const [session] = await withUser(user.id, (tx) => tx`select * from learning_sessions where id = ${id}`);
  if (!session) notFound();
  const [tutor] = await db()`select id, name, avatar_key from tutors where id = ${session.tutor_id}`;
  const language = (await getLanguage(session.language_code))!;
  const settings = tutorSettingsSchema.parse(session.settings);
  const [profile] = await withUser(
    user.id,
    (tx) => tx`select voice_processing_consent_at from profiles where user_id = ${user.id}`,
  );
  const endsAt = new Date(
    new Date(session.started_at).getTime() + settings.sessionMinutes * 60_000,
  ).toISOString();
  return (
    <SpeakingRoom
      sessionId={id}
      language={{ code: language.code, name: language.name }}
      tutor={{ id: tutor?.id ?? "", name: tutor?.name ?? "Tutor", avatarKey: tutor?.avatar_key ?? "" }}
      initialTurns={await getTranscript(user.id, id)}
      endsAt={endsAt}
      ended={session.status !== "active"}
      initialSummary={session.summary}
      speed={settings.speed}
      translationAssist={settings.translationAssist}
      stt={speechCapability("stt", language)}
      tts={speechCapability("tts", language)}
      voiceConsent={!!profile?.voice_processing_consent_at}
    />
  );
}
