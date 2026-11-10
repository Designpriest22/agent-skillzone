import type { Metadata } from "next";
import Link from "next/link";
import { Badge, PageHeader } from "@/components/ui/primitives";
import { listLanguages } from "@/lib/content/repo";

export const metadata: Metadata = {
  title: "Languages",
  description: "African languages on Over Sabi: what's available now and what's on the roadmap.",
};
export const revalidate = 300;

const GROUPS = [
  ["nigeria", "Nigeria"],
  ["west", "West Africa"],
  ["east_central", "East and Central Africa"],
  ["southern", "Southern Africa"],
  ["north", "North Africa and beyond"],
  ["sign", "Sign languages"],
] as const;
const STATUS = {
  available: ["Available", "success"],
  beta: ["Beta course", "warning"],
  in_development: ["In development", "info"],
  roadmap: ["Roadmap", "neutral"],
} as const;

export default async function LanguagesPage() {
  const languages = (await listLanguages()).filter((l) => l.code !== "en");
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <PageHeader eyebrow="Catalogue" title="Languages">
        We open a course only when there&apos;s content we can stand behind. Roadmap languages are listed so
        you can see where we&apos;re heading — and help us get there.
      </PageHeader>
      {GROUPS.map(([g, label]) => {
        const items = languages.filter((l) => l.region_group === g);
        if (!items.length) return null;
        return (
          <section key={g} className="mt-10">
            <h2 className="mb-4 text-2xl font-extrabold">{label}</h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((l) => (
                <li key={l.code}>
                  <Link
                    href={`/languages/${l.code}`}
                    className="flex h-full flex-col gap-1 rounded-2xl border-2 border-border bg-surface p-4 hover:border-primary"
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span
                        lang={l.iso_639_1 ?? undefined}
                        className="lang-text font-display text-xl font-bold"
                      >
                        {l.native_name}
                      </span>
                      <Badge tone={STATUS[l.catalogue_status][1]}>{STATUS[l.catalogue_status][0]}</Badge>
                    </span>
                    <span className="text-sm text-muted">
                      {l.name} · {l.countries.slice(0, 3).join(", ")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
