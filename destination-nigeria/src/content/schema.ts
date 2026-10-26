import { z } from "zod";

/**
 * Content schemas. Every record that makes a factual claim carries a
 * `verification` block so editors can see what has been checked, by whom
 * and when. Nothing is shown to visitors as "verified" unless an approved
 * authority has confirmed it (status "verified").
 */

export const zoneIds = ["north-central", "north-east", "north-west", "south-east", "south-south", "south-west"] as const;
export type ZoneId = (typeof zoneIds)[number];

export const categoryIds = [
  "nature-adventure",
  "culture-heritage",
  "food-culinary",
  "festivals-events",
  "cities-urban",
  "hospitality-relaxation",
  "family",
  "business-investment",
] as const;
export type CategoryId = (typeof categoryIds)[number];

export const sceneKinds = [
  "highland",
  "inselberg",
  "waterfall",
  "savanna",
  "coast",
  "lake",
  "city",
  "earthen",
  "terraces",
  "grove",
  "festival",
  "dyepits",
  "boulders",
  "rainforest",
  "table",
] as const;
export type SceneKind = (typeof sceneKinds)[number];

export const timesOfDay = ["dawn", "day", "dusk", "night"] as const;
export type TimeOfDay = (typeof timesOfDay)[number];

export const plateSchema = z.object({
  scene: z.enum(sceneKinds),
  tod: z.enum(timesOfDay),
  seed: z.number().int().nonnegative(),
});
export type Plate = z.infer<typeof plateSchema>;

export const sourceSchema = z.object({
  label: z.string().min(2),
  url: z.url(),
});
export type Source = z.infer<typeof sourceSchema>;

export const verificationSchema = z.object({
  /**
   * reference  — written from public reference sources; not yet reviewed by a state authority or operator.
   * verified   — confirmed by a named authority; `verifiedBy` required.
   */
  status: z.enum(["reference", "verified"]),
  verifiedBy: z.string().optional(),
  lastChecked: z.iso.date(),
  sources: z.array(sourceSchema).min(1),
});
export type Verification = z.infer<typeof verificationSchema>;

export const stateSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  capital: z.string(),
  zone: z.enum(zoneIds),
  /** id of the outline in src/content/geo/nigeria-states.json */
  svgId: z.string(),
  summary: z.string().optional(),
});
export type State = z.infer<typeof stateSchema>;

export const practicalSchema = z.object({
  label: z.string(),
  value: z.string(),
});

export const destinationSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  state: z.string(),
  /** Town, LGA or area, when well established. */
  locality: z.string().optional(),
  categories: z.array(z.enum(categoryIds)).min(1),
  summary: z.string().max(220),
  intro: z.array(z.string()).min(1),
  highlights: z.array(z.string()).min(2),
  practical: z.array(practicalSchema),
  plate: plateSchema,
  featured: z.boolean().optional(),
  verification: verificationSchema,
});
export type Destination = z.infer<typeof destinationSchema>;

export const blockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("p"), text: z.string() }),
  z.object({ type: z.literal("h2"), text: z.string() }),
  z.object({ type: z.literal("ul"), items: z.array(z.string()) }),
  z.object({ type: z.literal("note"), text: z.string() }),
]);
export type Block = z.infer<typeof blockSchema>;

export const storyCategoryIds = [
  "destination-guides",
  "itineraries",
  "culture-heritage",
  "food-culinary",
  "festivals-events",
  "responsible-tourism",
  "hospitality-business",
  "tourism-investment",
  "state-spotlights",
] as const;
export type StoryCategoryId = (typeof storyCategoryIds)[number];

export const storySchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  dek: z.string().max(240),
  category: z.enum(storyCategoryIds),
  author: z.string(),
  reviewer: z.string().nullable(),
  reviewStatus: z.enum(["awaiting-review", "reviewed"]),
  published: z.iso.date(),
  updated: z.iso.date(),
  readingMinutes: z.number().int().positive(),
  plate: plateSchema,
  relatedDestinations: z.array(z.string()),
  body: z.array(blockSchema).min(3),
  sources: z.array(sourceSchema),
});
export type Story = z.infer<typeof storySchema>;

/** Verified commercial listing (Section J). Inventory stays empty until a provider is verified. */
export const offerSchema = z.object({
  id: z.string(),
  provider: z.string(),
  destination: z.string(),
  category: z.enum(["package", "accommodation", "tour", "event", "experience"]),
  description: z.string(),
  validFrom: z.iso.date().optional(),
  validTo: z.iso.date().optional(),
  price: z.string().optional(),
  terms: z.string().optional(),
  bookingUrl: z.url(),
  contact: z.string().optional(),
  verification: verificationSchema,
});
export type Offer = z.infer<typeof offerSchema>;

/** Approved investment opportunity (Section G). Empty until a state or agency approves publication. */
export const opportunitySchema = z.object({
  id: z.string(),
  title: z.string(),
  state: z.string(),
  category: z.string(),
  summary: z.string(),
  stage: z.enum(["concept", "feasibility", "seeking-partners", "in-negotiation"]),
  contactRoute: z.string(),
  documents: z.array(sourceSchema),
  verification: verificationSchema,
});
export type Opportunity = z.infer<typeof opportunitySchema>;

export const partnerSchema = z.object({
  name: z.string(),
  type: z.string(),
  logo: z.string().optional(),
  url: z.url().optional(),
  confirmed: z.literal(true),
  approvedForLogoUse: z.boolean(),
});
export type Partner = z.infer<typeof partnerSchema>;
