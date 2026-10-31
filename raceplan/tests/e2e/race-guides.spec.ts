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

test("race guides: hub in French, nothing in English", async ({ page }) => {
  await page.goto("/fr");
  await page.getByRole("link", { name: "Plans pour les grandes courses" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Plans d'entraînement pour les grandes courses",
  );
  await expect(page.getByRole("link", { name: /Marathon de Paris/ })).toBeVisible();

  const en = await page.goto("/en/plan-entrainement/marathon-de-paris");
  expect(en?.status()).toBe(404);
  const hub = await page.goto("/en/plan-entrainement");
  expect(hub?.status()).toBe(404);
  await page.goto("/en");
  await expect(page.getByRole("link", { name: "Plans for major races" })).toHaveCount(0);

  const sitemap = await (await page.request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/fr/plan-entrainement/marathon-de-paris");
});
