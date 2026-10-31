/**
 * The ONLY place where unit conversion and number/pace formatting happens.
 * Engine values are metric: meters, seconds, seconds per km.
 */

export type DistanceUnit = "km" | "mi";
export const DISTANCE_UNITS: readonly DistanceUnit[] = ["km", "mi"];

export const METERS_PER_KM = 1000;
export const METERS_PER_MILE = 1609.344;
export const FEET_PER_METER = 3.280839895;

const metersPerUnit = (unit: DistanceUnit): number =>
  unit === "km" ? METERS_PER_KM : METERS_PER_MILE;

/** Meters → km or miles (unrounded). */
export function metersToUnit(meters: number, unit: DistanceUnit): number {
  return meters / metersPerUnit(unit);
}

/** km or miles → meters. */
export function unitToMeters(value: number, unit: DistanceUnit): number {
  return value * metersPerUnit(unit);
}

/** Seconds per km → seconds per unit. */
export function paceToUnit(secondsPerKm: number, unit: DistanceUnit): number {
  return unit === "km" ? secondsPerKm : secondsPerKm * (METERS_PER_MILE / METERS_PER_KM);
}

function formatNumber(value: number, locale: string, maxDecimals: number): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: maxDecimals,
    minimumFractionDigits: 0,
  }).format(value);
}

/** e.g. `12.5 km`, `7.8 mi`. */
export function formatDistance(
  meters: number,
  unit: DistanceUnit,
  locale: string,
  maxDecimals = 1,
): string {
  return `${formatNumber(metersToUnit(meters, unit), locale, maxDecimals)} ${unit}`;
}

/** Number only, for inputs and compact displays. */
export function formatDistanceValue(
  meters: number,
  unit: DistanceUnit,
  locale: string,
  maxDecimals = 1,
): string {
  return formatNumber(metersToUnit(meters, unit), locale, maxDecimals);
}

/** Short track distances (≤ 2 km) stay in meters regardless of unit, as runners expect. */
export function formatRepDistance(meters: number, unit: DistanceUnit, locale: string): string {
  if (meters < 2000 && Number.isInteger(meters)) return `${meters} m`;
  return formatDistance(meters, unit, locale, 2);
}

/** Elevation: meters for km, feet for miles. */
export function formatElevation(meters: number, unit: DistanceUnit, locale: string): string {
  return unit === "km"
    ? `${formatNumber(meters, locale, 0)} m`
    : `${formatNumber(meters * FEET_PER_METER, locale, 0)} ft`;
}

/** `m:ss`. */
function minSec(totalSeconds: number): string {
  const s = Math.round(totalSeconds);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

/** e.g. `5:30 /km`. */
export function formatPace(secondsPerKm: number, unit: DistanceUnit): string {
  return `${minSec(paceToUnit(secondsPerKm, unit))} /${unit}`;
}

/** e.g. `5:10–5:30 /km` (fast first). */
export function formatPaceRange(
  range: { fastSPerKm: number; slowSPerKm: number },
  unit: DistanceUnit,
): string {
  const fast = minSec(paceToUnit(range.fastSPerKm, unit));
  const slow = minSec(paceToUnit(range.slowSPerKm, unit));
  return fast === slow ? `${fast} /${unit}` : `${fast}–${slow} /${unit}`;
}

/** Race-style clock time: `h:mm:ss` or `m:ss`. */
export function formatClock(totalSeconds: number): string {
  const s = Math.round(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const ss = sec.toString().padStart(2, "0");
  return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

/** Workout durations: `45 min`, `1 h 30`, `20 s`. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.round(totalSeconds);
  if (s < 60) return `${s} s`;
  const totalMin = Math.round(s / 60);
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m === 0 ? `${h} h` : `${h} h ${m.toString().padStart(2, "0")}`;
}

/**
 * Parse `h:mm:ss`, `mm:ss` or plain minutes into seconds.
 * Returns `null` when the input is not a valid duration.
 */
export function parseClock(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === "") return null;
  if (/^\d+([.,]\d+)?$/.test(trimmed)) {
    const minutes = Number(trimmed.replace(",", "."));
    return minutes > 0 ? Math.round(minutes * 60) : null;
  }
  const parts = trimmed.split(":");
  if (parts.length < 2 || parts.length > 3) return null;
  if (!parts.every((p) => /^\d{1,2}$/.test(p) || (p === parts[0] && /^\d+$/.test(p)))) return null;
  const nums = parts.map(Number);
  // All but the first part must be < 60.
  if (nums.slice(1).some((n) => n >= 60)) return null;
  const seconds =
    nums.length === 3 ? nums[0]! * 3600 + nums[1]! * 60 + nums[2]! : nums[0]! * 60 + nums[1]!;
  return seconds > 0 ? seconds : null;
}

/** Parse a locale-tolerant decimal (`12,5` or `12.5`). */
export function parseDecimal(input: string): number | null {
  const normalized = input.trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
  return Number(normalized);
}
