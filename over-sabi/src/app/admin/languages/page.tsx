import { AdminForm } from "@/components/admin/AdminControls";
import { Card, PageHeader } from "@/components/ui/primitives";
import { requireAdminPage } from "@/lib/auth/admin-guard";
import { listLanguages } from "@/lib/content/repo";

export const metadata = { title: "Languages" };
export const dynamic = "force-dynamic";

export default async function AdminLanguagesPage() {
  await requireAdminPage("editor");
  const langs = await listLanguages();
  return (
    <div>
      <PageHeader eyebrow="Registry" title="Languages">
        Statuses drive what learners are told. Mark speech as validated only after testing with native
        speakers (see LANGUAGE_QUALITY.md). A language can be “available” only when its content is verified.
      </PageHeader>
      <ul className="flex flex-col gap-3">
        {langs.map((l) => (
          <Card key={l.code}>
            <details>
              <summary className="cursor-pointer font-semibold">
                {l.name}{" "}
                <span className="font-mono text-xs text-muted">
                  {l.code} · {l.catalogue_status} · tutor {l.tutor_status} · stt {l.stt_status} · tts{" "}
                  {l.tts_status}
                </span>
              </summary>
              <div className="mt-3">
                <AdminForm
                  action="update_language"
                  fixed={{ code: l.code }}
                  fields={[
                    {
                      name: "catalogue_status",
                      label: "Catalogue",
                      type: "select",
                      options: ["roadmap", "in_development", "beta", "available"],
                      defaultValue: l.catalogue_status,
                    },
                    {
                      name: "content_status",
                      label: "Content",
                      type: "select",
                      options: ["none", "draft", "in_review", "verified"],
                      defaultValue: l.content_status,
                    },
                    {
                      name: "tutor_status",
                      label: "AI tutor",
                      type: "select",
                      options: ["unavailable", "experimental", "validated"],
                      defaultValue: l.tutor_status,
                    },
                    {
                      name: "stt_status",
                      label: "Speech recognition",
                      type: "select",
                      options: ["unsupported", "untested", "experimental", "validated"],
                      defaultValue: l.stt_status,
                    },
                    {
                      name: "tts_status",
                      label: "AI voice",
                      type: "select",
                      options: ["unsupported", "untested", "experimental", "validated"],
                      defaultValue: l.tts_status,
                    },
                    {
                      name: "human_reviewer_status",
                      label: "Reviewers",
                      type: "select",
                      options: ["none", "recruiting", "active"],
                      defaultValue: l.human_reviewer_status,
                    },
                    {
                      name: "limitations",
                      label: "Limitations shown to learners",
                      type: "textarea",
                      defaultValue: l.limitations,
                    },
                    {
                      name: "speech_notes",
                      label: "Speech test notes",
                      type: "textarea",
                      defaultValue: l.speech_notes,
                    },
                  ]}
                />
              </div>
            </details>
          </Card>
        ))}
      </ul>
    </div>
  );
}
