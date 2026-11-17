import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";
import { requirePageUser } from "@/lib/auth/guards";
import { getLessonForPlayer } from "@/lib/content/repo";
import { track } from "@/lib/analytics";

export const metadata: Metadata = { title: "Lesson" };

export default async function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const user = await requirePageUser({ next: `/learn/${lessonId}` });
  if (!z.string().uuid().safeParse(lessonId).success) notFound();
  const lesson = await getLessonForPlayer(lessonId, { kind: "user", userId: user.id });
  if (!lesson) notFound();
  await track("lesson_started", { userId: user.id, language: lesson.language.code });
  return <LessonPlayer lesson={lesson} mode="user" />;
}
