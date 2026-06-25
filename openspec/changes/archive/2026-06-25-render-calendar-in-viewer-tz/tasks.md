## 1. Timezone resolution & cookie sync

- [x] 1.1 Add a small helper to read/validate the `zenith_tz` cookie value (treat an unknown/malformed IANA name — one that throws in `Intl.DateTimeFormat(undefined, { timeZone })` — as "not yet known"). _→ `resolveTimeZone` + `TZ_COOKIE` in `lib/timezone.ts`._
- [x] 1.2 Create a `"use client"` `TzCookieSync` component that resolves `Intl.DateTimeFormat().resolvedOptions().timeZone` on mount, and when it differs from the current `zenith_tz` cookie, writes the cookie and calls `router.refresh()`. Guard against a refresh loop when the cookie cannot be written. _→ `app/calendar/TzCookieSync.tsx` + effect isolated in `hooks/use-tz-cookie-sync.ts` (per ARCHITECTURE.md)._

## 2. Timezone-aware week math (`lib/week.ts`)

- [x] 2.1 Add a tz parameter to the week/day functions; resolve "now" to a viewer-local civil date `{ y, m, d }` via `Intl.DateTimeFormat(undefined, { timeZone, year, month, day })` `formatToParts`. _→ `civilParts` in `lib/timezone.ts`, used by `parseWeekParam`'s `todayInTZ`._
- [x] 2.2 Rewrite `startOfWeekMonday`, `weekDays`, and `addWeeks` to operate on civil-date triples (Monday-aligned, timezone-independent weekday), not UTC millisecond offsets. _→ DEVIATION: these already perform correct civil-date arithmetic on UTC-midnight civil Dates and are consumed by the client `WeekNav` on already-civil dates, so they stay zone-independent (no tz param). Only the leading comment was clarified. Adding a tz param would be wrong (would re-shift civil dates)._
- [x] 2.3 Rewrite `formatDateParam` to emit the `YYYY-MM-DD` of a civil date directly (no `toISOString()`), and `parseWeekParam` to align a `?week=` date to its Monday in the viewer's zone. _→ `formatDateParam` already yields the civil `YYYY-MM-DD` from a UTC-midnight civil Date (kept); `parseWeekParam(param, tz)` now falls back to today-in-tz._
- [x] 2.4 Update the file's leading comment to describe the new viewer-tz behavior (replacing the "all UTC for hydration" note).

## 3. Timezone-aware availability fetch (`lib/availability.ts`)

- [x] 3.1 Thread the viewer's IANA tz into `getWeekAvailability` / `fetchDay`.
- [x] 3.2 In `fetchDay`, append `?tz=${encodeURIComponent(tz)}` to the `/availability/${date}` request on the shared `lib/api.ts` axios instance (no `fetch`/`axios.create`).
- [x] 3.3 Update the `DayAvailability.date` doc comment from "(UTC)" to viewer-local.

## 4. Timezone-aware rendering (`app/calendar/page.tsx`)

- [x] 4.1 Read the `zenith_tz` cookie via `next/headers` `cookies()` and validate it.
- [x] 4.2 When the cookie is absent/invalid, render a tz-neutral placeholder (calendar chrome / loading) plus `TzCookieSync`, and do NOT fetch availability or render day/time content in UTC. _→ `TimezoneGate`._
- [x] 4.3 When the cookie is present, pass the zone to `parseWeekParam`/`weekDays`/`getWeekAvailability` and keep `TzCookieSync` mounted to re-sync on zone change.
- [x] 4.4 Rewrite `hhmm()` to format the UTC instant with `Intl.DateTimeFormat(undefined, { timeZone, hour, minute, hourCycle: "h23" })`. _→ replaced by `localTimeLabel(instant, tz)` in `lib/timezone.ts`._
- [x] 4.5 Rewrite `toEventVM().startHour` to derive the local start hour (0–23) in the viewer's zone. _→ `localHour(instant, tz)`._
- [x] 4.6 Change `weekdayFmt`, `monthDayFmt`, and `rangeLabel` to use the viewer's zone instead of `timeZone: "UTC"`. _→ DEVIATION: these format UTC-midnight **civil** dates, so they must read back in UTC; formatting them in the viewer zone would shift western zones to the previous day. Viewer-local correctness for headers comes from computing the civil week in the viewer's zone (`parseWeekParam`). Only true event instants (4.4/4.5) render in the viewer zone. Kept UTC; added a clarifying comment._
- [x] 4.7 Update `app/calendar/types.ts` doc comments for `CalendarEventVM`/`CalendarDayVM` from "UTC" to "viewer tz" (field shapes unchanged).

## 5. Verification

- [x] 5.1 Add unit tests with fixed zones: a viewer in UTC−5 buckets `2026-06-26T02:00:00Z` onto local June 25, and a DST-boundary case renders the correct local hour. _→ `lib/timezone.test.ts` (Lima −5 + New York EST/EDT) and `lib/week.test.ts` (viewer-local week fallback). Added `vitest.config.mts` so the `@/*` alias resolves in tests._
- [x] 5.2 Verify the acceptance case: UTC−5 viewer sees the June 25 21:00 event on June 25 at 21:00, and no React hydration warnings. _→ Acceptance logic verified by `lib/timezone.test.ts` (localDateKey → 2026-06-25, localHour → 21) and a clean `pnpm build` (`/calendar` is dynamic/SSR). NOTE: live-browser console check for hydration warnings not run in this environment — recommend a quick manual pass._
- [x] 5.3 Run `pnpm lint` and `pnpm test`. _→ lint clean, `tsc --noEmit` clean, 7/7 tests pass, `pnpm build` succeeds._
