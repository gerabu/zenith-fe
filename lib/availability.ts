import "server-only";

import { api } from "@/lib/api";
import type { ApiResponse, AvailabilityEvent } from "@/lib/types";
import { formatDateParam, weekDays } from "@/lib/week";

/** One day's availability outcome — events on success, a message on failure. */
export interface DayAvailability {
  /** `YYYY-MM-DD` — the viewer's local calendar day. */
  date: string;
  events: AvailabilityEvent[];
  error: string | null;
}

async function fetchDay(date: string, tz: string): Promise<DayAvailability> {
  try {
    // `tz` makes the backend define this day's window in the viewer's zone; the
    // Bearer ID token is attached by the axios request interceptor.
    const { data: body } = await api.get<ApiResponse<AvailabilityEvent[]>>(
      `/availability/${date}?tz=${encodeURIComponent(tz)}`,
    );

    if (!body.success) {
      return { date, events: [], error: body.error };
    }

    return { date, events: body.data ?? [], error: null };
  } catch {
    return { date, events: [], error: "Could not load this day." };
  }
}

/**
 * Fetch availability for every day of the Monday-start week in parallel. A
 * single failing day degrades to an error marker rather than failing the week.
 */
export async function getWeekAvailability(
  weekStart: Date,
  tz: string,
): Promise<DayAvailability[]> {
  const days = weekDays(weekStart).map(formatDateParam);
  return Promise.all(days.map((date) => fetchDay(date, tz)));
}
