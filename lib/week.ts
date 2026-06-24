// Week math, all in UTC so server render and client hydration agree
// regardless of the host timezone. Weeks start on Monday.

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

/**
 * Resolve a `?week=YYYY-MM-DD` param to the Monday of its week. Anything
 * missing or malformed falls back to the week containing today.
 */
export function parseWeekParam(param: string | undefined): Date {
  if (param && /^\d{4}-\d{2}-\d{2}$/.test(param)) {
    const parsed = new Date(`${param}T00:00:00.000Z`);
    if (!Number.isNaN(parsed.getTime())) return startOfWeekMonday(parsed);
  }
  return startOfWeekMonday(new Date());
}
