import { categories } from "@/content/categories";
import type { CategoryId, Destination, ZoneId } from "@/content/schema";
import { zones } from "@/content/states";
import { normalise } from "./search";

export type ExplorerItem = Destination & { stateName: string; stateLabel: string; zone: ZoneId };
export type ExplorerFilters = { q: string; cat: string; zone: string; state: string };

/** Pure destination filter used by the explorer; every query word must match. */
export function filterDestinations(items: ExplorerItem[], f: ExplorerFilters): ExplorerItem[] {
  const q = normalise(f.q);
  return items.filter((d) => {
    if (f.cat && !d.categories.includes(f.cat as CategoryId)) return false;
    if (f.zone && d.zone !== f.zone) return false;
    if (f.state && d.state !== f.state) return false;
    if (q) {
      const hay = normalise([d.name, d.summary, d.stateName, d.locality ?? "", zones[d.zone].name, ...d.categories.map((c) => categories[c].label)].join(" "));
      return q.split(" ").every((t) => hay.includes(t));
    }
    return true;
  });
}
