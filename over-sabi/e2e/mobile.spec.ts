import { expect, test } from "@playwright/test";
import { onboard, open, signUp } from "./helpers";
import { resetRateLimits } from "./helpers";

test.beforeEach(async () => {
  await resetRateLimits();
});

test("mobile bottom navigation works", async ({ page }) => {
  await signUp(page);
  await onboard(page);
  await open(page, "/home");
  const nav = page.getByRole("navigation", { name: "App (mobile)" });
  await expect(nav).toBeVisible();
  await expect(page.getByRole("navigation", { name: "App", exact: true })).toBeHidden();
  for (const [label, url] of [
    ["Learn", /\/learn$/],
    ["Speak", /\/speak$/],
    ["Vocabulary", /\/vocabulary$/],
    ["Progress", /\/progress$/],
    ["Home", /\/home$/],
  ] as const) {
    await nav.getByRole("link", { name: label }).click();
    await expect(page).toHaveURL(url, { timeout: 30_000 });
    await page.waitForLoadState("networkidle");
    await expect(nav.getByRole("link", { name: label })).toHaveAttribute("aria-current", "page");
  }
  // No horizontal scrolling on phones.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
