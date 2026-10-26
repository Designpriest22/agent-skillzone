import { describe, expect, it } from "vitest";
import geo from "@/content/geo/nigeria-states.json";
import { destinations } from "@/content/destinations";
import { experiences } from "@/content/experiences";
import { campaignWeeks, offers, opportunities, partners } from "@/content/platform";
import { resources } from "@/content/resources";
import { destinationSchema, offerSchema, opportunitySchema, partnerSchema, stateSchema, storySchema } from "@/content/schema";
import { states } from "@/content/states";
import { stories } from "@/content/stories";
import { allPlates, heroScenes } from "@/lib/content";
import { parsePlateKey, plateKey, plateSvg } from "@/lib/plates";

/** These tests are the content team's safety net: run `npm test` after any content edit. */
describe("content integrity", () => {
  it("has the 36 states plus the FCT, each matched to a map outline", () => {
    expect(states).toHaveLength(37);
    states.forEach((s) => expect(stateSchema.safeParse(s).success).toBe(true));
    const ids = new Set(geo.states.map((g) => g.svgId));
    states.forEach((s) => expect(ids.has(s.svgId), s.slug).toBe(true));
  });

  it("validates every destination and links it to a real state", () => {
    const slugs = new Set<string>();
    for (const d of destinations) {
      const r = destinationSchema.safeParse(d);
      expect(r.success, `${d.slug}: ${r.success ? "" : r.error.message}`).toBe(true);
      expect(states.some((s) => s.slug === d.state), d.slug).toBe(true);
      expect(slugs.has(d.slug), `duplicate ${d.slug}`).toBe(false);
      slugs.add(d.slug);
    }
  });

  it("never marks content verified without naming who verified it", () => {
    for (const d of destinations) {
      if (d.verification.status === "verified") expect(d.verification.verifiedBy).toBeTruthy();
    }
  });

  it("validates stories and their related destinations", () => {
    for (const s of stories) {
      const r = storySchema.safeParse(s);
      expect(r.success, `${s.slug}: ${r.success ? "" : r.error.message}`).toBe(true);
      s.relatedDestinations.forEach((slug) => expect(destinations.some((d) => d.slug === slug), `${s.slug} → ${slug}`).toBe(true));
      if (s.reviewStatus === "reviewed") expect(s.reviewer).toBeTruthy();
    }
  });

  it("only publishes commercial and partner records that pass validation", () => {
    offers.forEach((o) => expect(offerSchema.safeParse(o).success).toBe(true));
    opportunities.forEach((o) => expect(opportunitySchema.safeParse(o).success).toBe(true));
    partners.forEach((p) => expect(partnerSchema.safeParse(p).success).toBe(true));
  });

  it("keeps the eight-week campaign in countdown order", () => {
    expect(campaignWeeks.map((w) => w.week)).toEqual([8, 7, 6, 5, 4, 3, 2, 1]);
  });

  it("uses https for every external source and resource", () => {
    resources.forEach((r) => expect(r.url.startsWith("https://"), r.id).toBe(true));
    destinations.flatMap((d) => d.verification.sources).forEach((s) => expect(s.url.startsWith("https://")).toBe(true));
  });

  it("gives every experience at least one destination", () => {
    for (const e of experiences) {
      expect(destinations.some((d) => d.categories.some((c) => e.categories.includes(c))), e.slug).toBe(true);
    }
  });
});

describe("illustration plates", () => {
  it("round-trips plate keys", () => {
    for (const p of allPlates()) expect(parsePlateKey(plateKey(p))).toEqual(p);
    expect(parsePlateKey("../etc/passwd")).toBeNull();
    expect(parsePlateKey("volcano-day-1")).toBeNull();
  });

  it("renders deterministic, well-formed SVG for every plate", () => {
    for (const p of allPlates()) {
      const a = plateSvg(p);
      expect(a).toBe(plateSvg(p));
      expect(a.startsWith("<svg")).toBe(true);
      expect(a.endsWith("</svg>")).toBe(true);
      expect(a).not.toMatch(/NaN|undefined/);
    }
  });

  it("keeps hero scenes small enough to stream", () => {
    heroScenes.forEach((h) => expect(plateSvg(h.plate).length).toBeLessThan(60_000));
  });
});
