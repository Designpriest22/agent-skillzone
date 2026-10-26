import { describe, expect, it } from "vitest";
import { destinations } from "@/content/destinations";
import { stateBySlug } from "@/content/states";
import { filterDestinations, type ExplorerItem } from "@/lib/filter";
import { formSchema, investmentSchema, newsletterSchema, partnershipSchema } from "@/lib/forms";
import { decodePlan, encodePlan, itineraryText } from "@/lib/itinerary";
import { createRateLimiter } from "@/lib/rate-limit";
import { searchDocs } from "@/lib/search";
import { buildSearchIndex } from "@/lib/search-index";

const items: ExplorerItem[] = destinations.map((d) => {
  const s = stateBySlug.get(d.state)!;
  return { ...d, stateName: s.name, stateLabel: s.name, zone: s.zone };
});

describe("destination filter", () => {
  it("filters by category, zone, state and words", () => {
    expect(filterDestinations(items, { q: "", cat: "", zone: "", state: "" })).toHaveLength(destinations.length);
    const falls = filterDestinations(items, { q: "waterfall", cat: "", zone: "", state: "" });
    expect(falls.map((d) => d.slug)).toContain("erin-ijesha-waterfalls");
    const festivals = filterDestinations(items, { q: "", cat: "festivals-events", zone: "", state: "" });
    festivals.forEach((d) => expect(d.categories).toContain("festivals-events"));
    const lagos = filterDestinations(items, { q: "", cat: "", zone: "", state: "lagos" });
    lagos.forEach((d) => expect(d.state).toBe("lagos"));
    const ne = filterDestinations(items, { q: "", cat: "", zone: "north-east", state: "" });
    expect(ne.length).toBeGreaterThan(0);
    ne.forEach((d) => expect(d.zone).toBe("north-east"));
  });

  it("requires every word to match and ignores accents and case", () => {
    expect(filterDestinations(items, { q: "CALABAR carnival", cat: "", zone: "", state: "" }).map((d) => d.slug)).toEqual(["calabar-carnival"]);
    expect(filterDestinations(items, { q: "zzzz", cat: "", zone: "", state: "" })).toHaveLength(0);
  });
});

describe("site search", () => {
  const index = buildSearchIndex();
  it("ranks title matches first", () => {
    expect(searchDocs(index, "olumo")[0]?.title).toBe("Olumo Rock");
    expect(searchDocs(index, "kano")[0]?.url).toMatch(/kano/);
  });
  it("returns nothing for empty queries", () => {
    expect(searchDocs(index, "   ")).toEqual([]);
  });
});

describe("itinerary", () => {
  const lookup = (slug: string) => {
    const d = destinations.find((x) => x.slug === slug);
    return d ? { d, s: stateBySlug.get(d.state)! } : undefined;
  };
  it("writes a plain-text plan with running day numbers and a disclaimer", () => {
    const text = itineraryText(
      [
        { slug: "olumo-rock", days: 2, note: "Ask about adire workshops" },
        { slug: "osun-osogbo-sacred-grove", days: 1, note: "" },
      ],
      lookup,
      "https://example.org",
      "26 October 2026",
    );
    expect(text).toContain("1. Olumo Rock — Ogun State (Days 1–2)");
    expect(text).toContain("2. Osun-Osogbo Sacred Grove — Osun State (Day 3)");
    expect(text).toContain("Note: Ask about adire workshops");
    expect(text).toContain("Total: 3 days");
    expect(text).toMatch(/not a booking/);
  });
  it("encodes and safely decodes shared plans", () => {
    const enc = encodePlan([{ slug: "zuma-rock", days: 2, note: "x" }]);
    expect(enc).toBe("zuma-rock~2");
    const known = (s: string) => destinations.some((d) => d.slug === s);
    expect(decodePlan("zuma-rock~2,evil~3,zuma-rock~4,olumo-rock~999", known)).toEqual([
      { slug: "zuma-rock", days: 2, note: "" },
      { slug: "olumo-rock", days: 30, note: "" },
    ]);
  });
});

describe("rate limiter", () => {
  it("allows the limit then blocks until the window resets", () => {
    const rl = createRateLimiter(2, 1000);
    expect(rl.check("a", 0).ok).toBe(true);
    expect(rl.check("a", 10).ok).toBe(true);
    const third = rl.check("a", 20);
    expect(third.ok).toBe(false);
    expect(third.retryAfter).toBe(1);
    expect(rl.check("b", 20).ok).toBe(true);
    expect(rl.check("a", 1001).ok).toBe(true);
  });
});

describe("form validation", () => {
  it("requires consent and a valid email for the newsletter", () => {
    expect(newsletterSchema.safeParse({ kind: "newsletter", email: "bad", audience: "traveller", consent: true }).success).toBe(false);
    expect(newsletterSchema.safeParse({ kind: "newsletter", email: "a@b.co", audience: "traveller", consent: false }).success).toBe(false);
    expect(newsletterSchema.safeParse({ kind: "newsletter", email: "a@b.co", audience: "traveller", consent: true }).success).toBe(true);
  });
  it("rejects unknown option values", () => {
    expect(newsletterSchema.safeParse({ kind: "newsletter", email: "a@b.co", audience: "hacker", consent: true }).success).toBe(false);
  });
  it("validates investment and partnership enquiries", () => {
    const base = { name: "Ada Obi", email: "ada@example.com", organisation: "Example Capital", message: "We would like to discuss hospitality opportunities.", consent: true };
    expect(investmentSchema.safeParse({ kind: "investment", ...base, investorType: "fund" }).success).toBe(true);
    expect(partnershipSchema.safeParse({ kind: "partnership", ...base, partnerType: "state", interest: "showcase", website: "not a url" }).success).toBe(false);
    expect(partnershipSchema.safeParse({ kind: "partnership", ...base, partnerType: "state", interest: "showcase", website: "https://example.com" }).success).toBe(true);
    expect(formSchema.safeParse({ kind: "unknown" }).success).toBe(false);
  });
});
