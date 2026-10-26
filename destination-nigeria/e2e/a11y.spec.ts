import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const pages = ["/", "/discover", "/destinations", "/destinations/sukur-cultural-landscape", "/states", "/states/lagos", "/experiences/food-and-culinary-travel", "/plan", "/invest", "/national-tourism-week", "/stories", "/stories/planning-a-first-trip-to-nigeria", "/offers", "/partners", "/about", "/privacy", "/cookies"];

test.describe("automated accessibility (axe, WCAG 2.2 A/AA)", () => {
  test.beforeEach(async ({ page }) => page.addInitScript(() => localStorage.setItem("dn:welcomed", "1")));
  for (const path of pages) {
    test(path, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(path);
      await page.waitForLoadState("load");
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
      const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
      expect(summary, summary.join("\n")).toEqual([]);
    });
  }
});
