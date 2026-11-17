import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { services, portfolioItems, testimonials } from "@/db/schema";
import { LeadForm } from "@/components/site";

export const metadata = {
  title: "Prohub Creative Solutions — Brand, Design, Video & Digital Marketing in Nigeria",
  description: "A creative agency in Nigeria building brands, campaigns, content, video and websites that turn attention into enquiries and sales.",
};

export default async function Home() {
  const [svc, work, quotes] = await Promise.all([
    db.select().from(services).where(eq(services.published, true)).orderBy(services.sortOrder),
    db.select().from(portfolioItems).where(eq(portfolioItems.published, true)).limit(6),
    db.select().from(testimonials).where(eq(testimonials.verified, true)).limit(3),
  ]);
  return (
    <>
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-20 md:px-12 md:pt-28">
        <div className="mb-6 text-[12px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Creative agency · Lagos, Nigeria</div>
        <h1 className="max-w-5xl text-[46px] font-semibold leading-[1.02] tracking-[-0.035em] md:text-[78px]">Creative work built to grow the business behind it.</h1>
        <p className="mt-8 max-w-2xl text-[19px] leading-relaxed text-[#555]">Brand strategy, design, video, social and web — planned around one question: what will this do for your revenue? We serve ambitious Nigerian businesses and international brands entering the market.</p>
        <div className="mt-10 flex flex-wrap gap-3"><Link href="/contact" className="inline-flex h-12 items-center bg-[#111] px-7 text-[15px] font-semibold text-white">Start a project</Link><a href="#services" className="inline-flex h-12 items-center border border-[#111] px-7 text-[15px] font-semibold">See services</a></div>
      </section>

      <section id="services" className="border-t border-[#e5e5e5]">
        <div className="mx-auto max-w-6xl px-6 py-16 md:px-12">
          <div className="mb-10 flex items-end justify-between"><h2 className="text-[32px] font-semibold tracking-tight">Services</h2><span className="text-[14px] text-[#777]">{svc.length} disciplines, one team</span></div>
          <div className="grid gap-px bg-[#e5e5e5] md:grid-cols-2">
            {svc.map((s, n) => (
              <Link key={s.slug} href={`/services/${s.slug}`} className="group bg-[#fafaf8] p-7 transition-colors hover:bg-white">
                <div className="flex items-baseline justify-between"><span className="text-[12px] font-semibold text-[#999]">{String(n + 1).padStart(2, "0")}</span><span className="text-[var(--accent)] opacity-0 transition-opacity group-hover:opacity-100">→</span></div>
                <h3 className="mt-3 text-[21px] font-semibold tracking-tight">{s.name}</h3>
                <p className="mt-2 text-[15px] text-[#555]">{s.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="approach" className="bg-[#111] text-white">
        <div className="mx-auto max-w-6xl px-6 py-16 md:px-12">
          <h2 className="text-[32px] font-semibold tracking-tight">How we work</h2>
          <ol className="mt-10 grid gap-10 md:grid-cols-4">
            {[["Diagnose", "We audit your brand, channels and competitors and agree the commercial goal before any creative starts."], ["Plan", "A focused plan: audience, message, channels, deliverables, timeline and how success will be measured."], ["Make", "Strategy, design, video, copy and web produced by one team to a single brand system."], ["Measure", "We report on enquiries, conversions and revenue impact — not just likes — and iterate."]].map(([t, b], n) => (
              <li key={t}><div className="text-[13px] font-semibold text-[var(--accent)]">0{n + 1}</div><h3 className="mt-2 text-[19px] font-semibold">{t}</h3><p className="mt-2 text-[15px] text-[#a3a3a3]">{b}</p></li>
            ))}
          </ol>
        </div>
      </section>

      {work.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-16 md:px-12">
          <h2 className="mb-8 text-[32px] font-semibold tracking-tight">Selected work</h2>
          <div className="grid gap-8 md:grid-cols-3">{work.map((w) => <div key={w.id}>{w.imageUrl && <img src={w.imageUrl} alt={w.title} className="mb-3 aspect-[4/3] w-full object-cover" />}<div className="text-[12px] text-[#999]">{w.clientName}</div><h3 className="font-semibold">{w.title}</h3><p className="mt-1 text-[14px] text-[#555]">{w.summary}</p></div>)}</div>
        </section>
      )}

      {quotes.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-16 md:px-12"><div className="grid gap-10 md:grid-cols-3">{quotes.map((q) => <figure key={q.id}><blockquote className="text-[18px] leading-relaxed">“{q.quote}”</blockquote><figcaption className="mt-3 text-[14px] text-[#777]">{q.author}{q.company ? `, ${q.company}` : ""}</figcaption></figure>)}</div></section>
      )}

      <LeadForm services={svc.map((s) => ({ slug: s.slug, name: s.name }))} />
    </>
  );
}
