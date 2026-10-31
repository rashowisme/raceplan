/**
 * fast-check generators for valid runner profiles (+ a matching "today").
 */
import fc from "fast-check";
import { addDays } from "@/engine/dates";
import {
  INJURY_FREQUENCIES,
  INJURY_TYPES,
  PLAN_STYLES,
  PREFERENCE_TAGS,
  WEEKDAYS,
  YEARS_RUNNING,
  type RaceInfo,
  type RunnerProfile,
} from "@/engine/types";

const KM = 1000;

const raceArb = (raceDate: string): fc.Arbitrary<RaceInfo> =>
  fc.oneof(
    fc
      .constantFrom("5k", "10k", "half", "marathon")
      .map((type) => ({ type, date: raceDate }) as RaceInfo),
    fc
      .integer({ min: 3, max: 42 })
      .map((km) => ({ type: "custom", distanceM: km * KM, date: raceDate }) as RaceInfo),
    fc
      .record({ km: fc.integer({ min: 8, max: 50 }), gain: fc.integer({ min: 0, max: 2500 }) })
      .map(
        ({ km, gain }) =>
          ({ type: "trail", distanceM: km * KM, elevationGainM: gain, date: raceDate }) as RaceInfo,
      ),
  );

const distanceOf = (r: RaceInfo) =>
  r.type === "5k"
    ? 5000
    : r.type === "10k"
      ? 10_000
      : r.type === "half"
        ? 21_097.5
        : r.type === "marathon"
          ? 42_195
          : r.distanceM!;

/** Time at a pace (s/km) between 3:10 and 8:30/km for the (effort) distance. */
const timeArb = (r: RaceInfo) => {
  const effortKm = (distanceOf(r) + (r.elevationGainM ?? 0) * 10) / KM;
  return fc.integer({ min: 190, max: 510 }).map((pace) => Math.round(pace * effortKm));
};

export const todayArb = fc.integer({ min: 0, max: 900 }).map((d) => addDays("2026-01-01", d));

export const scenarioArb: fc.Arbitrary<{ today: string; profile: RunnerProfile }> = todayArb.chain(
  (today) =>
    fc.integer({ min: 1, max: 300 }).chain((daysToRace) => {
      const raceDate = addDays(today, daysToRace);
      return raceArb(raceDate).chain((race) =>
        fc
          .record({
            startOffset: fc.option(fc.integer({ min: 0, max: Math.max(0, daysToRace - 1) }), {
              nil: undefined,
            }),
            currentKm: fc.integer({ min: 0, max: 120 }),
            maxKm: fc.integer({ min: 5, max: 150 }),
            longestShare: fc.option(fc.double({ min: 0, max: 0.6, noNaN: true }), {
              nil: undefined,
            }),
            days: fc.subarray([...WEEKDAYS], { minLength: 2 }),
            longIdx: fc.nat(),
            yearsRunning: fc.constantFrom(...YEARS_RUNNING),
            injuries: fc.uniqueArray(
              fc.record({
                type: fc.constantFrom(...INJURY_TYPES),
                frequency: fc.constantFrom(...INJURY_FREQUENCIES),
              }),
              { maxLength: 4, selector: (i) => i.type },
            ),
            age: fc.integer({ min: 16, max: 90 }),
            sex: fc.option(
              fc.constantFrom("female", "male", "other") as fc.Arbitrary<
                "female" | "male" | "other"
              >,
              {
                nil: undefined,
              },
            ),
            planStyle: fc.constantFrom(...PLAN_STYLES),
            prefs: fc.array(fc.constantFrom(...PREFERENCE_TAGS, null), { maxLength: 5 }),
            likesMask: fc.array(fc.boolean(), { minLength: 5, maxLength: 5 }),
            pr: fc.option(timeArb(race), { nil: undefined }),
            prAgeDays: fc.option(fc.integer({ min: 0, max: 1500 }), { nil: undefined }),
            watch: fc.option(timeArb(race), { nil: undefined }),
            target: fc.option(timeArb(race), { nil: undefined }),
          })
          .map((r) => {
            const tags = [
              ...new Set(r.prefs.filter((t): t is NonNullable<typeof t> => t !== null)),
            ];
            const likes = tags.filter((_, i) => r.likesMask[i]);
            const dislikes = tags.filter((t) => !likes.includes(t));
            const current = r.currentKm * KM;
            const profile: RunnerProfile = {
              race,
              currentWeeklyVolumeM: current,
              maxWeeklyVolumeM: r.maxKm * KM,
              availableDays: r.days,
              longRunDay: r.days[r.longIdx % r.days.length]!,
              yearsRunning: r.yearsRunning,
              injuries: r.injuries,
              currentlyInjured: false,
              age: r.age,
              planStyle: r.planStyle,
              preferences: { likes, dislikes },
            };
            if (r.startOffset !== undefined) profile.planStartDate = addDays(today, r.startOffset);
            if (r.longestShare !== undefined)
              profile.longestRecentRunM = Math.round(current * r.longestShare);
            if (r.sex) profile.sex = r.sex;
            if (r.pr !== undefined) {
              profile.personalRecord = { timeS: r.pr };
              if (r.prAgeDays !== undefined)
                profile.personalRecord.achievedOn = addDays(today, -r.prAgeDays);
            }
            if (r.watch !== undefined) profile.watchPrediction = { timeS: r.watch };
            if (r.target !== undefined) profile.targetTimeS = r.target;
            return { today, profile };
          }),
      );
    }),
);
