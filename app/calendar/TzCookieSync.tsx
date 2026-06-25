"use client";

import { useTzCookieSync } from "@/hooks/use-tz-cookie-sync";

// Renders nothing; keeps the `zenith_tz` cookie aligned with the viewer's
// resolved IANA zone (and re-syncs if it ever changes, e.g. travel/DST).
export function TzCookieSync() {
  useTzCookieSync();
  return null;
}
