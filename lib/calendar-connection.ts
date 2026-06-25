import "server-only";

import { api } from "@/lib/api";
import { ApiResponse } from "./types";

/**
 * Read whether the authenticated user's Google Calendar is connected. The
 * backend is the single source of truth — this is read per render, not cached
 * on the session/JWT (which only ever reflected the connection at OAuth time).
 *
 * The Bearer ID token is attached by the axios request interceptor.
 *
 * Failure policy: any error or unreachable backend resolves to `false`
 * (assume disconnected). A false "connect" nudge is harmless; falsely
 * reporting "connected" would hide the only path to fix a disconnected
 * calendar. Mirrors the degrade-safe approach in `lib/availability.ts`.
 */
export async function getCalendarConnected(): Promise<boolean> {
  try {
    const { data: { data } } = await api.get<ApiResponse<{ calendarConnected?: boolean }>>(
      "/auth/calendar-connection",
    );
    return data?.calendarConnected ?? false;
  } catch {
    return false;
  }
}
