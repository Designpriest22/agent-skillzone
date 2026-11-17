import { notFound } from "next/navigation";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { services } from "@/db/schema";
import { LeadForm } from "@/components/site";
import { formatMoney } from "@/lib/money";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [s] = await db.select().from(services).where(eq(services.slug, slug));
  return s ? { title: s.seoTitle ?? s.name, description: s.seoDescription ?? s.summary, alternates: { canonical: `/services/${s.slug}` } } : {};
}

export default async function ServicePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ sent?: string; error?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const [s] = await db.select().from(services).where(and(eq(services.slug, slug), eq(services.published, true)));
  if (!s) notFound();
  return (
    <>
      <section className="mx-auto max-w-6xl px-6 pb-14 pt-20 md:px-12">
        <Link href="/#services" className="text-[13px] text-[#777] hover:text-black">← All services</Link>
        <h1 className="mt-6 max-w-4xl text-[44px] font-semibold leading-[1.05] tracking-[-0.03em] md:text-[64px]">{s.name}</h1>
        <p className="mt-6 max-w-2xl text-[19px] text-[#555]">{s.summary}</p>
        {s.priceFromMinor ? <p className="mt-4 text-[15px]">Projects from <b>{formatMoney(s.priceFromMinor)}</b>{s.pricingModel === "retainer" ? " per month" : ""}.</p> : null}
      </section>
      <section className="mx-auto max-w-6xl px-6 pb-16 md:px-12">
        <h2 className="mb-6 text-[13px] font-semibold uppercase tracking-[0.16em] text-[#999]">What you get</h2>
        <ul className="grid gap-px bg-[#e5e5e5] md:grid-cols-2">{s.deliverables.map((d) => <li key={d} className="bg-[#fafaf8] p-6 text-[17px] font-medium">{d}</li>)}</ul>
      </section>
      <LeadForm serviceSlug={s.slug} heading={`Talk to us about ${s.name.toLowerCase()}`} sent={sp.sent === "1"} error={sp.error} />
    </>
  );
}
