import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";
import { getLessonForPlayer, getSampleLessonId } from "@/lib/content/repo";

export const metadata: Metadata = { title: "Sample lesson" };

export default async function TryLessonPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const id = await getSampleLessonId(code);
  if (!id) notFound();
  const lesson = await getLessonForPlayer(id, { kind: "guest" });
  if (!lesson) notFound();
  return <LessonPlayer lesson={lesson} mode="guest" />;
}
