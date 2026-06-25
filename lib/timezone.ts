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
