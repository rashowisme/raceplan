import { expect, test } from "@playwright/test";

test("race guide: content, structured data, and a pre-filled form", async ({ page }) => {
  await page.goto("/fr/plan-entrainement/marathon-de-paris");
  await expect(
    page.getByRole("heading", { level: 1, name: /Plan d'entraînement Marathon de Paris 2027/ }),
  ).toBeVisible();
  await expect(page.getByText("Page indépendante")).toBeVisible();
  await expect(page.locator("h3", { hasText: "Premier marathon" })).toBeVisible();
  await expect(page.locator("h3", { hasText: "Objectif 3 h 30" })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/fr\/plan-entrainement\/marathon-de-paris$/,
  );
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
  const types = ld.map((s) => JSON.parse(s)["@type"]);
  expect(types).toEqual(expect.arrayContaining(["BreadcrumbList", "FAQPage"]));

  // Nothing wider than the screen (the call to action wraps on phones).
  const tooWide = await page.evaluate(
    () =>
      [...document.querySelectorAll("article *")].filter(
        (el) => el.getBoundingClientRect().right > document.documentElement.clientWidth + 1,
      ).length,
  );
  expect(tooWide).toBe(0);

  await page
    .getByRole("link", { name: "Créer mon plan pour le Marathon de Paris" })
    .first()
    .click();
  await expect(page).toHaveURL(/\/fr\/plan\/new\?course=marathon-de-paris$/);
  await expect(page.getByRole("status")).toContainText("Course préremplie : Marathon de Paris");
  await expect(page.locator("#field-raceDate")).toHaveValue("2027-04-04");
});

test("English guide: miles, its own URL and a pre-filled form", async ({ page }) => {
  await page.goto("/en/training-plans/london-marathon");
  await expect(
    page.getByRole("heading", { level: 1, name: "London Marathon 2027 training plan" }),
  ).toBeVisible();
  await expect(page.getByText("Independent page")).toBeVisible();
  await expect(page.locator("figcaption", { hasText: "Miles per week" })).toHaveCount(3);
  await expect(page.locator("h3", { hasText: "First marathon" })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/en\/training-plans\/london-marathon$/,
  );
  const tooWide = await page.evaluate(
    () =>
      [...document.querySelectorAll("article *")].filter(
        (el) => el.getBoundingClientRect().right > document.documentElement.clientWidth + 1,
      ).length,
  );
  expect(tooWide).toBe(0);

  await page.getByRole("link", { name: "Create my plan for the London Marathon" }).first().click();
  await expect(page).toHaveURL(/\/en\/plan\/new\?course=london-marathon$/);
  await expect(page.getByRole("status")).toContainText("Race pre-filled: London Marathon");
  await expect(page.locator("#field-raceDate")).toHaveValue("2027-04-25");
});

test("race guides: one hub per language, each guide only in its own", async ({ page }) => {
  await page.goto("/fr");
  await page.getByRole("link", { name: "Plans pour les grandes courses" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Plans d'entraînement pour les grandes courses",
  );
  await expect(page.getByRole("link", { name: /Marathon de Paris/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /London Marathon/ })).toHaveCount(0);

  await page.goto("/en");
  await page.getByRole("link", { name: "Plans for major races" }).click();
  await expect(page).toHaveURL(/\/en\/training-plans$/);
  await expect(page.getByRole("link", { name: /London Marathon/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Marathon de Paris/ })).toHaveCount(0);

  for (const path of [
    "/en/plan-entrainement/marathon-de-paris",
    "/en/plan-entrainement",
    "/fr/training-plans/london-marathon",
    "/fr/training-plans",
    "/en/training-plans/marathon-de-paris",
    "/fr/plan-entrainement/london-marathon",
  ]) {
    const res = await page.goto(path);
    expect(res?.status(), path).toBe(404);
  }

  const sitemap = await (await page.request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/fr/plan-entrainement/marathon-de-paris");
  expect(sitemap).toContain("/en/training-plans/london-marathon");
});

test("every race guide renders with its title, samples and call to action", async ({ page }) => {
  test.skip(test.info().project.name === "mobile", "Content smoke test: desktop is enough");
  const hubs = [
    { hub: "/fr/plan-entrainement", h1: "Plan d'entraînement", cta: /^Créer mon plan pour/ },
    { hub: "/en/training-plans", h1: "training plan", cta: /^Create my plan for/ },
  ];
  for (const { hub, h1, cta } of hubs) {
    await page.goto(hub);
    const hrefs = await page
      .locator(`a[href^="${hub}/"]`)
      .evaluateAll((as) => as.map((a) => a.getAttribute("href")!));
    expect(hrefs.length).toBeGreaterThanOrEqual(10);
    for (const href of hrefs) {
      const res = await page.goto(href);
      expect(res?.status(), href).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(h1);
      await expect(page.locator("figure")).toHaveCount(3);
      await expect(page.getByRole("link", { name: cta }).first()).toBeVisible();
    }
  }
});
