import { writeFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { generatePlan } from "@/engine";
import { addDays } from "@/engine/dates";
import { serializeBackup } from "@/storage/backup";
import { RUNNER_FIXTURES } from "../fixtures/runners";

/** Local calendar date, like the app's "today". */
function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

test("load a backup, log missed runs, and the next week adapts", async ({ page }, testInfo) => {
  // A plan generated 5 weeks ago, so weeks 1–2 are in the past.
  const today = localToday();
  const base = RUNNER_FIXTURES.experiencedMarathon!;
  const r = generatePlan(
    { ...base, race: { ...base.race, date: addDays(today, 100) } },
    { today: addDays(today, -35) },
  );
  if (!r.ok) throw new Error(r.refusal.code);
  const file = testInfo.outputPath("backup.json");
  writeFileSync(file, serializeBackup(r.plan, new Date().toISOString()));

  await page.goto("/en/plan");
  await page.locator('input[type="file"]').setInputFiles(file);
  await expect(page.getByRole("heading", { name: "Your training plan" })).toBeVisible();
  await expect(page.locator("#week-3")).not.toContainText("Adapted to your log");

  // Miss every run of week 2.
  const runs = page.locator("#week-2 button");
  const count = await runs.count();
  expect(count).toBeGreaterThan(2);
  const dialog = page.getByRole("dialog");
  for (let i = 0; i < count; i++) {
    await runs.nth(i).click();
    await dialog.getByRole("button", { name: "Missed" }).click();
    await expect(dialog.getByRole("button", { name: "Missed" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  }
  await expect(page.locator("#week-3")).toContainText("Adapted to your log");
  await expect(page.locator("#week-3")).toContainText(/days off/);
  await expect(runs.first()).toHaveAccessibleName(/\(missed\)$/);

  // Kept after a reload, and saved in the backup file.
  await page.reload();
  await expect(page.locator("#week-3")).toContainText("Adapted to your log");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save a backup" }).click();
  expect((await download).suggestedFilename()).toMatch(/^raceplan-marathon-.*-backup\.json$/);

  // Future workouts can't be logged.
  await page.locator("#week-6 button").first().click();
  await expect(dialog.getByRole("button", { name: "Missed" })).toHaveCount(0);
});

test("an invalid backup file is refused", async ({ page }, testInfo) => {
  const file = testInfo.outputPath("bad.json");
  writeFileSync(file, '{"hello":"world"}');
  await page.goto("/en/plan");
  await page.locator('input[type="file"]').setInputFiles(file);
  await expect(page.getByText("This file isn't a valid RacePlan backup.")).toBeVisible();
});
