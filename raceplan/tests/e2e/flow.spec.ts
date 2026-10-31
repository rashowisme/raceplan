import { expect, test, type Page } from "@playwright/test";

/** A race date ~12 weeks from today (computed at runtime, local calendar). */
function futureDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function fillForm(page: Page, { withRecord = true } = {}) {
  await page.goto("/en/plan/new");
  const next = page.getByRole("button", { name: "Continue" });

  // 1. Race
  await page.getByText("10K", { exact: true }).click();
  await page.getByLabel("Race date").fill(futureDate(84));
  await next.click();

  // 2. Fitness
  await expect(page.getByRole("heading", { name: "Your fitness" })).toBeVisible();
  if (withRecord) await page.getByLabel(/Personal record/).fill("52:30");
  await next.click();

  // 3. Training
  await expect(page.getByRole("heading", { name: "Your training" })).toBeVisible();
  await page.getByLabel(/Current weekly distance/).fill("25");
  await page.getByLabel(/Maximum weekly distance/).fill("40");
  await page.getByText("1 to 3 years", { exact: true }).click();
  for (const day of ["Tue", "Thu", "Sat", "Sun"])
    await page.getByText(day, { exact: true }).click();
  await page.getByLabel("Preferred long run day").selectOption("sun");
  await next.click();

  // 4. About you
  await expect(page.getByRole("heading", { name: "About you" })).toBeVisible();
  await page.getByLabel("Age", { exact: true }).fill("35");
  await next.click();

  // 5. Style
  await expect(page.getByRole("heading", { name: "Plan style" })).toBeVisible();
  await page.getByRole("button", { name: "Generate my plan" }).click();
  await page.waitForURL(/\/en\/plan$/);
}

test.describe("full flow", () => {
  test("form → plan → workout details → PDF", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));

    await fillForm(page);
    await expect(page.getByRole("heading", { name: "Your training plan" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Week 1", exact: true })).toBeVisible();
    await expect(page.getByText(/general guidance, not medical advice/).first()).toBeVisible();

    // Tap a quality session.
    await page
      .locator("#week-4 button, #week-5 button")
      .filter({ hasText: /Tempo|Fartlek|intervals|Hill/ })
      .first()
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Workout structure")).toBeVisible();
    await expect(dialog.getByText("Warm-up", { exact: false }).first()).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();

    // PDF download.
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export PDF" }).click();
    const file = await download;
    expect(file.suggestedFilename()).toMatch(/^raceplan-10k-\d{4}-\d{2}-\d{2}\.pdf$/);
    const path = await file.path();
    const { statSync } = await import("node:fs");
    expect(statSync(path).size).toBeGreaterThan(5_000);

    expect(errors).toEqual([]);
  });

  test("plan survives a reload and follows the km/mi toggle and language", async ({ page }) => {
    await fillForm(page);
    await expect(page.getByText(/\/km/).first()).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: "Week 1", exact: true })).toBeVisible();

    await page.getByRole("button", { name: "mi", exact: true }).click();
    await expect(page.getByText(/\/mi/).first()).toBeVisible();
    await expect(page.getByText(/\/km/)).toHaveCount(0);

    await page.getByRole("button", { name: "fr", exact: true }).click();
    await page.waitForURL(/\/fr\/plan$/);
    await expect(page.getByRole("heading", { name: "Votre plan d'entraînement" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Semaine 1", exact: true })).toBeVisible();
  });
});

test("currently injured runners are blocked", async ({ page }) => {
  await page.goto("/en/plan/new");
  await page.evaluate((date) => {
    localStorage.setItem(
      "raceplan.formDraft.v1",
      JSON.stringify({
        values: { raceType: "5k", raceDate: date, age: "40" },
        unit: "km",
        step: 3,
      }),
    );
  }, futureDate(60));
  await page.reload();
  await page.getByLabel(/currently injured/).check();
  await expect(page.getByText(/don't start a training plan while injured/)).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("We can't create a plan while you're injured.")).toBeVisible();
});

test("empty plan page invites to create one; root redirects to a locale", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/(en|fr)$/);
  await page.goto("/en/plan");
  await expect(page.getByRole("link", { name: "Create a plan" })).toBeVisible();
});

test("no horizontal scrolling at 360px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  for (const path of ["/en", "/fr/plan/new"]) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});

test("theme toggle switches to dark, persists, and follows the OS by default", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/en");
  const html = page.locator("html");
  await expect(html).not.toHaveClass(/\bdark\b/);

  await page.getByRole("button", { name: /^Theme: system/ }).click();
  await page.getByRole("button", { name: /^Theme: light/ }).click();
  await expect(html).toHaveClass(/\bdark\b/);

  // Applied before hydration on reload (no light flash).
  await page.reload({ waitUntil: "commit" });
  await page.waitForSelector("html.dark", { state: "attached" });
  await expect(page.getByRole("button", { name: /^Theme: dark/ })).toBeVisible();

  // Back to system: follows the OS preference.
  await page.getByRole("button", { name: /^Theme: dark/ }).click();
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(html).toHaveClass(/\bdark\b/);
  await page.emulateMedia({ colorScheme: "light" });
  await expect(html).not.toHaveClass(/\bdark\b/);
});

test("time trial result turns an effort-only plan into a paced plan", async ({ page }) => {
  await fillForm(page, { withRecord: false });
  await expect(page.getByRole("heading", { name: "Ran your time trial?" })).toBeVisible();
  await expect(page.getByText(/\/km/)).toHaveCount(0);

  // From the time trial workout dialog.
  await page
    .getByRole("button", { name: /Time trial/ })
    .first()
    .click();
  await page.getByRole("button", { name: "Enter my result" }).click();
  const time = page.getByLabel("Time (3 km)");
  await expect(time).toBeFocused();

  await time.fill("9:99");
  await page.getByRole("button", { name: "Update my paces" }).click();
  await expect(page.getByText("Enter a time like 15:30.")).toBeVisible();

  await time.fill("15:00");
  await page.getByRole("button", { name: "Update my paces" }).click();
  await expect(page.getByText(/Paces from your time trial: 3 km in 15:00/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ran your time trial?" })).toHaveCount(0);
  await expect(page.getByText(/\/km/).first()).toBeVisible();

  // Persisted.
  await page.reload();
  await expect(page.getByText(/Paces from your time trial/)).toBeVisible();
});

test("search engines get canonical URLs, hreflang, previews, robots and a sitemap", async ({
  page,
  request,
}) => {
  await page.goto("/fr");
  const head = page.locator("head");
  await expect(head.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/fr$/);
  await expect(head.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
    "href",
    /\/en$/,
  );
  await expect(head.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveCount(1);
  await expect(head.locator('meta[property="og:locale"]')).toHaveAttribute("content", "fr_FR");
  const ogImage = await head.locator('meta[property="og:image"]').getAttribute("content");
  expect(ogImage).toBeTruthy();
  const image = await request.get(new URL(ogImage!).pathname);
  expect(image.headers()["content-type"]).toBe("image/png");

  const ld = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ?? "{}",
  );
  expect(ld["@type"]).toBe("WebApplication");
  expect(ld.inLanguage).toBe("fr");

  // The personal plan page stays out of search results.
  await page.goto("/en/plan");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);

  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toMatch(/Sitemap: .*\/sitemap\.xml/);
  const sitemap = await (await request.get("/sitemap.xml")).text();
  for (const path of ["/en</loc>", "/fr</loc>", "/en/plan/new</loc>", "/fr/plan/new</loc>"])
    expect(sitemap).toContain(path);
  expect((await request.get("/apple-icon")).headers()["content-type"]).toBe("image/png");
});
