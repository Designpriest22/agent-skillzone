/**
 * Captures real product screenshots for the landing page (public/screenshots/*.png).
 * Requires the app running on APP_URL against a seeded database (DATABASE_URL).
 * Creates a throwaway learner, captures the lesson player, speak page and revision
 * card at phone size, then deletes the learner.
 */
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { chromium } from "@playwright/test";
import { loadEnv } from "./load-env";

loadEnv();
const APP_URL = process.env.APP_URL ?? "http://localhost:3000";
const OUT = path.join(process.cwd(), "public/screenshots");

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  const browser = await chromium.launch({
    executablePath: fs.existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined,
  });
  const email = `screenshots-${randomUUID().slice(0, 8)}@example.test`;
  try {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 720 },
      deviceScaleFactor: 2,
      colorScheme: "light",
    });
    const page = await ctx.newPage();
    const headers = { origin: APP_URL };
    await page.goto(`${APP_URL}/signin`);
    const r = await ctx.request.post(`${APP_URL}/api/auth/signup`, {
      headers,
      data: {
        email,
        password: "screenshot-password-123",
        displayName: "Ada",
        ageConfirmed: true,
        ageBand: "adult",
        acceptTerms: true,
      },
    });
    if (!r.ok()) throw new Error(`signup failed: ${r.status()} ${await r.text()}`);
    const ob = await ctx.request.post(`${APP_URL}/api/onboarding`, {
      headers,
      data: {
        language: "yo",
        goals: ["family"],
        level: "beginner",
        explanationLanguage: "en",
        tutorId: "kemi",
        dailyGoalMinutes: 10,
        timezone: "Africa/Lagos",
      },
    });
    const { firstLessonId } = (await ob.json()) as { firstLessonId: string };
    // Keep the screenshots focused on the feature, not the email-confirmation banner.
    await sql`update users set email_verified_at = now() where email = ${email}`;

    // 1. Lesson player: advance to the dialogue activity.
    await page.goto(`${APP_URL}/learn/${firstLessonId}`, { waitUntil: "networkidle" });
    const acts =
      await sql`select type, payload, answer from lesson_activities where lesson_id = ${firstLessonId} order by sort_order`;
    for (const a of acts) {
      if (a.type === "dialogue") break;
      const section = page.locator("section[aria-label^='Activity']");
      if (a.type === "matching") {
        for (const [l, rr] of a.answer.pairs) {
          await section.getByRole("button", { name: l, exact: true }).click();
          await section.getByRole("button", { name: rr, exact: true }).click();
        }
        await section.getByRole("button", { name: "Check" }).click();
      } else {
        await section.getByRole("button", { name: a.payload.options[a.answer.index], exact: true }).click();
      }
      await page.getByRole("button", { name: "Continue" }).click();
    }
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, "lesson.png") });

    // 2. Speak page.
    await page.goto(`${APP_URL}/speak`, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(OUT, "speak.png") });

    // 3. Revision card: complete the lesson through the API, then make cards due.
    for (const a of await sql`select id, type, payload, answer from lesson_activities where lesson_id = ${firstLessonId} order by sort_order`) {
      const response =
        a.type === "listening" || a.type === "dialogue"
          ? { type: a.type, index: a.answer.index }
          : a.type === "translation"
            ? { type: "translation", text: a.answer.accepted[0] }
            : a.type === "word_order"
              ? { type: "word_order", order: a.answer.order }
              : a.type === "matching"
                ? { type: "matching", pairs: a.answer.pairs }
                : a.type === "review"
                  ? { type: "review", answers: [] }
                  : { type: "recap" };
      await ctx.request.post(`${APP_URL}/api/lessons/${firstLessonId}/attempt`, {
        headers,
        data: { activityId: a.id, response },
      });
    }
    await ctx.request.post(`${APP_URL}/api/lessons/${firstLessonId}/complete`, { headers });
    await sql`update user_vocabulary set due_at = now() - interval '1 minute' where user_id = (select id from users where email = ${email})`;
    await page.goto(`${APP_URL}/review`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Show answer" }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, "review.png") });
    console.log("Screenshots written to public/screenshots/");
  } finally {
    await sql`delete from users where email = ${email}`;
    await sql.end();
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
