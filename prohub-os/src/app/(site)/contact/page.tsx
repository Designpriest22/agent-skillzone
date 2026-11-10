import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { services } from "@/db/schema";
import { LeadForm } from "@/components/site";

export const metadata = { title: "Start a project", description: "Tell Prohub Creative Solutions about your project. We reply within one business day." };

export default async function Contact({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const sp = await searchParams;
  const svc = await db.select({ slug: services.slug, name: services.name }).from(services).where(eq(services.published, true)).orderBy(services.sortOrder);
  return <div className="pt-10"><LeadForm services={svc} heading="Start a project" sent={sp.sent === "1"} error={sp.error} /></div>;
}
