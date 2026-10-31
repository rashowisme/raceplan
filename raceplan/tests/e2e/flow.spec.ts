import { expect, test, type Page } from "@playwright/test";

/** A race date ~12 weeks from today (computed at runtime, local calendar). */
function futureDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function fillForm(page: Page) {
  await page.goto("/en/plan/new");
  const next = page.getByRole("button", { name: "Continue" });

  // 1. Race
  await page.getByText("10K", { exact: true }).click();
  await page.getByLabel("Race date").fill(futureDate(84));
  await next.click();

  // 2. Fitness
  await expect(page.getByRole("heading", { name: "Your fitness" })).toBeVisible();
  await page.getByLabel(/Personal record/).fill("52:30");
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
