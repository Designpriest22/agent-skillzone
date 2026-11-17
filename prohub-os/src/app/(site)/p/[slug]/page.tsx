import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { sitePages } from "@/db/schema";
import { Sections } from "@/components/site";
import { getUser } from "@/lib/auth";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [p] = await db.select().from(sitePages).where(eq(sitePages.slug, slug));
  return p ? { title: p.title, description: p.seoDescription ?? undefined, robots: p.status === "published" ? undefined : { index: false } } : {};
}

export default async function LandingPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ preview?: string; sent?: string; error?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const [p] = await db.select().from(sitePages).where(eq(sitePages.slug, slug));
  if (!p) notFound();
  // Drafts are visible only to signed-in team members via ?preview=1.
  if (p.status !== "published" && !(sp.preview && (await getUser()))) notFound();
  return (
    <>
      {p.status !== "published" && <div className="bg-[#fbf0dc] px-6 py-2 text-center text-[13px] text-[#a15c00]">Draft preview — not public until approved ({p.status.replace(/_/g, " ")})</div>}
      <Sections sections={p.sections} page={p.slug} sent={sp.sent === "1"} error={sp.error} />
    </>
  );
}
