import { AdminForm } from "@/components/admin/AdminControls";
import { TutorAvatar } from "@/components/brand/TutorAvatar";
import { Card, PageHeader } from "@/components/ui/primitives";
import { requireAdminPage } from "@/lib/auth/admin-guard";
import { db } from "@/lib/db";

export const metadata = { title: "Tutors" };
export const dynamic = "force-dynamic";

export default async function AdminTutorsPage() {
  await requireAdminPage("editor");
  const tutors = await db()`select * from tutors order by sort_order`;
  return (
    <div>
      <PageHeader eyebrow="AI tutors" title="Tutor configurations">
        Voice IDs must be licensed provider voices — never a clone of a real person without their written
        consent.
      </PageHeader>
      <ul className="flex flex-col gap-4">
        {tutors.map((t) => (
          <Card key={t.id} className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <TutorAvatar avatarKey={t.avatar_key} name={t.name} size={48} />
              <p className="font-display text-lg font-bold">
                {t.name}{" "}
                <span className="font-mono text-xs text-muted">
                  {t.language_code} · {t.persona}
                </span>
              </p>
            </div>
            <AdminForm
              action="update_tutor"
              fixed={{ id: t.id }}
              fields={[
                { name: "tagline", label: "Tagline", defaultValue: t.tagline },
                {
                  name: "status",
                  label: "Status",
                  type: "select",
                  options: ["active", "hidden"],
                  defaultValue: t.status,
                },
                {
                  name: "default_speed",
                  label: "Default speed",
                  type: "number",
                  defaultValue: Number(t.default_speed),
                },
                {
                  name: "voice_id",
                  label: "Provider voice ID (optional)",
                  defaultValue: t.voice?.default ?? "",
                },
                { name: "bio", label: "Bio", type: "textarea", defaultValue: t.bio },
                {
                  name: "teaching_approach",
                  label: "Teaching approach (used in the AI prompt)",
                  type: "textarea",
                  defaultValue: t.teaching_approach,
                },
                {
                  name: "correction_style",
                  label: "Correction style (used in the AI prompt)",
                  type: "textarea",
                  defaultValue: t.correction_style,
                },
              ]}
            />
          </Card>
        ))}
      </ul>
    </div>
  );
}
