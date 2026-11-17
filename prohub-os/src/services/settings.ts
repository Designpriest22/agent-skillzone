import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { businesses } from "@/db/schema";

export type BusinessSettings = {
  /** Real prospects the Sales agent should try to find each morning. */
  dailyProspectQuota: number;
  /** Industries to rotate through in morning prospecting. */
  prospectSegments: string[];
  /** Run the morning/midday/evening agent cycles automatically. */
  autonomousCycles: boolean;
  /** Email address that receives scheduled reports (requires SMTP). */
  reportEmail: string | null;
  /** Prohub's own social cadence: posts per week per platform. */
  socialCadence: Record<string, number>;
  /** Send scheduled reports (digest + PDF) to authorised WhatsApp numbers. */
  reportWhatsApp: boolean;
};

export const DEFAULT_SETTINGS: BusinessSettings = {
  dailyProspectQuota: 10,
  prospectSegments: ["hospitality & hotels", "restaurants", "real estate", "fintech & financial institutions", "event companies", "SMEs & retail", "NGOs", "technology companies", "entertainment brands", "corporate organisations"],
  autonomousCycles: true,
  reportEmail: null,
  socialCadence: { instagram: 4, linkedin: 3, facebook: 3, tiktok: 3 },
  reportWhatsApp: true,
};

export async function getBusiness() {
  const [b] = await db.select().from(businesses).where(eq(businesses.slug, "prohub"));
  return b;
}

export async function getSettings(): Promise<BusinessSettings> {
  const b = await getBusiness();
  return { ...DEFAULT_SETTINGS, ...((b?.settings ?? {}) as Partial<BusinessSettings>) };
}

export async function updateSettings(patch: Partial<BusinessSettings>) {
  const current = await getSettings();
  await db.update(businesses).set({ settings: { ...current, ...patch } }).where(eq(businesses.slug, "prohub"));
}
