/** Watch export: FIT workout files and the ZIP archive. */
import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";
import { generatePlan } from "@/engine";
import type { SimpleStep, TrainingPlan, WorkoutStep } from "@/engine/types";
import { encodeString, fitCrc } from "@/features/export/fit/encoder";
import {
  dayToFit,
  planToWatchArchive,
  watchFileName,
  watchWorkoutName,
} from "@/features/export/fit/plan";
import { fitStepCount } from "@/features/export/fit/workout";
import { crc32 } from "@/features/export/fit/zip";
import type { Formatter, Translate } from "@/features/plan-calendar/format";
import en from "../../messages/en.json";
import fr from "../../messages/fr.json";
import { FIXTURE_TODAY, RUNNER_FIXTURES } from "../fixtures/runners";
import { decodeFit } from "./fit-decode";

const make = (locale: "en" | "fr"): Formatter => ({
  t: createTranslator({ locale, messages: locale === "en" ? en : fr }) as unknown as Translate,
  locale,
  unit: "km",
  zoneLabels: "daniels",
});

const plans: [string, TrainingPlan][] = Object.entries(RUNNER_FIXTURES).flatMap(([name, p]) => {
  const r = generatePlan(p, { today: FIXTURE_TODAY });
  return r.ok ? [[name, r.plan] as [string, TrainingPlan]] : [];
});
const planNamed = (name: string) => plans.find(([n]) => n === name)![1];

const bytesOf = (s: string) => new TextEncoder().encode(s);

describe("checksums and strings", () => {
  it("FIT CRC is CRC-16/ARC; ZIP uses CRC-32", () => {
    expect(fitCrc(bytesOf("123456789"))).toBe(0xbb3d);
    expect(crc32(bytesOf("123456789"))).toBe(0xcbf43926);
  });

  it("strings are null-terminated and cut on a character boundary", () => {
    expect([...encodeString("ab", 8)]).toEqual([0x61, 0x62, 0]);
    // "é" is 2 bytes and doesn't fit: it is dropped whole.
    expect([...encodeString("aé", 3)]).toEqual([0x61, 0]);
  });
});

type Expected = SimpleStep | { repeatOf: number; count: number };

/** Expected FIT steps from the engine's steps (repeats flattened FIT-style). */
function expected(steps: readonly WorkoutStep[]): Expected[] {
  const out: Expected[] = [];
  for (const s of steps) {
    if (s.kind !== "repeat") out.push(s);
    else {
      const first = out.length;
      out.push(...s.steps, { repeatOf: first, count: s.count });
    }
  }
  return out;
}

describe("FIT workout files", () => {
  const f = make("en");

  it.each(plans)("%s: every workout decodes and matches the plan", (_name, plan) => {
    for (const week of plan.weeks) {
      for (const day of week.days) {
        const w = day.workout;
        if (!w) continue;
        const msgs = decodeFit(dayToFit(f, plan, week, day));
        const by = (g: number) => msgs.filter((m) => m.global === g);

        const [fileId] = by(0);
        expect(fileId!.fields[0]).toBe(5); // workout file
        const [workout] = by(26);
        expect(workout!.fields[4]).toBe(1); // running
        expect(workout!.fields[11]).toBe(plan.profile.race.type === "trail" ? 3 : 0);
        expect(workout!.fields[8]).toBe(watchWorkoutName(f, week, day));

        const steps = by(27);
        const want = expected(w.steps);
        expect(steps).toHaveLength(fitStepCount(w.steps));
        expect(workout!.fields[6]).toBe(steps.length);
        steps.forEach((m, i) => {
          const s = want[i]!;
          expect(m.fields[254]).toBe(i);
          if ("repeatOf" in s) {
            expect(m.fields[1]).toBe(6); // repeat until steps complete
            expect(m.fields[2]).toBe(s.repeatOf);
            expect(m.fields[4]).toBe(s.count);
            return;
          }
          if (s.duration.type === "time") {
            expect(m.fields[1]).toBe(0);
            expect(m.fields[2]).toBe(s.duration.seconds * 1000);
          } else {
            expect(m.fields[1]).toBe(1);
            expect(m.fields[2]).toBe(Math.round(s.duration.meters * 100));
          }
          if (s.target.pace) {
            expect(m.fields[3]).toBe(0); // speed
            const low = m.fields[5] as number;
            const high = m.fields[6] as number;
            expect(low).toBeLessThanOrEqual(high);
            expect(Math.abs(1e6 / low - s.target.pace.slowSPerKm)).toBeLessThan(1);
            expect(Math.abs(1e6 / high - s.target.pace.fastSPerKm)).toBeLessThan(1);
          } else {
            expect(m.fields[3]).toBe(2); // open
          }
          expect(String(m.fields[0])).toContain(f.t(`effort.${s.target.effort}.label`));
        });
      }
    }
  });

  it("effort-only plans export open targets only", () => {
    const plan = planNamed("noPerformanceData");
    for (const week of plan.weeks)
      for (const day of week.days) {
        if (!day.workout) continue;
        const steps = decodeFit(dayToFit(f, plan, week, day)).filter((m) => m.global === 27);
        expect(steps.every((m) => m.fields[3] !== 0)).toBe(true);
      }
  });

  it("names are translated and keep plan order", () => {
    const plan = plans[0]![1];
    const week = plan.weeks[4]!;
    const day = week.days.find((d) => d.workout)!;
    expect(watchWorkoutName(f, week, day)).toMatch(/^W05 \w{3} · /);
    expect(watchWorkoutName(make("fr"), week, day)).toMatch(/^S05 /);
    expect(watchFileName(week, day)).toBe(`w05-${day.date}-${day.workout!.type}.fit`);
  });

  it("is deterministic", () => {
    const plan = plans[1]![1];
    const week = plan.weeks[2]!;
    const day = week.days.find((d) => d.workout)!;
    expect(dayToFit(f, plan, week, day)).toEqual(dayToFit(f, plan, week, day));
  });
});

/** Reads the central directory of a stored ZIP and checks each entry's CRC. */
function readZip(bytes: Uint8Array): { name: string; data: Uint8Array }[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const eocd = bytes.length - 22;
  expect(view.getUint32(eocd, true)).toBe(0x06054b50);
  const count = view.getUint16(eocd + 10, true);
  let pos = view.getUint32(eocd + 16, true);
  const out: { name: string; data: Uint8Array }[] = [];
  for (let i = 0; i < count; i++) {
    expect(view.getUint32(pos, true)).toBe(0x02014b50);
    const crc = view.getUint32(pos + 16, true);
    const size = view.getUint32(pos + 20, true);
    const nameLen = view.getUint16(pos + 28, true);
    const local = view.getUint32(pos + 42, true);
    const name = new TextDecoder().decode(bytes.slice(pos + 46, pos + 46 + nameLen));
    expect(view.getUint32(local, true)).toBe(0x04034b50);
    const start = local + 30 + view.getUint16(local + 26, true);
    const data = bytes.slice(start, start + size);
    expect(crc32(data)).toBe(crc);
    out.push({ name, data });
    pos += 46 + nameLen;
  }
  return out;
}

describe("watch archive", () => {
  it("holds one valid FIT file per upcoming workout, in plan order", () => {
    const plan = planNamed("trail30k");
    const from = plan.weeks[3]!.startDate;
    const entries = readZip(planToWatchArchive(make("fr"), plan, from));
    const days = plan.weeks.flatMap((w) => w.days.filter((d) => d.workout && d.date >= from));
    expect(entries).toHaveLength(days.length);
    const names = entries.map((e) => e.name);
    expect(names).toEqual([...names].sort());
    for (const e of entries) expect(decodeFit(e.data).length).toBeGreaterThan(2);
  });
});
