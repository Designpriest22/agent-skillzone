import fs from "node:fs";
import { plateSvg } from "../src/lib/plates";
import { sceneKinds } from "../src/content/schema";
const out = process.argv[2]!;
const only = process.argv[3]?.split(",");
const tods = ["dawn","day","dusk","night"] as const;
let html = `<html><body style="margin:0;background:#111;display:grid;grid-template-columns:repeat(4,400px);gap:4px">`;
for (const s of sceneKinds.filter(k=>!only||only.includes(k))) for (const t of tods) for (const seed of [7, 191]) {
  const svg = plateSvg({scene:s,tod:t,seed});
  fs.writeFileSync(`${out}/${s}-${t}-${seed}.svg`, svg);
  html += `<img src="${s}-${t}-${seed}.svg" style="width:400px;height:250px;display:block">`;
}
fs.writeFileSync(`${out}/sheet.html`, html + "</body></html>");
