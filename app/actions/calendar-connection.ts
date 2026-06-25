"use server";

import { signIn } from "@/auth";

const CALENDAR_SCOPE =
  "openid email profile https://www.googleapis.com/auth/calendar.events.readonly";

/**
 * Start the incremental Google authorization that grants read-only calendar
 * access. `access_type=offline` + `prompt=consent` force Google to return a
 * refresh token (it omits one on silent re-consent), which the `jwt` callback
 * forwards to the backend.
 */
export async function connectCalendar(redirectTo: string = "/calendar") {
  await signIn(
    "google",
    { redirectTo },
    { scope: CALENDAR_SCOPE, access_type: "offline", prompt: "consent" }
  );
}
