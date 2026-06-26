// Viewer-timezone helpers. The calendar renders UTC instants from the backend
// in the viewer's IANA timezone (e.g. "America/New_York"), and computes the
// viewer's local week from it. The zone is resolved on the client and handed to
// the server via the `zenith_tz` cookie so fetching and rendering use one zone.

/** Name of the cookie that carries the viewer's resolved IANA timezone. */
export const TZ_COOKIE = "zenith_tz";

/**
 * Return `value` if it is a usable IANA zone, else `null`. An unknown or
 * malformed name throws inside `Intl.DateTimeFormat`, which we treat as
 * "not yet known" rather than letting it break SSR.
 */
export function resolveTimeZone(value: string | undefined | null): string | null {
  if (!value) return null;
  try {
    // Throws RangeError for an invalid `timeZone`.
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return value;
  } catch {
    return null;
  }
}

/** The viewer-local calendar parts of `instant` in `tz` (DST-correct via Intl). */
export function civilParts(
  instant: Date,
  tz: string,
): { year: number; month: number; day: number; hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)!.value);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
  };
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/** The viewer-local calendar date of `instant` in `tz`, as `YYYY-MM-DD`. */
export function localDateKey(instant: Date, tz: string): string {
  const { year, month, day } = civilParts(instant, tz);
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/** The viewer-local hour (0–23) of `instant` in `tz` — drives vertical placement. */
export function localHour(instant: Date, tz: string): number {
  return civilParts(instant, tz).hour;
}

/** The viewer-local `HH:MM` of `instant` in `tz`. */
export function localTimeLabel(instant: Date, tz: string): string {
  const { hour, minute } = civilParts(instant, tz);
  return `${pad2(hour)}:${pad2(minute)}`;
}

/**
 * Inverse of `civilParts`: turn a zoneless wall-clock value (`YYYY-MM-DDTHH:MM`,
 * as produced by a `datetime-local` input) interpreted *in `tz`* into an ISO
 * 8601 UTC timestamp. Conversion must happen here, with the viewer's zone — not
 * in a server action, which would reinterpret the same string in the server's
 * zone and shift the booking.
 *
 * One Intl round-trip recovers the zone offset at that instant, so it is
 * DST-correct except within the ~1h fold of a DST transition (an accepted MVP
 * edge). Throws `RangeError` on a malformed value.
 */
export function zonedWallTimeToISO(wallClock: string, tz: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(wallClock);
  if (!m) throw new RangeError(`Invalid wall-clock value: ${wallClock}`);
  const [year, month, day, hour, minute] = m.slice(1).map(Number);

  // Treat the wall-clock parts as if they were UTC, then measure how far that
  // instant's local time in `tz` drifts from the parts we wanted and undo it.
  const naive = Date.UTC(year, month - 1, day, hour, minute);
  const shown = civilParts(new Date(naive), tz);
  const shownMs = Date.UTC(
    shown.year,
    shown.month - 1,
    shown.day,
    shown.hour,
    shown.minute,
  );
  const offset = shownMs - naive;
  return new Date(naive - offset).toISOString();
}
