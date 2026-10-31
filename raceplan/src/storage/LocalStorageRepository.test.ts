import { describe, expect, it } from "vitest";
import { generatePlan } from "@/engine";
import { FIXTURE_TODAY, RUNNER_FIXTURES } from "../../tests/fixtures/runners";
import { LocalStorageRepository, type KeyValueStorage } from "./LocalStorageRepository";

function memoryStorage(): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
  };
}

const plan = (() => {
  const r = generatePlan(RUNNER_FIXTURES.beginner5k, { today: FIXTURE_TODAY });
  if (!r.ok) throw new Error();
  return r.plan;
})();

describe("LocalStorageRepository", () => {
  it("saves, lists, loads and deletes plans", async () => {
    let t = 0;
    let n = 0;
    const repo = new LocalStorageRepository(
      memoryStorage(),
      () => `2026-10-31T10:00:0${t++}Z`,
      () => `id${n++}`,
    );
    const a = await repo.save(plan);
    const b = await repo.save(plan);
    expect((await repo.list()).map((p) => p.id)).toEqual([b.id, a.id]);
    expect((await repo.load(a.id))?.plan).toEqual(plan);
    await repo.delete(a.id);
    expect((await repo.list()).map((p) => p.id)).toEqual([b.id]);
  });

  it("overwrites a plan saved with the same id", async () => {
    const repo = new LocalStorageRepository(memoryStorage());
    await repo.save(plan, "x");
    await repo.save(plan, "x");
    expect(await repo.list()).toHaveLength(1);
  });

  it("ignores corrupted data and unknown schema versions", async () => {
    const storage = memoryStorage();
    storage.setItem("raceplan.plans.v1", "{not json");
    const repo = new LocalStorageRepository(storage);
    expect(await repo.list()).toEqual([]);
    storage.setItem(
      "raceplan.plans.v1",
      JSON.stringify({
        version: 1,
        plans: [{ id: "a", savedAt: "x", plan: { schemaVersion: 99 } }],
      }),
    );
    expect(await repo.list()).toEqual([]);
  });
});
