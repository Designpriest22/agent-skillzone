import { destinations } from "@/content/destinations";
import { experiences } from "@/content/experiences";
import type { Plate, State } from "@/content/schema";
import { stateBySlug, states } from "@/content/states";
import { stories } from "@/content/stories";
import { plateKey } from "./plates";

export function stateLabel(s: State): string {
  return s.slug === "fct" ? "Federal Capital Territory" : `${s.name} State`;
}

export function stateOf(slug: string): State {
  const s = stateBySlug.get(slug);
  if (!s) throw new Error(`Unknown state: ${slug}`);
  return s;
}

/** States that have at least one destination get an indexable page. */
export function statesWithContent(): State[] {
  const withContent = new Set(destinations.map((d) => d.state));
  return states.filter((s) => withContent.has(s.slug));
}

/** Plates used by the hero film, in order: landscape → culture → hospitality → city → creative life. */
export const heroScenes: { plate: Plate; caption: string; alt: string }[] = [
  { plate: { scene: "highland", tod: "dawn", seed: 111 }, caption: "Highlands at first light", alt: "Illustration: mist settling between green highland ridges at dawn." },
  { plate: { scene: "inselberg", tod: "day", seed: 191 }, caption: "Granite country", alt: "Illustration: a granite monolith rising above savanna and acacia trees." },
  { plate: { scene: "waterfall", tod: "dawn", seed: 31 }, caption: "Forest waterfalls", alt: "Illustration: a waterfall falling between forested cliffs into a misty pool." },
  { plate: { scene: "earthen", tod: "dusk", seed: 141 }, caption: "Earthen cities", alt: "Illustration: earthen buildings with horn-shaped parapets and relief patterns at dusk." },
  { plate: { scene: "coast", tod: "dusk", seed: 151 }, caption: "Atlantic coast", alt: "Illustration: palm trees over a beach as the sun sets into the Atlantic." },
  { plate: { scene: "city", tod: "dusk", seed: 91 }, caption: "Lagoon city lights", alt: "Illustration: a city skyline at dusk with lit windows reflected in a lagoon." },
  { plate: { scene: "festival", tod: "night", seed: 121 }, caption: "Festival nights", alt: "Illustration: a crowd under bunting and glowing festival lights at night." },
];

export function allPlates(): Plate[] {
  const list: Plate[] = [
    ...destinations.map((d) => d.plate),
    ...experiences.map((e) => e.plate),
    ...stories.map((s) => s.plate),
    ...heroScenes.map((h) => h.plate),
    ...pagePlates,
  ];
  const seen = new Set<string>();
  return list.filter((p) => {
    const k = plateKey(p);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** Header plates for interior pages. */
export const pagePlates: Plate[] = [
  { scene: "highland", tod: "day", seed: 3001 },
  { scene: "savanna", tod: "dusk", seed: 3002 },
  { scene: "city", tod: "night", seed: 3003 },
  { scene: "festival", tod: "dusk", seed: 3004 },
  { scene: "lake", tod: "dawn", seed: 3005 },
  { scene: "grove", tod: "dawn", seed: 3006 },
  { scene: "boulders", tod: "day", seed: 3007 },
];

export const pagePlate = {
  discover: pagePlates[0]!,
  invest: pagePlates[2]!,
  ntw: pagePlates[3]!,
  plan: pagePlates[4]!,
  stories: pagePlates[5]!,
  states: pagePlates[6]!,
  destinations: pagePlates[1]!,
};

export function plateAlt(scene: Plate["scene"]): string {
  const map: Record<Plate["scene"], string> = {
    highland: "highland ridges",
    inselberg: "a granite inselberg above savanna",
    waterfall: "a waterfall between forested cliffs",
    savanna: "savanna with acacia trees",
    coast: "a palm-lined Atlantic beach",
    lake: "a lake with a canoe",
    city: "a lagoon city skyline",
    earthen: "earthen architecture",
    terraces: "terraced hillsides with conical-roofed houses",
    grove: "a forest grove beside a river",
    festival: "a festival crowd under lights",
    dyepits: "indigo dye pits and cloth, seen from above",
    boulders: "piled granite boulders",
    rainforest: "layered rainforest canopy",
    table: "Nigerian dishes on a resist-dyed cloth, seen from above",
  };
  return `Illustration of ${map[scene]}.`;
}
