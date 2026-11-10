import Link from "next/link";
import type { SiteSection } from "@/db/schema";

export function LeadForm({ serviceSlug, page, heading = "Tell us what you're working on", body, sent, error, services }: { serviceSlug?: string | null; page?: string | null; heading?: string; body?: string; sent?: boolean; error?: string; services?: { slug: string; name: string }[] }) {
  const input = "h-11 w-full border-b border-[#2a2a2a] bg-transparent px-0 text-[15px] text-white placeholder:text-[#7a7a7a] focus:border-[var(--accent)] focus:outline-none";
  return (
    <div id="enquire" className="bg-[#111] px-6 py-16 text-white md:px-12">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1fr_1.2fr]">
        <div>
          <h2 className="text-[34px] font-semibold leading-tight tracking-tight">{heading}</h2>
          <p className="mt-3 max-w-md text-[#a3a3a3]">{body ?? "Share a few details and a strategist will reply within one business day with next steps — usually a short call."}</p>
        </div>
        {sent ? <div className="self-center text-[18px]">Thank you — we've received your message and will be in touch shortly.</div> : (
          <form action="/api/public/enquiry" method="post" className="grid gap-5 md:grid-cols-2">
            {page && <input type="hidden" name="page" value={page} />}
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
            <input name="name" required minLength={2} placeholder="Your name" className={input} />
            <input name="company" placeholder="Company" className={input} />
            <input name="email" type="email" placeholder="Email" className={input} />
            <input name="phone" placeholder="Phone / WhatsApp" className={input} />
            {services && !serviceSlug ? <select name="service" className={input + " md:col-span-2"} defaultValue=""><option value="" className="text-black">What do you need?</option>{services.map((s) => <option key={s.slug} value={s.slug} className="text-black">{s.name}</option>)}</select> : <input type="hidden" name="service" value={serviceSlug ?? ""} />}
            <textarea name="message" required minLength={10} rows={3} placeholder="What are you trying to achieve?" className={input + " h-auto py-2 md:col-span-2"} />
            {error && <div className="text-[13px] text-[#f07373] md:col-span-2">{error}</div>}
            <div className="md:col-span-2"><button className="h-11 bg-[var(--accent)] px-6 text-[14px] font-semibold text-white hover:opacity-90">Send enquiry</button></div>
          </form>
        )}
      </div>
    </div>
  );
}

export function Sections({ sections, page, sent, error }: { sections: SiteSection[]; page: string; sent?: boolean; error?: string }) {
  return (
    <>
      {sections.map((s, i) => {
        switch (s.type) {
          case "hero": return (
            <section key={i} className="mx-auto max-w-6xl px-6 pb-16 pt-20 md:px-12">
              {s.eyebrow && <div className="mb-4 text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">{s.eyebrow}</div>}
              <h1 className="max-w-4xl text-[44px] font-semibold leading-[1.05] tracking-[-0.03em] md:text-[64px]">{s.heading}</h1>
              {s.subheading && <p className="mt-6 max-w-2xl text-[18px] text-[#555]">{s.subheading}</p>}
              {s.ctaLabel && <a href={s.ctaHref ?? "#enquire"} className="mt-8 inline-flex h-11 items-center bg-[#111] px-6 text-[14px] font-semibold text-white">{s.ctaLabel}</a>}
            </section>);
          case "features": return (
            <section key={i} className="mx-auto max-w-6xl px-6 py-14 md:px-12"><h2 className="mb-8 text-[28px] font-semibold tracking-tight">{s.heading}</h2>
              <div className="grid gap-px bg-[#e5e5e5] md:grid-cols-3">{s.items.map((it) => <div key={it.title} className="bg-[#fafaf8] p-6"><h3 className="font-semibold">{it.title}</h3><p className="mt-2 text-[15px] text-[#555]">{it.body}</p></div>)}</div></section>);
          case "steps": return (
            <section key={i} className="mx-auto max-w-6xl px-6 py-14 md:px-12"><h2 className="mb-8 text-[28px] font-semibold tracking-tight">{s.heading}</h2>
              <ol className="grid gap-8 md:grid-cols-4">{s.items.map((it, n) => <li key={it.title}><div className="text-[13px] font-semibold text-[var(--accent)]">0{n + 1}</div><h3 className="mt-1 font-semibold">{it.title}</h3><p className="mt-1 text-[15px] text-[#555]">{it.body}</p></li>)}</ol></section>);
          case "text": return (
            <section key={i} className="mx-auto max-w-3xl px-6 py-12 md:px-12">{s.heading && <h2 className="mb-4 text-[28px] font-semibold tracking-tight">{s.heading}</h2>}<div className="whitespace-pre-line text-[17px] leading-relaxed text-[#333]">{s.body}</div></section>);
          case "faq": return (
            <section key={i} className="mx-auto max-w-3xl px-6 py-12 md:px-12"><h2 className="mb-6 text-[28px] font-semibold tracking-tight">{s.heading}</h2>
              {s.items.map((q) => <details key={q.q} className="border-t border-[#e5e5e5] py-4"><summary className="cursor-pointer font-medium">{q.q}</summary><p className="mt-2 text-[#555]">{q.a}</p></details>)}</section>);
          case "cta": return (
            <section key={i} className="mx-auto max-w-6xl px-6 py-14 md:px-12"><div className="flex flex-wrap items-center justify-between gap-6 border-y border-[#111] py-10"><div><h2 className="text-[28px] font-semibold tracking-tight">{s.heading}</h2>{s.body && <p className="mt-2 text-[#555]">{s.body}</p>}</div><a href={s.ctaHref ?? "#enquire"} className="inline-flex h-11 items-center bg-[var(--accent)] px-6 text-[14px] font-semibold text-white">{s.ctaLabel}</a></div></section>);
          case "lead_form": return <LeadForm key={i} heading={s.heading} body={s.body} serviceSlug={s.serviceSlug} page={page} sent={sent} error={error} />;
        }
      })}
    </>
  );
}

export function SiteNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-[#e5e5e5] bg-[#fafaf8]/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 md:px-12">
        <Link href="/" className="flex items-baseline gap-1 text-[18px] font-semibold tracking-tight"><span>Prohub</span><span className="text-[var(--accent)]">.</span></Link>
        <nav className="flex items-center gap-6 text-[14px] text-[#333]">
          <Link href="/#services" className="hidden hover:text-black md:inline">Services</Link>
          <Link href="/work" className="hidden hover:text-black md:inline">Work</Link>
          <Link href="/#approach" className="hidden hover:text-black md:inline">Approach</Link>
          <Link href="/contact" className="bg-[#111] px-4 py-2 font-medium text-white">Start a project</Link>
        </nav>
      </div>
    </header>
  );
}
