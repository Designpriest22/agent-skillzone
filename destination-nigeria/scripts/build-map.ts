/**
 * Extracts state outlines from @svg-maps/nigeria (CC BY 4.0, Michael Chukwu /
 * svg-maps project) into a committed JSON file so the site has no runtime
 * dependency on the package. Re-run with `npm run map:build`.
 */
import fs from "node:fs";
import path from "node:path";
import nigeria from "@svg-maps/nigeria";

type Location = { id: string; name: string; path: string };
const map = nigeria as unknown as { viewBox: string; locations: Location[] };

const out = {
  source: "@svg-maps/nigeria@2.0.0 (https://github.com/VictorCazanave/svg-maps/tree/master/packages/nigeria)",
  license: "CC BY 4.0 — Michael Chukwu",
  viewBox: map.viewBox,
  states: map.locations.map((l) => ({
    svgId: l.id,
    name: l.name,
    // Round coordinates to one decimal place: ~40% smaller with no visible change at display size.
    path: l.path.replace(/-?\d+\.\d+/g, (n) => String(Math.round(Number(n) * 10) / 10)),
  })),
};

const target = path.join(import.meta.dirname, "..", "src", "content", "geo", "nigeria-states.json");
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, JSON.stringify(out));
console.log(`Wrote ${out.states.length} states to ${path.relative(process.cwd(), target)} (${fs.statSync(target).size} bytes)`);
