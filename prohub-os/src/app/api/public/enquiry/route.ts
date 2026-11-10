import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { sitePages } from "@/db/schema";
import { intakeEnquiry } from "@/services/enquiries";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(2).max(120), company: z.string().trim().max(160).optional().nullable(), email: z.string().trim().email().max(200).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")), message: z.string().trim().min(10).max(5000), service: z.string().max(80).optional().nullable(),
  page: z.string().max(80).optional().nullable(), website: z.string().max(0).optional(), // honeypot must stay empty
});

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  if (!rateLimit(`enquiry:${ip}`, 5, 10 * 60_000).ok) return Response.json({ error: "Too many submissions. Please try again later or WhatsApp us." }, { status: 429 });
  const isForm = (req.headers.get("content-type") ?? "").includes("form");
  const raw = isForm ? Object.fromEntries((await req.formData()).entries()) : await req.json().catch(() => ({}));
  const parsed = schema.safeParse(raw);
  const back = (q: string) => Response.redirect(new URL(`${String(raw.page ? `/p/${raw.page}` : "/contact")}?${q}`, req.url), 303);
  if (!parsed.success) return isForm ? back(`error=${encodeURIComponent("Please check your details and try again.")}`) : Response.json({ error: parsed.error.issues.map((i) => i.message).join("; ") }, { status: 400 });
  const d = parsed.data;
  if (!d.email && !d.phone) return isForm ? back(`error=${encodeURIComponent("Please give us an email or phone number.")}`) : Response.json({ error: "email or phone required" }, { status: 400 });
  let campaignId: string | null = null;
  if (d.page) campaignId = (await db.select({ c: sitePages.campaignId }).from(sitePages).where(eq(sitePages.slug, d.page)))[0]?.c ?? null;
  await intakeEnquiry({ name: d.name, company: d.company, email: d.email || null, phone: d.phone || null, message: d.message, serviceSlug: d.service, channel: "website", source: "website_form", pageSlug: d.page, campaignId });
  return isForm ? back("sent=1") : Response.json({ ok: true });
}
