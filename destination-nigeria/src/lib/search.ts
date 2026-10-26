/** Lightweight, dependency-free site search used by the search dialog and /search. */

export type SearchDoc = {
  kind: "Destination" | "State" | "Experience" | "Story" | "Page";
  title: string;
  url: string;
  text: string;
  /** Extra terms that should match strongly (state name, categories…). */
  keywords?: string;
};

export function normalise(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function searchDocs(docs: SearchDoc[], query: string, limit = 20): SearchDoc[] {
  const q = normalise(query);
  if (!q) return [];
  const terms = q.split(" ").filter((t) => t.length > 1 || q.length === 1);
  const scored: { d: SearchDoc; s: number }[] = [];
  for (const d of docs) {
    const title = normalise(d.title);
    const kw = normalise(d.keywords ?? "");
    const text = normalise(d.text);
    let s = 0;
    let all = true;
    for (const t of terms) {
      let ts = 0;
      if (title.startsWith(t)) ts += 12;
      if (new RegExp(`\\b${t}`).test(title)) ts += 8;
      else if (title.includes(t)) ts += 4;
      if (new RegExp(`\\b${t}`).test(kw)) ts += 5;
      if (new RegExp(`\\b${t}`).test(text)) ts += 2;
      if (ts === 0) all = false;
      s += ts;
    }
    if (title === q) s += 20;
    if (all && s > 0) scored.push({ d, s });
  }
  return scored.sort((a, b) => b.s - a.s || a.d.title.localeCompare(b.d.title)).slice(0, limit).map((x) => x.d);
}
