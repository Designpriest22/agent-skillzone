import type { Destination, State } from "@/content/schema";

export type ItineraryStop = { slug: string; days: number; note: string };

/** Plain-text itinerary for download or sharing. Pure, so it is unit-tested. */
export function itineraryText(
  stops: ItineraryStop[],
  lookup: (slug: string) => { d: Destination; s: State } | undefined,
  siteUrl: string,
  generatedOn: string,
): string {
  const lines: string[] = ["DESTINATION NIGERIA — MY TRIP PLAN", `Created ${generatedOn}`, ""];
  let day = 1;
  stops.forEach((stop, i) => {
    const hit = lookup(stop.slug);
    if (!hit) return;
    const span = stop.days > 1 ? `Days ${day}–${day + stop.days - 1}` : `Day ${day}`;
    lines.push(`${i + 1}. ${hit.d.name} — ${hit.s.name}${hit.s.slug === "fct" ? "" : " State"} (${span})`);
    lines.push(`   ${hit.d.summary}`);
    if (stop.note.trim()) lines.push(`   Note: ${stop.note.trim()}`);
    lines.push(`   ${siteUrl}/destinations/${hit.d.slug}`);
    lines.push("");
    day += stop.days;
  });
  const total = stops.reduce((n, s) => n + (lookup(s.slug) ? s.days : 0), 0);
  lines.push(`Total: ${total} day${total === 1 ? "" : "s"}`);
  lines.push("");
  lines.push("This is a personal planning aid, not a booking. Confirm access, opening times, prices and transport");
  lines.push("with operators, and read current official travel advice for every state on your route before travelling.");
  return lines.join("\n");
}

/** Encode a plan into a shareable query string value: slug~days,slug~days */
export function encodePlan(stops: ItineraryStop[]): string {
  return stops.map((s) => `${s.slug}~${s.days}`).join(",");
}

export function decodePlan(value: string, known: (slug: string) => boolean): ItineraryStop[] {
  return value
    .split(",")
    .map((part) => {
      const [slug = "", d = "1"] = part.split("~");
      return { slug, days: Math.min(30, Math.max(1, Number.parseInt(d, 10) || 1)), note: "" };
    })
    .filter((s, i, arr) => known(s.slug) && arr.findIndex((x) => x.slug === s.slug) === i)
    .slice(0, 30);
}
