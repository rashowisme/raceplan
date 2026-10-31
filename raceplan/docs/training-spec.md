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
4. If neither: no pace targets. Use **effort-based** workouts (RPE + talk-test descriptions) and schedule an optional time trial (e.g. 3 km or 5 km) in week 2. Until the user enters the result, show effort only. Once they do, paces are computed from it (converted with Riegel, aged like a PR); weeks already started stay unchanged and later weeks are rebuilt with paces.
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
6. Long run ≤ 33% of weekly volume (≤ 40% when weekly volume < 30 km; raised from 30% by the owner on 2026-10-31), increase ≤ 2 km (or 15 min) per week.
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

## 13. Adaptation (approved by the owner on 2026-10-31)

The runner can log what actually happened; the plan then adapts the coming days. Same principle as everywhere else: **when in doubt, do less**. Adaptation never adds volume or intensity to make up for missed training.

### 13.1 What the runner logs

- **Per workout** (only for today or past days): `done`, `missed`, or `done, felt hard`.
- **Check-in** (any time): `tired or sore`, `pain / niggle`, `sick`, `injured — can't run`, and later `I'm back`.
- **Unmarked past workouts count as done as planned.** Adaptation only reacts to what the runner tells us (otherwise runners who never tick would see their plan shrink forever). The UI says so.
- Distances are the planned ones (no editing actual km in this version).

### 13.2 Principles

1. **Only the future changes.** Logged days are never altered. Week-level changes start on the **next Monday**; check-ins about pain, sickness or injury also change the **rest of the current week**.
2. **The ramp is measured against what was actually run.** A week with ≥ 20% missed is not a step up: like a cutback week, it is never the reference for §7.2, so the next week can't go above the last fully done week (weeks with < 20% missed count as done as planned, see 13.3). The adapted plan never goes above the original plan for any week (volume and long run).
3. **No catching up.** Missed sessions are never rescheduled or added to later weeks; missed quality sessions are simply dropped.
4. **All §7 invariants still hold** on the adapted plan (checked by `checkPlan`, property-tested), using done volume for past weeks.
5. **The taper is never removed or increased.** Missed runs in the taper aren't replaced.
6. **Paces only change with new results** (time trial, race), except after long breaks (13.4).
7. **Every adaptation shows a note with the reason** (structured message, translated in the UI).
8. **Deterministic:** the adapted plan depends only on the original plan, the log and `today`.

### 13.3 Missed training (week by week)

Missed share = missed planned distance ÷ planned distance of the week.

| Missed share of the week | Next week |
|---|---|
| < 20% | No change. |
| 20–50% | Hold: same volume as the last fully done level (no increase), quality sessions as planned. |
| > 50% | Treat as a break of 7 days (13.4). |

Two weeks in a row with ≥ 20% missed → the next week is a cutback week (the following cutback is rescheduled from there).

### 13.4 Breaks (whole days not run, incl. sickness and injury)

Counted from the last run done before the missed sessions to the last missed session (the first run back isn't known in advance).

| Break | Restart |
|---|---|
| ≤ 7 days | First 2 runs easy, then continue at the last done weekly level (no increase in the first week back). |
| 8–14 days | First week back at 75% of the last done level, easy running + strides only, then normal ramp (§7.2). |
| 15–28 days | First week at 50%, two weeks without quality sessions, then normal ramp. Paces slowed by 3%. |
| > 28 days | The runner is asked to update their answers and get a new plan (warning `long_break`; current volume has changed). Until they do, the 15–28 days restart applies. |

If the remaining weeks can't reach the original peak with the normal ramp, the peak is lower (never compressed ramps) and, when there is a target time, warning `goal_reassess`.

### 13.5 Fatigue and pain

- **Felt hard ≥ 2 times in a week, or a `tired or sore` check-in** → next week: no volume increase and one quality session becomes an easy run. If it happens two weeks in a row → bring the cutback week forward to the next week.
- **`pain / niggle`** → for the next 7 days: easy running only, volume −20% vs the plan, note: stop if the pain changes how you run, see a health professional if it persists > 1 week.
- **`sick`** → no running is scheduled until `I'm back`; note: don't run with a fever or chest symptoms. Then 13.4.
- **`injured — can't run`** → plan paused (like refusal `currently_injured`: advice to see a health professional). `I'm back` → 13.4.

### 13.6 Out of scope for this version

Editing actual distances, importing runs from a watch, adapting to heart rate or sleep, moving workouts to other days (planned separately).
