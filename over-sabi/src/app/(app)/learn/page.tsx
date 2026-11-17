import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { IconCheck } from "@/components/ui/icons";
import { Badge, EmptyState, Notice, PageHeader } from "@/components/ui/primitives";
import { requirePageUser } from "@/lib/auth/guards";
import { getCourseForLanguage, learnableLanguages } from "@/lib/content/repo";
import { withUser } from "@/lib/db";
import { getActivePlan } from "@/lib/services/learner";

export const metadata: Metadata = { title: "Learn" };

export default async function LearnPage({ searchParams }: { searchParams: Promise<{ language?: string }> }) {
  const user = await requirePageUser();
  const sp = await searchParams;
  const plan = await getActivePlan(user.id);
  const languages = await learnableLanguages();
  const code = languages.some((l) => l.code === sp.language)
    ? sp.language!
    : (plan?.language_code ?? languages[0]?.code);
  if (!code)
    return <EmptyState title="No courses yet">Courses appear here once they&apos;re published.</EmptyState>;
  const course = await getCourseForLanguage(code);
  if (!course) return <EmptyState title="This course isn't published yet" />;
  const done = new Map(
    (
      await withUser(
        user.id,
        (tx) => tx`select lesson_id, status, best_score from lesson_progress where user_id = ${user.id}`,
      )
    ).map((r) => [r.lesson_id as string, r]),
  );
  const published = course.chapters.filter((c) => c.status === "published");
  const planned = course.chapters.filter((c) => c.status !== "published");
  const nextLessonId = published
    .flatMap((c) => c.lessons)
    .find((l) => done.get(l.id)?.status !== "completed")?.id;

  return (
    <div>
      <PageHeader eyebrow={`${course.dialect_name ?? ""} · Starter`} title={course.title}>
        {course.description}
      </PageHeader>
      <nav aria-label="Languages" className="mb-6 flex flex-wrap gap-2">
        {languages.map((l) => (
          <Link
            key={l.code}
            href={`/learn?language=${l.code}`}
            aria-current={l.code === code ? "page" : undefined}
            className="rounded-full border-2 border-border px-4 py-1.5 text-sm font-semibold aria-[current=page]:border-primary aria-[current=page]:bg-primary aria-[current=page]:text-on-primary"
          >
            {l.name}
          </Link>
        ))}
      </nav>
      <Notice tone="warning" title="Beta content" className="mb-8">
        These lessons are an editorial draft waiting for native-speaker review. If something looks wrong, use
        “Report a problem” in the lesson — it goes straight to reviewers.
      </Notice>

      <ol className="flex flex-col gap-10">
        {published.map((ch, ci) => (
          <li key={ch.id}>
            <h2 className="mb-1 text-2xl font-extrabold">
              <span className="mr-2 font-mono text-sm text-muted">Chapter {ci + 1}</span>
              {ch.title}
            </h2>
            <p className="mb-4 text-muted">{ch.description}</p>
            <ol className="flex flex-col gap-3">
              {ch.lessons.map((l) => {
                const p = done.get(l.id);
                const completed = p?.status === "completed";
                const isNext = l.id === nextLessonId;
                return (
                  <li key={l.id}>
                    <Link
                      href={`/learn/${l.id}`}
                      className={`flex items-center gap-4 rounded-2xl border-2 bg-surface p-4 hover:border-primary ${isNext ? "border-primary" : "border-border"}`}
                    >
                      <span
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${completed ? "bg-primary text-on-primary" : "border-2 border-border"}`}
                        aria-hidden
                      >
                        {completed ? (
                          <span className="h-5 w-5">
                            <IconCheck />
                          </span>
                        ) : null}
                      </span>
                      <span className="flex-1">
                        <span className="block font-semibold">{l.title}</span>
                        <span className="text-sm text-muted">
                          {l.summary} · {l.minutes} min
                        </span>
                      </span>
                      {completed ? (
                        <Badge tone="success">Best {p!.best_score}%</Badge>
                      ) : isNext ? (
                        <Badge tone="accent">Up next</Badge>
                      ) : null}
                      <span className="sr-only">{completed ? "Completed" : "Not started"}</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </li>
        ))}
      </ol>

      {planned.length ? (
        <section className="mt-12">
          <h2 className="text-xl font-extrabold">Coming next</h2>
          <p className="mb-4 text-sm text-muted">
            The full learning path. Chapters open as their content is written and reviewed by native speakers.
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {planned.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-xl border border-dashed border-border px-4 py-3 text-sm"
              >
                {c.title}
                <Badge>Planned</Badge>
              </li>
            ))}
          </ul>
          <ButtonLink href="/contribute" variant="ghost" className="mt-4">
            Help write a chapter
          </ButtonLink>
        </section>
      ) : null}
    </div>
  );
}
