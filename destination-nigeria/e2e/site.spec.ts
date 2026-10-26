import { expect, type Page, test } from "@playwright/test";

// Each test is a distinct client, so the forms rate limiter (per IP) doesn't couple tests together.
test.beforeEach(async ({ page }, info) => {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${(info.testId.charCodeAt(0) + info.repeatEachIndex * 7 + info.retry * 13 + Math.floor(Math.random() * 200)) % 254}` });
});

const skipWelcome = async (page: Page) => page.addInitScript(() => localStorage.setItem("dn:welcomed", "1"));

test.describe("home and welcome", () => {
  test("first visit shows the welcome; entering without sound keeps sound off", async ({ page }) => {
    await page.goto("/");
    const dialog = page.getByRole("dialog", { name: /a nation of extraordinary experiences/i });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Enter without sound" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("heading", { level: 1, name: /Nigeria Is More Than You Imagine/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Welcome sound" })).toHaveAttribute("aria-pressed", "false");
    expect(await page.evaluate(() => [localStorage.getItem("dn:welcomed"), localStorage.getItem("dn:sound")])).toEqual(["1", "off"]);
    await page.reload();
    await expect(page.getByRole("dialog", { name: /a nation of extraordinary experiences/i })).toBeHidden();
  });

  test("the welcome sound plays only after an explicit choice, never on load", async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __plays: string[] };
      w.__plays = [];
      const orig = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () {
        w.__plays.push(this.currentSrc || this.src);
        return orig.call(this).catch(() => undefined);
      };
    });
    await page.goto("/");
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => (window as unknown as { __plays: string[] }).__plays)).toEqual([]);
    await page.getByRole("button", { name: "Enter with sound" }).click();
    await expect.poll(() => page.evaluate(() => (window as unknown as { __plays: string[] }).__plays.length)).toBe(1);
    expect(await page.evaluate(() => (window as unknown as { __plays: string[] }).__plays[0])).toMatch(/\/audio\/welcome\.(ogg|mp3)$/);
    // Saved preference is "on", but reloading and navigating must not auto-play.
    await page.reload();
    await page.goto("/about");
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => (window as unknown as { __plays: string[] }).__plays)).toEqual([]);
    await expect(page.getByRole("button", { name: "Welcome sound" })).toHaveAttribute("aria-pressed", "true");
  });

  test("Escape dismisses the welcome without sound", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("dialog.welcome:modal")).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Enter with sound" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: /a nation of extraordinary experiences/i })).toBeHidden();
    expect(await page.evaluate(() => localStorage.getItem("dn:sound"))).toBe("off");
  });

  test("sound toggle is a pressed/unpressed button that persists", async ({ page }) => {
    await skipWelcome(page);
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Welcome sound" });
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await page.goto("/about");
    await expect(page.getByRole("button", { name: "Welcome sound" })).toHaveAttribute("aria-pressed", "true");
  });

  test("hero film can be paused and scenes chosen", async ({ page }) => {
    await skipWelcome(page);
    await page.goto("/");
    const pause = page.getByRole("button", { name: "Pause background film" });
    await pause.click();
    await expect(page.getByRole("button", { name: "Play background film" })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: /Scene 3: Forest waterfalls/ }).click();
    await expect(page.locator(".hero-scene.is-active")).toHaveCount(1);
    await page.getByRole("button", { name: "Describe film" }).click();
    await expect(page.locator("#hero-transcript")).toContainText("waterfall");
  });

  test("reduced motion starts the film paused", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await skipWelcome(page);
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Play background film" })).toBeVisible();
    await ctx.close();
  });

  test("hero search sends filters to the explorer", async ({ page }) => {
    await skipWelcome(page);
    await page.goto("/");
    await page.getByLabel("Place, state or idea").fill("waterfall");
    await page.getByRole("button", { name: /Show destinations/ }).click();
    await expect(page).toHaveURL(/\/destinations\?q=waterfall/);
    await expect(page.getByRole("heading", { name: "Erin-Ijesha Waterfalls" })).toBeVisible();
  });
});

test.describe("destination discovery", () => {
  test.beforeEach(async ({ page }) => skipWelcome(page));

  test("category chips and region filters narrow results and update the URL", async ({ page }) => {
    await page.goto("/destinations");
    await expect(page.getByText("31 destinations", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Festivals & events" }).click();
    await expect(page).toHaveURL(/cat=festivals-events/);
    await expect(page.getByRole("button", { name: "Festivals & events" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("heading", { name: "Argungu fishing festival" })).toBeVisible();
    await page.getByLabel("Region").selectOption("south-south");
    await expect(page).toHaveURL(/zone=south-south/);
    await expect(page.getByRole("heading", { name: /Calabar Carnival/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Argungu fishing festival" })).toHaveCount(0);
  });

  test("an impossible search shows a helpful empty state that clears", async ({ page }) => {
    await page.goto("/destinations?q=qqqzzz");
    await expect(page.getByText("Nothing matches those filters yet.")).toBeVisible();
    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(page.getByText("31 destinations", { exact: true })).toBeVisible();
  });

  test("destination page shows sources, advice and structured data", async ({ page }) => {
    await page.goto("/destinations/osun-osogbo-sacred-grove");
    await expect(page.getByRole("heading", { level: 1, name: "Osun-Osogbo Sacred Grove" })).toBeVisible();
    await expect(page.getByText("Reference content · awaiting state verification")).toBeVisible();
    await expect(page.getByRole("link", { name: /UNESCO World Heritage Centre: Osun-Osogbo/ })).toHaveAttribute("href", "https://whc.unesco.org/en/list/1118/");
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(ld.some((t) => t.includes('"TouristAttraction"'))).toBe(true);
    expect(ld.some((t) => t.includes('"BreadcrumbList"'))).toBe(true);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/destinations\/osun-osogbo-sacred-grove$/);
  });
});

test.describe("map", () => {
  test.beforeEach(async ({ page }) => skipWelcome(page));

  test("click, keyboard and finder all select a state", async ({ page }) => {
    await page.goto("/states");
    await page.getByRole("button", { name: /^Lagos State, South West/ }).click();
    await expect(page.getByRole("heading", { level: 3, name: "Lagos State" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Lekki Conservation Centre/ }).first()).toBeVisible();

    const lagos = page.getByRole("button", { name: /^Lagos State, South West/ });
    await lagos.focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { level: 3, name: "Nasarawa State" })).toBeVisible();
    await expect(page.getByText(/Farin Ruwa Falls/).first()).toBeVisible();

    await page.getByLabel("Find a state").fill("Calabar");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { level: 3, name: "Cross River State" })).toBeVisible();
  });

  test("states without content say so honestly", async ({ page }) => {
    await page.goto("/states");
    await page.getByLabel("Find a state").fill("Borno");
    await page.getByRole("button", { name: "Borno", exact: true }).click();
    await expect(page.getByText(/Verified destinations for Borno are in preparation/)).toBeVisible();
    const res = await page.request.get("/states/borno");
    expect(res.status()).toBe(404);
  });
});

test.describe("shortlist and itinerary", () => {
  test.beforeEach(async ({ page }) => skipWelcome(page));

  test("save, reorder, adjust days, export and share", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/destinations/olumo-rock");
    await page.getByRole("button", { name: "Save Olumo Rock to trip shortlist" }).click();
    await page.goto("/destinations/zuma-rock");
    await page.getByRole("button", { name: "Save Zuma Rock to trip shortlist" }).click();
    await expect(page.getByRole("link", { name: "Trip shortlist, 2 saved" })).toBeVisible();

    await page.goto("/plan#itinerary");
    const stops = page.getByRole("list", { name: "Trip stops, in order" }).getByRole("listitem");
    await expect(stops).toHaveCount(2);
    await expect(stops.first()).toContainText("Olumo Rock");
    await page.getByRole("button", { name: "Move Zuma Rock earlier" }).click();
    await expect(stops.first()).toContainText("Zuma Rock");
    await page.getByLabel("Days").first().fill("3");
    await expect(page.getByRole("complementary", { name: "Plan summary and export" }).getByText("2 stops · 4 days")).toBeVisible();

    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download as text" }).click();
    const file = await download;
    expect(file.suggestedFilename()).toBe("destination-nigeria-trip-plan.txt");

    await page.getByRole("button", { name: "Copy shareable link" }).click();
    await expect(page.getByText("Link copied.")).toBeVisible();
    const link = await page.evaluate(() => navigator.clipboard.readText());
    expect(decodeURIComponent(link)).toContain("/plan?plan=zuma-rock~3,olumo-rock~1");
    expect(link.startsWith("http://localhost:3210/")).toBe(true);

    await page.getByRole("button", { name: "Remove Olumo Rock" }).click();
    await expect(stops).toHaveCount(1);
  });

  test("a shared plan can be imported", async ({ page }) => {
    await page.goto("/plan?plan=yankari-national-park~2,ibeno-beach~1#itinerary");
    await expect(page.getByText(/Someone shared a trip plan with you/)).toBeVisible();
    await page.getByRole("button", { name: "Replace my shortlist with this plan" }).click();
    await expect(page.getByRole("list", { name: "Trip stops, in order" }).getByRole("listitem")).toHaveCount(2);
  });
});

test.describe("forms", () => {
  test.beforeEach(async ({ page }) => skipWelcome(page));

  test("newsletter shows inline errors, then confirms only after delivery", async ({ page }) => {
    await page.goto("/national-tourism-week#register-interest");
    const form = page.locator("#register-interest form");
    await form.getByRole("button", { name: "Subscribe" }).click();
    await expect(form.getByText("Enter an email address in the format name@example.com.")).toBeVisible();
    await expect(form.getByLabel("Email address")).toHaveAttribute("aria-invalid", "true");
    await expect(form.getByLabel("Email address")).toBeFocused();
    await form.getByLabel("Email address").fill("visitor@example.com");
    await form.getByLabel("I am a…").selectOption("traveller");
    await form.getByRole("checkbox", { name: /I agree to receive/ }).check();
    await page.waitForTimeout(2600); // minimum human fill time
    await form.getByRole("button", { name: "Subscribe" }).click();
    await expect(form.getByText("You're subscribed.")).toBeVisible();
  });

  test("investment enquiry validates and submits", async ({ page }) => {
    await page.goto("/invest#enquiry");
    const form = page.locator("#enquiry form");
    await form.getByLabel("Your name").fill("Ada Obi");
    await form.getByLabel("Work email").fill("ada@example.com");
    await form.getByLabel("Organisation").fill("Example Capital");
    await form.getByLabel("Investor type").selectOption("fund");
    await form.getByLabel("What would you like to discuss?").fill("Too short");
    await form.getByRole("checkbox", { name: /I agree that Destination Nigeria/ }).check();
    await form.getByRole("button", { name: "Send investment enquiry" }).click();
    await expect(form.getByText(/at least 20 characters/)).toBeVisible();
    await form.getByLabel("What would you like to discuss?").fill("We are interested in eco-tourism and hospitality projects in the South South.");
    await page.waitForTimeout(2600);
    await form.getByRole("button", { name: "Send investment enquiry" }).click();
    await expect(form.getByText("Enquiry sent.")).toBeVisible();
  });

  test("partnership form pre-selects the interest from the link", async ({ page }) => {
    await page.goto("/partners?interest=ntw#enquiry");
    await expect(page.getByLabel("I'd like to")).toHaveValue("ntw");
  });
});

test.describe("navigation, search and SEO plumbing", () => {
  test.beforeEach(async ({ page }) => skipWelcome(page));

  test("search dialog opens with / and finds a destination", async ({ page }) => {
    await page.goto("/about");
    await page.keyboard.press("/");
    const dialog = page.getByRole("dialog", { name: "Search Destination Nigeria" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("searchbox").fill("yankari");
    await dialog.getByRole("link", { name: /^Destination Yankari National Park/ }).click();
    await expect(page).toHaveURL(/\/destinations\/yankari-national-park/);
  });

  test("search results page works without JavaScript-driven UI and is noindex", async ({ page }) => {
    const res = await page.goto("/search?q=heritage");
    expect(res?.headers()["x-robots-tag"]).toContain("noindex");
    await expect(page.locator("main").getByRole("status")).toContainText("result");
  });

  test("skip link moves focus to main content", async ({ page }) => {
    await page.goto("/about");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main$/);
  });

  test("sitemap, robots, manifest and 404", async ({ request }) => {
    const sm = await (await request.get("/sitemap.xml")).text();
    expect(sm).toContain("/destinations/osun-osogbo-sacred-grove");
    expect(sm).toContain("/stories/planning-a-first-trip-to-nigeria");
    expect(sm).not.toContain("/search");
    expect(sm).not.toContain("/states/borno");
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toMatch(/Disallow: \/api\//);
    expect(robots).toMatch(/Sitemap: .*sitemap\.xml/);
    expect((await request.get("/manifest.webmanifest")).ok()).toBe(true);
    expect((await request.get("/no-such-page")).status()).toBe(404);
    expect((await request.get("/destinations/not-real")).status()).toBe(404);
    const redirect = await request.get("/visit", { maxRedirects: 0 });
    expect(redirect.status()).toBe(308);
  });

  test("every primary page has one h1, a title and a meta description", async ({ page }) => {
    for (const path of ["/", "/discover", "/destinations", "/experiences", "/plan", "/invest", "/national-tourism-week", "/about", "/stories", "/offers", "/partners", "/states"]) {
      await page.goto(path);
      await expect(page.locator("h1"), path).toHaveCount(1);
      expect((await page.title()).length, path).toBeGreaterThan(10);
      await expect(page.locator('meta[name="description"]'), path).toHaveAttribute("content", /.{60,}/);
    }
  });

  test("no console errors on key pages", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(m.text());
    });
    for (const path of ["/", "/destinations/kano-old-city", "/plan", "/invest", "/stories/nigerias-highlands", "/states"]) {
      await page.goto(path);
      await page.waitForLoadState("load");
    }
    expect(errors).toEqual([]);
  });
});
