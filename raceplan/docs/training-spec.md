# Training spec — plan engine

Authoritative description of how plans are generated. Target users are **amateurs**, so when in doubt, choose the **safer** option. Numbers here are starting defaults; put them in a single config object (`src/engine/config.ts`) so they can be tuned without touching logic.

---

## 1. Inputs (RunnerProfile)

| Field | Required | Notes |
|---|---|---|
| Race type | yes | `5k`, `10k`, `half`, `marathon`, `custom` (road distance), `trail` |
| Race distance | for custom/trail | km; trail also needs **elevation gain (D+)** in m |
| Race date | yes | must be in the future |
| Plan start date | no | default: next Monday (or today if Monday) |
| Personal record for the race distance | no | time + optional date achieved |
| Watch race prediction for the distance | no | time (e.g. from Garmin/Coros/Apple) |
| Target time | no | optional goal |
| Current weekly volume | yes | average km/week over the last 4 weeks (0 allowed) |
| Longest run in last 4 weeks | no | improves long-run starting point |
| Max weekly volume | yes | hard ceiling the plan must **never** exceed |
| Available days | yes | which weekdays they can run + preferred long-run day |
| Years of running | yes | `<1`, `1–3`, `3+` |
| Injuries | no | checklist: shin splints, plantar fasciitis, Achilles/calf, runner's knee, IT band, stress fracture (history), hamstring, ankle sprains, other — each with frequency: `once`, `occasionally`, `often`. Plus "currently injured" yes/no |
| Age | yes | 16–90 |
| Sex | optional | stored for future use; must not change plan structure in v1 |
| Plan style | yes | `balanced` (default), `vdot`, `polarized` (80/20) |
| Preferences | no | dislikes (multi-select): short intervals, long intervals, hills, track sessions, tempo runs. Likes: same list |

## 2. Experience level (derived)

- **Beginner:** years `<1`, or current volume < 15 km/week.
- **Intermediate:** years `1–3`, or default.
- **Experienced:** years `3+` and current volume ≥ 40 km/week.

**Risk flags** (make the plan more conservative, see §8): any injury marked `often`, ≥ 2 different injury types, stress fracture history, age ≥ 50.

## 3. Fitness estimate

Goal: a single fitness number (VDOT, Jack Daniels' formula) used to derive pace zones.

1. **PR** for the distance: if achieved < 12 months ago (or no date given) → full weight. 12–24 months → slow by 3%. > 24 months → slow by 6% and treat as low confidence.
2. **Watch prediction:** treat as optimistic → add 3% to the predicted time.
3. If both are present, use the **slower** (more conservative) of the two.
4. If neither: no pace targets. Use **effort-based** workouts (RPE + talk-test descriptions) and schedule an optional time trial (e.g. 3 km or 5 km) in week 2. Once the user enters the result (future feature), paces can be computed. In v1, show effort only.
5. Convert between distances with Riegel (`T2 = T1 × (D2/D1)^1.06`) when needed.
6. **Target time:** if the target implies a fitness gain > 5% (plans ≥ 12 weeks) or > 2% (shorter plans) over the current estimate → warning `goal_ambitious`; paces stay based on current fitness. Race-pace workouts use the target pace only if it's within those bounds, otherwise predicted race pace.

## 4. Pace zones

From VDOT (Daniels-style): **Easy (E), Marathon (M), Threshold (T), Interval (I), Repetition (R)**, each a pace range. The `polarized` method shows Z1/Z2/Z3 labels mapped onto the same paces. Always pair a zone with an effort description.

## 5. Plan length and phases

Weeks from plan start to race date (`n`).

| Distance | Minimum | Ideal |
|---|---|---|
| 5K | 6 | 8–10 |
| 10K | 8 | 10–12 |
| Half | 10 | 12–16 |
| Marathon | 12 (beginners: 16) | 16–20 |
| Trail / custom | interpolate by effort-km (see §10) | |

- `n` > 24 → the extra weeks become a "base maintenance" block (easy volume, strides, cutbacks) until 24 weeks out; the structured plan covers the last 24 weeks.
- `n` < minimum → compressed plan + warning `plan_too_short`. No volume jump is allowed to "catch up".
- `n` < 3 → "race-ready" mini plan (maintain current volume, short sharpening, taper) + warning.
- Phases (approx share of non-taper weeks): **Base 35% → Build 35% → Specific/Peak 30% → Taper**.

## 6. Weekly structure

- **Running days** = min(available days, cap by level: beginner 4, intermediate 5, experienced 6). Use the user's preferred long-run day.
- **≥ 1 full rest day every week** (beginners and risk-flagged runners: ≥ 2). Even if 7 days are available.
- **Quality sessions/week:** beginner 0 in the first 2 weeks (strides only), then 1. Intermediate 2. Experienced 2 (+ race-pace segments in long runs during Specific).
- Hard days (quality sessions and long runs with fast segments) are **never on consecutive days**.
- Intensity distribution: ≥ 75–80% of weekly running time at easy effort (polarized: ≥ 80% strictly).

## 7. Safety rules (invariants — must be property-tested)

1. Weekly volume **never exceeds** the user's max weekly volume.
2. Week-over-week increase ≤ **10%** (≤ **7%** if risk-flagged or beginner), with a small-number allowance of up to +3 km when volume < 30 km/week.
3. A **cutback week** every 4th week (every 3rd if risk-flagged or age ≥ 50): volume −20 to −25%, no new intensity.
4. ≥ 1 rest day per week (≥ 2 where required by §6).
5. No hard days back-to-back.
6. Long run ≤ 30% of weekly volume (≤ 40% when weekly volume < 30 km), increase ≤ 2 km (or 15 min) per week.
7. Long run caps: 5K 14 km, 10K 16 km, half 21 km, marathon 32 km, and **never > 3 h** of running.
8. Peak volume = min(user max, distance target for level, what the progression can safely reach).
9. Taper is always present (except `n` < 2).
10. Plan never starts above the runner's current volume (+ the allowed weekly increase).

Peak volume targets by level (km/week): 5K 25 / 35 / 50, 10K 30 / 45 / 60, half 35 / 50 / 70, marathon 45 / 65 / 90 (beginner / intermediate / experienced). If the user max is far below the minimum sensible target (e.g. marathon with max < 30 km/week) → warning `low_max_volume`.

## 8. Adjustments

- **Risk-flagged:** 7% ramp, cutback every 3rd week, max 1 quality session for the first 4 weeks, prefer hills/fartlek over track R-pace, add an "optional cross-training" suggestion on one easy day.
- **Specific injuries:** Achilles/calf → no steep hill sprints or R-pace in the first third. Shin splints / stress fracture → slower volume growth, note about softer surfaces. Knee / IT band → limit downhill work (trail), note about cadence. Plantar fasciitis → avoid adding hills and speed at the same time.
- **Currently injured:** do **not** generate a plan. Return refusal `currently_injured` with advice to see a health professional.
- **Age ≥ 50:** cutback every 3rd week, ≥ 2 easy/rest days after the long run before the next hard session. Age ≥ 65: max 1 quality session/week.
- **Age < 18:** cap volumes at intermediate targets, warning to involve a coach/parent.

## 9. Workout library

Every workout has: `type`, `tags` (for preferences), structured `steps`, estimated distance + duration, intensity (easy/moderate/hard), translation keys.

- Easy run, recovery run, long run, long run with progressive finish, long run with race-pace segments
- Strides (added to easy runs)
- Tempo / threshold: continuous, cruise intervals
- Intervals: short (200–400 m, tag `shortIntervals`), long (800–1600 m, tag `longIntervals`)
- Hills: short hill sprints, long hill repeats (tag `hills`)
- Fartlek (unstructured-feel but still structured steps)
- Race-pace session
- Track session tag `track` on interval sessions designed for a track
- Time trial (for runners without performance data)
- Race day

**Preferences:** a disliked tag is avoided by substituting a workout giving a similar stimulus (e.g. short intervals → fartlek or long intervals at I-pace; hills → tempo; track → road intervals by time). Never remove the stimulus entirely unless no substitute exists — then note it in warnings. Liked tags are favored when several options fit.

## 10. Trail and custom distance

- **Effort-km** = distance km + D+ / 100. Use effort-km for plan length, peak volume and long-run targets (interpolated between road distances).
- Trail long runs are prescribed by **time**, not distance; include weekly D+ progression toward the race's D+/km ratio, uphill repeats, power-hiking for steep races (> 50 m D+/km), and downhill practice in the Specific phase.
- Custom road distances interpolate between the nearest standard distances.
- **Not supported in v1:** effort-km > 60 or road distance > 42.2 km → refusal `distance_not_supported` (ultras are a future feature).

## 11. Taper

| Distance | Taper |
|---|---|
| 5K | 7 days |
| 10K | 7–10 days |
| Half | 10–14 days |
| Marathon | 14 days (beginner) – 21 days (experienced) |

Volume −20 to −30% per taper week; keep short sharp efforts at race pace; race week = 2–3 short easy runs + strides, rest or a shakeout the day before.

## 12. Output: warnings and refusals

Warnings (non-blocking, translated in UI): `plan_too_short`, `goal_ambitious`, `low_max_volume`, `few_days_available` (< 3 for half/marathon), `no_performance_data`, `old_pr`, `preference_unmet`, `minor_runner`, `risk_flagged`.

Refusals (no plan): `currently_injured`, `race_in_past`, `distance_not_supported`, `invalid_input`.

Every plan shows a disclaimer: general guidance, not medical advice; see a doctor before starting if they have health concerns; stop and rest if pain persists.
