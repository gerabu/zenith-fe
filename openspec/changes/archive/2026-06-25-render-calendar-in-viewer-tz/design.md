## Context

The calendar week view is a server component (`app/calendar/page.tsx`). On the server it:
1. resolves the displayed week from a `?week=` param (`lib/week.ts`, all UTC),
2. fetches each day's availability via `getWeekAvailability` → `fetchDay` (`lib/availability.ts`, `server-only`, on the shared `lib/api.ts` axios instance), and
3. builds serializable view models (`CalendarDayVM` / `CalendarEventVM`) that are handed to client components through `CalendarWeekProvider`.

Everything in steps 1–3 uses UTC (`Date.UTC`, `getUTCHours`, `toISOString().slice(0,10)`, `Intl.DateTimeFormat({ timeZone: "UTC" })`). This was a deliberate choice (see the comment atop `lib/week.ts`): the server cannot know the browser timezone at SSR time, so rendering in UTC guarantees the server output and the first client hydration render agree. The only viewer-local facts are "today" and the live now-marker, which are resolved on the client via `hooks/use-local-today.ts` using `useSyncExternalStore` with a `null` server snapshot.

The cost of that choice is correctness: a viewer in UTC−5 sees every event shifted onto the wrong day and hour. The backend now accepts `GET /availability/:date?tz=<IANA>` and defines each day's window in that timezone, returning the same UTC instants. We must thread the viewer's IANA timezone through both the server fetch and all rendering — without reintroducing a hydration mismatch.

Constraints:
- The timezone is only knowable on the client.
- The availability fetch and the day-bucket math run on the server.
- All backend HTTP must stay on the `lib/api.ts` instance (no `fetch`/`axios.create`).
- The backend contract is fixed; `Slot.start`/`Slot.end` remain UTC ISO.

## Goals / Non-Goals

**Goals:**
- Every event renders on the viewer's correct local day and at the correct local hour, DST-correct.
- The timezone used to *fetch* (`?tz=`) and the timezone used to *render* (day buckets, hour placement, labels) are always identical — one source of truth.
- No React hydration warnings.
- Keep server-side fetching and serializable VMs (no architectural move of fetching to the client).

**Non-Goals:**
- No change to the backend contract or to `lib/types.ts` (`Slot` stays UTC ISO).
- No user-facing timezone picker; we use the browser-resolved IANA zone only.
- No change to how the live now-marker / today highlight already work, beyond aligning them with the same zone.

## Decisions

### Decision 1: Persist the viewer timezone in a cookie and read it on the server

The server needs the IANA zone *before* it fetches and buckets days. A cookie is the only channel that lets a client-resolved value reach the server render on the same request family.

- A tiny client component `TzCookieSync` ("use client") resolves `Intl.DateTimeFormat().resolvedOptions().timeZone` on mount, and if it differs from the current `zenith_tz` cookie, writes the cookie and calls `router.refresh()` to re-run the server component with the now-known zone.
- `page.tsx` reads `zenith_tz` via `next/headers` `cookies()`.

**Alternatives considered:**
- *Move fetching + rendering to the client (React Query + axios with the browser tz).* Rejected: contradicts the project's "RSC pages fetch directly" architecture, duplicates the auth/token path, and is a larger change than needed.
- *Guess the zone from a UTC-offset header.* Rejected: an offset is not a zone and is not DST-correct; the spec requires IANA + `Intl`.
- *Accept-Language / Vercel geo headers.* Rejected: geo ≠ the viewer's chosen zone and is unreliable.

### Decision 2: Gate the tz-dependent render until the cookie is known (no UTC fallback path)

The hard requirement is: never let the server fetch/render in UTC while the client renders local. So on the *very first* visit (no `zenith_tz` cookie yet):

- The server detects the missing cookie and renders a minimal, tz-neutral placeholder (the calendar chrome / a lightweight "loading" state) **plus** `TzCookieSync`. It does **not** fetch availability in UTC and does **not** render day/time content.
- `TzCookieSync` sets the cookie and calls `router.refresh()`; the re-render now has the cookie and does the full local fetch + render.

Because the full tz-dependent output is only ever produced once the cookie exists, the server and client always agree on the zone, and there is no UTC-vs-local mismatch. On every subsequent visit the cookie is already present, so the first paint is already correct (no flash, no refresh).

`TzCookieSync` also stays mounted on the full render: if the resolved zone ever differs from the cookie (travel, or a stale zone), it rewrites the cookie and refreshes, keeping fetch and render aligned.

**Alternatives considered:**
- *Render UTC on first load, then re-render local.* Rejected outright by the acceptance criteria — that is exactly the forbidden mismatch path.
- *Block SSR with `cookies()` and a default of UTC.* Rejected: a UTC default reintroduces wrong-day rendering for first-time visitors.

### Decision 3: Make `lib/week.ts` timezone-aware via civil-date arithmetic

`lib/week.ts` must produce the viewer's local Mon–Sun week and local `YYYY-MM-DD` strings, given an IANA zone.

- Resolve "now" → the viewer's civil date `{ y, m, d }` using `Intl.DateTimeFormat(undefined, { timeZone, year, month, day })` `formatToParts` (DST-correct).
- Do week/day math on the civil-date triple, not on UTC millisecond offsets. Weekday of a civil date is timezone-independent, so Monday-alignment and the 7-day expansion are computed purely from `{ y, m, d }` (e.g. via a fixed `Date.UTC(y, m, d)` used only as a weekday/iteration helper, never reinterpreted as an instant for display).
- `formatDateParam` returns the `YYYY-MM-DD` of a civil date directly (no `toISOString()`), so day params and day buckets match the viewer's calendar.
- `parseWeekParam` keeps accepting `YYYY-MM-DD` but interprets/aligns it as a civil date in the viewer's zone.

Functions take the resolved IANA zone as a parameter (threaded from the cookie on the server). This keeps the math pure and testable, and avoids any hidden dependence on the host's `TZ`.

**Alternatives considered:**
- *Add a date library (date-fns-tz / Luxon / Temporal polyfill).* Rejected: `Intl` + civil-date arithmetic covers every case here with no new dependency.

### Decision 4: Render hours and labels with `Intl` in the viewer zone

In `page.tsx`:
- `hhmm()` formats the UTC instant with `Intl.DateTimeFormat(undefined, { timeZone, hour, minute, hourCycle: "h23" })` instead of `getUTCHours()/getUTCMinutes()`.
- `toEventVM().startHour` derives the local start hour (0–23) in the viewer zone (drives vertical placement) instead of `getUTCHours()`.
- `weekdayFmt` / `monthDayFmt` / `rangeLabel` use the viewer zone instead of `timeZone: "UTC"`.

All of this runs on the server with the cookie zone, so the VMs are fully computed server-side and serialized — the client never recomputes hour/day placement, preserving hydration safety. `CalendarEventVM`/`CalendarDayVM` doc comments change from "UTC" to "viewer tz"; the field shapes are unchanged.

## Risks / Trade-offs

- **First-ever visit needs one extra round-trip (cookie set → `router.refresh()`).** → Only first visit; cookie persists thereafter. The placeholder is tz-neutral so there is never a wrong-day flash, only a brief loading state.
- **Cookie zone drifts from the actual browser zone (travel, DST cookie staleness).** → `TzCookieSync` re-checks the resolved zone on every mount and refreshes on mismatch, so fetch and render re-align automatically. `use-local-today` continues to read the live browser clock for the now-marker, which matches once the cookie is in sync.
- **A malformed/unknown `zenith_tz` value could reach `Intl`.** → Validate the cookie (e.g. attempt `Intl.DateTimeFormat(undefined,{timeZone})` in a try/catch); on failure treat it as "not yet known" and re-trigger sync rather than throwing during SSR.
- **Cookie disabled in the browser.** → `router.refresh()` would loop without a stored zone; guard by only refreshing when the cookie write is observed, and fall back to a single client-rendered pass if the cookie cannot be set. (Edge case; acceptable degradation.)
- **`lib/week.ts` signature change ripples to callers** (`page.tsx`, `availability.ts`). → Mechanical; covered in tasks, and the pure civil-date functions are unit-testable with fixed zones (UTC−5 June 25, plus a DST boundary).
