// Serializable view models handed from the RSC page to client components.
// The week structure and event placement are derived on the server (UTC) so
// there is no hydration drift. "Today" and the current-time marker are not
// here: they are viewer-local and resolved on the client (see
// hooks/use-local-today.ts).

export type RenderableStatus = "booked" | "external";

export interface CalendarEventVM {
  title: string;
  status: RenderableStatus;
  /** 0-23, the UTC hour the event starts in. */
  startHour: number;
  /** e.g. "09:00 – 10:30" (UTC). */
  timeLabel: string;
}

export interface CalendarDayVM {
  /** `YYYY-MM-DD` (UTC). */
  dateISO: string;
  /** e.g. "Mon". */
  weekdayLabel: string;
  /** e.g. "24". */
  dayNumber: string;
  /** Non-null when this day's availability failed to load. */
  error: string | null;
  events: CalendarEventVM[];
}

export interface CalendarWeekData {
  /** Monday of the displayed week, `YYYY-MM-DD` (UTC). */
  weekStartISO: string;
  /** e.g. "Jun 23 – 29, 2026". */
  rangeLabel: string;
  days: CalendarDayVM[];
}
