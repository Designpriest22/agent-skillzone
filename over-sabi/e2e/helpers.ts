import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { expect, type Page } from "@playwright/test";

export const sql = postgres(
  process.env.E2E_DATABASE_URL ?? "postgres://oversabi:oversabi@localhost:5432/oversabi_e2e",
  { max: 2, onnotice: () => {} },
);

export const newEmail = () => `e2e-${randomUUID().slice(0, 8)}@example.test`;
export const PASSWORD = "a-strong-test-password";

/** Navigate and wait until client components have hydrated (dev server compiles on demand). */
export async function open(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}

export async function signUp(page: Page, email = newEmail()) {
  await open(page, "/signup");
  await page.getByLabel("What should we call you?").fill("Ada");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByLabel("18 or older").check();
  await page.getByRole("checkbox", { name: /I agree to the terms/ }).check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/onboarding/);
  return email;
}

/** Walks the onboarding flow and lands in the first lesson. */
export async function onboard(page: Page, languageNative = "Yorùbá") {
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Let's go" }).click();
  await page.getByRole("button", { name: new RegExp(languageNative) }).click();
  await page.getByText("Speaking with family").click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByText("Complete beginner").click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click(); // explanations: English
  await page
    .getByRole("button", { name: /Kẹ́mi|Chiamaka|Hauwa/ })
    .first()
    .click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /^10/ }).click();
  await page.getByRole("button", { name: /Build my plan and start/ }).click();
  await expect(page).toHaveURL(/\/learn\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  await page.waitForLoadState("networkidle");
}

/**
 * Answers the current lesson correctly using the stored answers (test-only DB access),
 * driving the real UI for every activity type.
 */
export async function playLessonCorrectly(page: Page, lessonId: string) {
  const activities =
    await sql`select type, payload, answer from lesson_activities where lesson_id = ${lessonId} order by sort_order`;
  for (const a of activities) {
    const section = page.locator("section[aria-label^='Activity']");
    await expect(section).toBeVisible();
    switch (a.type) {
      case "listening":
      case "dialogue":
        await section.getByRole("button", { name: a.payload.options[a.answer.index], exact: true }).click();
        break;
      case "translation":
        await page.getByLabel("Your answer").fill(a.answer.accepted[0]);
        await section.getByRole("button", { name: "Check" }).click();
        break;
      case "word_order":
        for (const w of a.answer.order as string[])
          await section.getByRole("button", { name: w, exact: true }).first().click();
        await section.getByRole("button", { name: "Check" }).click();
        break;
      case "matching":
        for (const [l, r] of a.answer.pairs as [string, string][]) {
          await section.getByRole("button", { name: l, exact: true }).click();
          await section.getByRole("button", { name: r, exact: true }).click();
        }
        await section.getByRole("button", { name: "Check" }).click();
        break;
      case "review": {
        const radios = section.locator("fieldset");
        const n = await radios.count();
        if (n === 0) {
          await section.getByRole("button", { name: "Continue" }).click();
          break;
        }
        for (let i = 0; i < n; i++) await radios.nth(i).locator("input").first().check();
        await section.getByRole("button", { name: "Check" }).click();
        break;
      }
      case "recap":
        await section.getByRole("button", { name: "Got it" }).click();
        continue;
    }
    if (a.type !== "recap") {
      await expect(page.getByRole("status").filter({ hasText: /Correct|Almost|Not quite/ })).toBeVisible();
      await page.getByRole("button", { name: "Continue" }).click();
    }
  }
  // Completion is saved asynchronously; wait for the result screen.
  await expect(page.getByText("Lesson complete")).toBeVisible();
}

/** Each test signs up from the same IP; reset limiter windows so tests don't throttle each other. */
export async function resetRateLimits() {
  await sql`delete from rate_limits`;
}
