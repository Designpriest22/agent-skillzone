import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { portfolioItems } from "@/db/schema";
import Link from "next/link";

export const metadata = { title: "Work", description: "Selected work by Prohub Creative Solutions." };

export default async function Work() {
  const items = await db.select().from(portfolioItems).where(eq(portfolioItems.published, true));
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 md:px-12">
      <h1 className="text-[44px] font-semibold tracking-[-0.03em]">Work</h1>
      {items.length ? (
        <div className="mt-10 grid gap-10 md:grid-cols-2">{items.map((w) => <article key={w.id}>{w.imageUrl && <img src={w.imageUrl} alt={w.title} className="mb-4 aspect-[16/10] w-full object-cover" />}<div className="text-[13px] text-[#999]">{w.clientName} · {w.serviceSlug}</div><h2 className="mt-1 text-[22px] font-semibold">{w.title}</h2><p className="mt-2 text-[#555]">{w.summary}</p>{w.results && <p className="mt-2 font-medium">{w.results}</p>}</article>)}</div>
      ) : <p className="mt-6 max-w-xl text-[17px] text-[#555]">Our case studies are being prepared. In the meantime, <Link className="underline" href="/contact">tell us about your project</Link> and we'll share relevant examples directly.</p>}
    </section>
  );
}
