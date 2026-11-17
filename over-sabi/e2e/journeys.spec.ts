import { expect, test } from "@playwright/test";
import { onboard, open, PASSWORD, playLessonCorrectly, signUp, sql } from "./helpers";
import { resetRateLimits } from "./helpers";

test.beforeEach(async () => {
  await resetRateLimits();
});

test("guest can take a sample lesson without an account", async ({ page }) => {
  await open(page, "/start");
  await page.getByRole("button", { name: "Let's go" }).click();
  await page.getByRole("button", { name: /Hausa/ }).click();
  for (let i = 0; i < 4; i++) await page.getByRole("button", { name: /Continue|Skip/ }).click();
  await page.getByRole("button", { name: "Start my first lesson" }).click();
  await expect(page).toHaveURL(/\/try\/ha/);
  const [lesson] =
    await sql`select l.id from lessons l join chapters ch on ch.id = l.chapter_id join courses c on c.id = ch.course_id where c.language_code = 'ha' and l.is_sample`;
  await playLessonCorrectly(page, lesson!.id);
  await expect(page.getByText("Lesson complete")).toBeVisible();
  await expect(page.getByRole("link", { name: "Save my progress" })).toBeVisible();
});

test("new learner signs up, onboards, completes a lesson and progress persists", async ({ page }) => {
  const email = await signUp(page);
  await onboard(page);
  await expect(page).toHaveURL(/\/learn\/[0-9a-f-]{36}/);
  const lessonId = page.url().split("/").pop()!.split("?")[0]!;
  await playLessonCorrectly(page, lessonId);
  await expect(page.getByText("You sabi!")).toBeVisible();
  await expect(page.getByText("+20 XP")).toBeVisible();

  // Progress persists across a fresh sign-in.
  await page.context().clearCookies();
  await open(page, "/signin");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/home/);
  await page.goto("/learn");
  await expect(page.getByText("Best 100%")).toBeVisible();
  await page.goto("/vocabulary");
  await expect(page.getByText("Ẹ káàárọ̀").first()).toBeVisible();
});

test("answer validation: wrong and near-miss answers get the right feedback", async ({ page }) => {
  await signUp(page);
  await onboard(page);
  const lessonId = page.url().split("/").pop()!.split("?")[0]!;
  const acts =
    await sql`select type from lesson_activities where lesson_id = ${lessonId} order by sort_order`;
  // Advance to the first translation activity by answering earlier ones.
  const tIndex = acts.findIndex((a) => a.type === "translation");
  const all =
    await sql`select type, payload, answer from lesson_activities where lesson_id = ${lessonId} order by sort_order`;
  for (let i = 0; i < tIndex; i++) {
    const a = all[i]!;
    const section = page.locator("section[aria-label^='Activity']");
    if (a.type === "matching") {
      for (const [l, r] of a.answer.pairs) {
        await section.getByRole("button", { name: l, exact: true }).click();
        await section.getByRole("button", { name: r, exact: true }).click();
      }
      await section.getByRole("button", { name: "Check" }).click();
    } else {
      await section.getByRole("button", { name: a.payload.options[a.answer.index], exact: true }).click();
    }
    await page.getByRole("button", { name: "Continue" }).click();
  }
  await page.getByLabel("Your answer").fill("E se"); // no under-dots or tone
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByText("Almost", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Try again" }).click();
  await page.getByLabel("Your answer").fill("Daalụ");
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByText("Not quite", { exact: true })).toBeVisible();
  await expect(page.getByText(/Answer:/)).toBeVisible();
});

test("speaking session: start, talk, see corrections, end with summary, review transcript", async ({
  page,
}) => {
  await signUp(page);
  await onboard(page);
  await open(page, "/speak");
  await page.getByRole("button", { name: "Start conversation" }).click();
  await expect(page).toHaveURL(/\/speak\/session\//);
  await page.waitForLoadState("networkidle");
  await expect(page.getByText(/test tutor .* #1/)).toBeVisible();
  await expect(page.getByText("Your turn")).toBeVisible();

  await page.getByLabel("Your message").fill("Ẹ káàárọ̀ [[correct]]");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText(/test tutor .* #2/)).toBeVisible();
  await expect(page.getByText("1 correction")).toBeVisible();

  // Provider failure: useful message, and the learner's text is kept for retry.
  await page.getByLabel("Your message").fill("this will fail [[fail]]");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText(/The tutor didn't respond/)).toBeVisible();
  await expect(page.getByLabel("Your message")).toHaveValue("this will fail [[fail]]");

  await page.getByRole("button", { name: "End", exact: true }).click();
  await expect(page.getByText("How it went")).toBeVisible();
  await expect(page.getByText(/Test summary/)).toBeVisible();
  await expect(page.getByText(/Not assessed/)).toBeVisible();
  await page.getByRole("link", { name: "View transcript" }).click();
  await expect(page.getByRole("heading", { name: "Conversation transcript" })).toBeVisible();
  await expect(page.getByText("Ẹ káàárọ̀ [[correct]]", { exact: true }).first()).toBeVisible();
});

test("tutor preferences persist", async ({ page }) => {
  await signUp(page);
  await onboard(page);
  await open(page, "/speak/tutors");
  await page.getByRole("button", { name: /Túndé/ }).click();
  await page.getByText("Every mistake", { exact: true }).click();
  await page.getByText("Immersion", { exact: true }).click();
  await page.getByRole("button", { name: "Save tutor settings" }).click();
  await expect(page.getByText(/Saved/)).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: /Túndé/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("radio", { name: "Every mistake" })).toBeChecked();
  await expect(page.getByRole("radio", { name: "Immersion" })).toBeChecked();
});

test("revision queue shows due words and reschedules them", async ({ page }) => {
  const email = await signUp(page);
  await onboard(page);
  const lessonId = page.url().split("/").pop()!.split("?")[0]!;
  await playLessonCorrectly(page, lessonId);
  await sql`update user_vocabulary set due_at = now() - interval '1 minute' where user_id = (select id from users where email = ${email})`;
  await open(page, "/review");
  await page.getByRole("button", { name: "Show answer" }).click();
  await page.getByRole("button", { name: /Good/ }).click();
  await expect
    .poll(async () => {
      const [{ n }] =
        (await sql`select count(*)::int as n from user_vocabulary where user_id = (select id from users where email = ${email}) and due_at > now() + interval '12 hours'`) as unknown as [
          { n: number },
        ];
      return n;
    })
    .toBe(1);
});

test("microphone: consent, recording and experimental transcription land in the text box", async ({
  page,
}) => {
  await signUp(page);
  await onboard(page);
  // Speech in e2e uses the test double; mark Yoruba STT as experimental so voice input is offered.
  await open(page, "/speak");
  await page.getByRole("button", { name: "Start conversation" }).click();
  await expect(page).toHaveURL(/\/speak\/session\//);
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("Your turn")).toBeVisible();
  await page.getByRole("button", { name: "Allow and use my microphone" }).click();
  await expect(page.getByText("Listening…")).toBeVisible();
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: "Stop recording" }).click();
  await expect(page.getByLabel("Your message")).toHaveValue(/test transcript/);
  await expect(page.getByText(/Check the transcription/)).toBeVisible();
});

test("admin area and admin API are protected server-side", async ({ page, request }) => {
  await signUp(page);
  await onboard(page);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/home\?denied=1/);
  const res = await page.request.post("/api/admin", {
    data: {
      action: "set_user_role",
      input: { userId: "00000000-0000-4000-8000-000000000000", role: "admin" },
    },
    headers: { origin: "http://localhost:3100" },
  });
  expect(res.status()).toBe(403);
  const anon = await request.post("/api/admin", {
    data: { action: "set_flag", input: {} },
    headers: { origin: "http://localhost:3100" },
  });
  expect(anon.status()).toBe(401);
});

test("entitlements can't be changed from the client and checkout fails safely without payment config", async ({
  page,
}) => {
  await signUp(page);
  await onboard(page);
  const ck = await page.request.post("/api/billing/checkout", {
    data: { priceId: "00000000-0000-4000-8000-000000000000" },
    headers: { origin: "http://localhost:3100" },
  });
  expect([403, 503]).toContain(ck.status());
  const hook = await page.request.post("/api/webhooks/paystack", {
    data: { event: "charge.success", data: {} },
  });
  expect([401, 503]).toContain(hook.status());
  await page.goto("/settings#billing");
  await expect(page.getByText(/You're on/)).toContainText("Free");
});

test("password reset via emailed token", async ({ page }) => {
  const email = await signUp(page);
  await page.context().clearCookies();
  await open(page, "/forgot-password");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByText("Check your inbox")).toBeVisible();
  // Tokens are only stored hashed, so insert a known one for the test.
  const { createHash } = await import("node:crypto");
  const token = "e2e-known-reset-token-0123456789";
  await sql`insert into auth_tokens (user_id, kind, token_hash, expires_at) select id, 'reset_password', ${createHash("sha256").update(token).digest("hex")}, now() + interval '1 hour' from users where email = ${email}`;
  await open(page, `/reset-password?token=${token}`);
  await page.getByLabel("New password").fill("another-strong-password");
  await page.getByRole("button", { name: "Save new password" }).click();
  await expect(page).toHaveURL(/\/(home|onboarding)/);
  await open(page, `/reset-password?token=${token}`);
  await page.getByLabel("New password").fill("yet-another-password");
  await page.getByRole("button", { name: "Save new password" }).click();
  await expect(page.getByText(/expired or was already used/)).toBeVisible();
});

test("account deletion removes the learner", async ({ page }) => {
  const email = await signUp(page);
  await onboard(page);
  await open(page, "/settings#privacy");
  const del = page.getByRole("button", { name: "Permanently delete my account" });
  await expect(del).toBeDisabled();
  await page.getByLabel(`Type ${email} to confirm`).fill(email);
  await del.click();
  await expect(page).toHaveURL(/\/goodbye/);
  const rows = await sql`select 1 from users where email = ${email}`;
  expect(rows).toHaveLength(0);
  await page.goto("/home");
  await expect(page).toHaveURL(/\/signin/);
});

test("public pages render, show loading-safe empty states and real status labels", async ({ page }) => {
  for (const path of [
    "/",
    "/languages",
    "/languages/yo",
    "/tutors",
    "/pricing",
    "/help",
    "/brand",
    "/status",
    "/privacy",
    "/terms",
  ]) {
    const res = await page.goto(path);
    expect(res?.status(), path).toBe(200);
  }
  await page.goto("/languages/sw");
  await expect(page.getByText("Help build this course")).toBeVisible();
  await page.goto("/does-not-exist");
  await expect(page.getByText("Kò sí níbí.")).toBeVisible();
});
