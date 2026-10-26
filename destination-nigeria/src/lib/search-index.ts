import { categories } from "@/content/categories";
import { destinations } from "@/content/destinations";
import { experiences } from "@/content/experiences";
import { primaryNav } from "@/content/site";
import { states, zones } from "@/content/states";
import { stories } from "@/content/stories";
import type { SearchDoc } from "./search";

export function buildSearchIndex(): SearchDoc[] {
  const docs: SearchDoc[] = [];
  for (const d of destinations) {
    const st = states.find((s) => s.slug === d.state)!;
    docs.push({
      kind: "Destination",
      title: d.name,
      url: `/destinations/${d.slug}`,
      text: d.summary,
      keywords: [st.name, d.locality, zones[st.zone].name, ...d.categories.map((c) => categories[c].label)].filter(Boolean).join(" "),
    });
  }
  for (const s of states) {
    docs.push({
      kind: "State",
      title: s.name === "Federal Capital Territory" ? "Federal Capital Territory (Abuja)" : `${s.name} State`,
      url: `/states/${s.slug}`,
      text: s.summary ?? `${s.name}, ${zones[s.zone].name}. Capital: ${s.capital}.`,
      keywords: `${s.capital} ${zones[s.zone].name}`,
    });
  }
  for (const e of experiences) docs.push({ kind: "Experience", title: e.name, url: `/experiences/${e.slug}`, text: e.line });
  for (const s of stories) docs.push({ kind: "Story", title: s.title, url: `/stories/${s.slug}`, text: s.dek });
  for (const n of primaryNav) docs.push({ kind: "Page", title: n.label, url: n.href, text: "" });
  docs.push(
    { kind: "Page", title: "Stories from Nigeria", url: "/stories", text: "Journal, guides and itineraries" },
    { kind: "Page", title: "Offers & bookings", url: "/offers", text: "Verified travel packages, accommodation and tours" },
    { kind: "Page", title: "Partnerships", url: "/partners", text: "Institutional collaboration and expressions of interest" },
    { kind: "Page", title: "Travel advisories, entry and health", url: "/plan#before-you-go", text: "visa e-visa yellow fever advice safety" },
    { kind: "Page", title: "Itinerary builder", url: "/plan#itinerary", text: "trip shortlist plan export print" },
  );
  return docs;
}
