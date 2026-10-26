import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => page.addInitScript(() => localStorage.setItem("dn:welcomed", "1")));

test("mobile menu opens, navigates and closes", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Menu" }).click();
  const menu = page.getByRole("dialog", { name: "Menu" });
  await expect(menu).toBeVisible();
  await menu.getByRole("link", { name: "Invest in Tourism" }).click();
  await expect(page).toHaveURL(/\/invest$/);
  await expect(menu).toBeHidden();
});

test("no horizontal scrolling on key pages", async ({ page }) => {
  for (const path of ["/", "/destinations", "/destinations/obudu-mountain-resort", "/plan", "/invest", "/national-tourism-week", "/states"]) {
    await page.goto(path);
    const [scroll, width] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    expect(scroll, path).toBeLessThanOrEqual(width);
  }
});

test("hero controls do not cover the search panel", async ({ page }) => {
  await page.goto("/");
  const search = await page.getByRole("button", { name: /Show destinations/ }).boundingBox();
  const pause = await page.getByRole("button", { name: "Pause background film" }).boundingBox();
  expect(search && pause && pause.y >= search.y + search.height).toBe(true);
});

test("map state can be selected by tap", async ({ page }) => {
  await page.goto("/states");
  await page.getByRole("button", { name: /^Kano State, North West/ }).tap();
  await expect(page.getByRole("heading", { level: 3, name: "Kano State" })).toBeVisible();
});
