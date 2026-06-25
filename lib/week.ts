// Week math over *civil dates* (a calendar day, no time/zone). Each day is
// carried as the UTC-midnight instant of that civil date, so getUTC* reads the
// civil components back and the arithmetic is timezone-independent. The only
// zone-dependent input is "today", which `parseWeekParam` resolves in the
// viewer's IANA zone so the displayed week is the viewer's local Mon–Sun.
// Weeks start on Monday.

import { civilParts } from "@/lib/timezone";

/** UTC midnight of the Monday on or before `date`. */
export function startOfWeekMonday(date: Date): Date {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const day = d.getUTCDay(); // 0 = Sun .. 6 = Sat
  const shiftToMonday = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + shiftToMonday);
  return d;
}

/** The seven UTC-midnight days of the Monday-start week containing `monday`. */
export function weekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    return d;
  });
}

/** `YYYY-MM-DD` in UTC — the format the backend expects for `/availability/:date`. */
export function formatDateParam(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Shift a Monday by whole weeks (negative = earlier). */
export function addWeeks(monday: Date, count: number): Date {
  const d = new Date(monday);
  d.setUTCDate(monday.getUTCDate() + count * 7);
  return d;
}

/** UTC-midnight instant of today's civil date in the viewer's `tz`. */
function todayInTZ(tz: string): Date {
  const { year, month, day } = civilParts(new Date(), tz);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Resolve a `?week=YYYY-MM-DD` param to the Monday of its week. An explicit
 * param is already a civil date, so it needs no zone; anything missing or
 * malformed falls back to the week containing today *in the viewer's zone*.
 */
export function parseWeekParam(param: string | undefined, tz: string): Date {
  if (param && /^\d{4}-\d{2}-\d{2}$/.test(param)) {
    const parsed = new Date(`${param}T00:00:00.000Z`);
    if (!Number.isNaN(parsed.getTime())) return startOfWeekMonday(parsed);
  }
  return startOfWeekMonday(todayInTZ(tz));
}
