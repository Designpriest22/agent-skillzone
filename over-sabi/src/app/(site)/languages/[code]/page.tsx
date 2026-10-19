import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/Button";
import { Badge, Card, Notice, PageHeader } from "@/components/ui/primitives";
import { getLanguage, getSampleLessonId } from "@/lib/content/repo";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const l = await getLanguage((await params).code);
  return { title: l ? `Learn ${l.name}` : "Language" };
}

const QUALITY: Record<string, [string, "success" | "warning" | "neutral" | "danger"]> = {
  validated: ["Tested with native speakers", "success"],
  experimental: ["Experimental", "warning"],
  untested: ["Not yet tested", "neutral"],
  unsupported: ["Not supported yet", "danger"],
  unavailable: ["Not available", "neutral"],
  verified: ["Reviewed", "success"],
  draft: ["Editorial draft, awaiting review", "warning"],
  in_review: ["In review", "warning"],
  none: ["No content yet", "neutral"],
};

export default async function LanguagePage({ params }: { params: Promise<{ code: string }> }) {
  const l = await getLanguage((await params).code);
  if (!l) notFound();
  const sample = await getSampleLessonId(l.code);
  const rows: [string, string][] = [
    ["Course content", l.content_status],
    ["AI tutor (text)", l.tutor_status],
    ["Speech recognition", l.stt_status],
    ["AI voice", l.tts_status],
  ];
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <PageHeader
        eyebrow={`${l.family}`}
        title={`${l.native_name}${l.native_name !== l.name ? ` · ${l.name}` : ""}`}
      >
        Spoken in {l.countries.join(", ")}. Written in {l.writing_systems.join(", ") || "—"}.
      </PageHeader>
      <div className="flex flex-wrap gap-3">
        {sample ? <ButtonLink href={`/try/${l.code}`}>Try a sample lesson</ButtonLink> : null}
        {l.catalogue_status === "beta" || l.catalogue_status === "available" ? (
          <ButtonLink href={`/onboarding?language=${l.code}`} variant="secondary">
            Start the course
          </ButtonLink>
        ) : (
          <ButtonLink href="/contribute" variant="secondary">
            Help build this course
          </ButtonLink>
        )}
      </div>
      <section className="mt-10">
        <h2 className="mb-3 text-xl font-bold">Quality status</h2>
        <Card className="divide-y divide-border p-0">
          {rows.map(([label, status]) => (
            <div key={label} className="flex items-center justify-between px-5 py-3">
              <span>{label}</span>
              <Badge tone={QUALITY[status]?.[1] ?? "neutral"}>{QUALITY[status]?.[0] ?? status}</Badge>
            </div>
          ))}
          <div className="flex items-center justify-between px-5 py-3">
            <span>Native-speaker reviewers</span>
            <Badge>
              {l.human_reviewer_status === "active"
                ? "Active"
                : l.human_reviewer_status === "recruiting"
                  ? "Recruiting"
                  : "None yet"}
            </Badge>
          </div>
        </Card>
      </section>
      {l.limitations ? (
        <Notice tone="warning" title="Current limitations" className="mt-6">
          {l.limitations}
        </Notice>
      ) : null}
      <section className="mt-8 grid gap-4 md:grid-cols-2">
        {l.orthography_notes ? (
          <Card>
            <h3 className="font-bold">Writing</h3>
            <p className="lang-text mt-1 text-sm text-muted">{l.orthography_notes}</p>
          </Card>
        ) : null}
        {l.dialect_notes ? (
          <Card>
            <h3 className="font-bold">Dialects</h3>
            <p className="lang-text mt-1 text-sm text-muted">{l.dialect_notes}</p>
          </Card>
        ) : null}
        {l.register_notes ? (
          <Card>
            <h3 className="font-bold">Respect and register</h3>
            <p className="lang-text mt-1 text-sm text-muted">{l.register_notes}</p>
          </Card>
        ) : null}
        {l.speech_notes ? (
          <Card>
            <h3 className="font-bold">Speech technology research</h3>
            <p className="mt-1 text-sm text-muted">{l.speech_notes}</p>
          </Card>
        ) : null}
      </section>
      <p className="mt-8 text-xs text-muted">
        Identifiers:{" "}
        {[l.iso_639_1 && `ISO 639-1 ${l.iso_639_1}`, l.iso_639_3 && `ISO 639-3 ${l.iso_639_3}`]
          .filter(Boolean)
          .join(" · ") || "to be confirmed"}
      </p>
    </div>
  );
}
