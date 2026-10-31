/**
 * Pure calendar-date helpers on ISO `YYYY-MM-DD` strings, computed in UTC
 * "epoch days" so results never depend on the host timezone.
 */
import { WEEKDAYS, type IsoDate, type Weekday } from "./types";

const MS_PER_DAY = 86_400_000;

/** Days since 1970-01-01 for an ISO date. */
export function toEpochDay(date: IsoDate): number {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return Math.round(Date.UTC(y, m - 1, d) / MS_PER_DAY);
}

export function fromEpochDay(day: number): IsoDate {
  return new Date(day * MS_PER_DAY).toISOString().slice(0, 10);
}

export function addDays(date: IsoDate, days: number): IsoDate {
  return fromEpochDay(toEpochDay(date) + days);
}

/** `b - a` in days. */
export function diffDays(a: IsoDate, b: IsoDate): number {
  return toEpochDay(b) - toEpochDay(a);
}

/** 0 = Monday … 6 = Sunday. */
export function weekdayIndex(date: IsoDate): number {
  // 1970-01-01 was a Thursday (index 3).
  return (((toEpochDay(date) + 3) % 7) + 7) % 7;
}

export function weekdayOf(date: IsoDate): Weekday {
  return WEEKDAYS[weekdayIndex(date)]!;
}

/** Monday of the week containing `date`. */
export function mondayOf(date: IsoDate): IsoDate {
  return addDays(date, -weekdayIndex(date));
}

/** Next Monday, or `date` itself if it is a Monday. */
export function nextMondayOrSame(date: IsoDate): IsoDate {
  const idx = weekdayIndex(date);
  return idx === 0 ? date : addDays(date, 7 - idx);
}

/** Whole calendar months from `a` to `b` (floor). */
export function monthsBetween(a: IsoDate, b: IsoDate): number {
  const [ya, ma, da] = a.split("-").map(Number) as [number, number, number];
  const [yb, mb, db] = b.split("-").map(Number) as [number, number, number];
  let months = (yb - ya) * 12 + (mb - ma);
  if (db < da) months -= 1;
  return months;
}
