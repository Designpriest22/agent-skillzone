import Link from "next/link";
import { db } from "@/db/client";
import { services } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SiteNav } from "@/components/site";
import { whatsappClickToChat } from "@/integrations/whatsapp";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [svc, wa] = await Promise.all([db.select({ slug: services.slug, name: services.name }).from(services).where(eq(services.published, true)).orderBy(services.sortOrder), whatsappClickToChat("Hello Prohub, I'd like to discuss a project.")]);
  return (
    <div className="min-h-screen bg-[#fafaf8] text-[#111]" style={{ ["--accent" as string]: "#e2531c", fontSize: 15 }} data-theme="light">
      <SiteNav />
      <main>{children}</main>
      <footer className="border-t border-[#e5e5e5] px-6 py-12 md:px-12">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
          <div><div className="text-[18px] font-semibold">Prohub<span className="text-[var(--accent)]">.</span></div><p className="mt-2 max-w-sm text-[14px] text-[#666]">Prohub Creative Solutions — brand, design, video, digital marketing and web for businesses in Nigeria and beyond.</p></div>
          <div><div className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#999]">Services</div><ul className="space-y-1 text-[14px]">{svc.map((s) => <li key={s.slug}><Link href={`/services/${s.slug}`} className="text-[#444] hover:text-black">{s.name}</Link></li>)}</ul></div>
          <div><div className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#999]">Contact</div><ul className="space-y-1 text-[14px]"><li><Link href="/contact" className="text-[#444] hover:text-black">Send an enquiry</Link></li>{wa && <li><a href={wa} className="text-[#444] hover:text-black" target="_blank" rel="noreferrer">Chat on WhatsApp</a></li>}<li><Link href="/login" className="text-[#999] hover:text-black">Team login</Link></li></ul></div>
        </div>
        <div className="mx-auto mt-10 max-w-6xl text-[12px] text-[#999]">© {new Date().getFullYear()} Prohub Creative Solutions</div>
      </footer>
      {wa && <a href={wa} target="_blank" rel="noreferrer" className="fixed bottom-5 right-5 z-30 rounded-full bg-[#1f9d55] px-4 py-3 text-[13px] font-semibold text-white shadow-lg">WhatsApp us</a>}
    </div>
  );
}
