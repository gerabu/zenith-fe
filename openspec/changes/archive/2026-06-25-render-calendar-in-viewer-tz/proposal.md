## Why

The calendar week view computes dates and renders times entirely in UTC, so any viewer outside UTC sees events on the wrong day and at the wrong hour (e.g. a 21:00 event in UTC−5 shows as the next day, 02:00). The backend now accepts the viewer's IANA timezone and returns the same UTC instants; the frontend must request and render in the viewer's local timezone so every event lands on its correct local day and hour.

## What Changes

- Resolve the viewer's IANA timezone on the client (`Intl.DateTimeFormat().resolvedOptions().timeZone`) and persist it in a cookie so the server can read it during SSR.
- `lib/availability.ts` `fetchDay()` appends `?tz=<IANA>` to the `/availability/:date` request so the backend defines each day's window in the viewer's timezone.
- `app/calendar/page.tsx` stops rendering in UTC: hour/minute labels (`hhmm`), vertical placement (`toEventVM().startHour`), and the weekday/month-day/range labels all format in the viewer's timezone.
- `lib/week.ts` produces the viewer's local Mon–Sun week and local `YYYY-MM-DD` strings instead of UTC week math, so the requested dates and the day buckets in `page.tsx` line up with the viewer's local calendar.
- **SSR/hydration**: the timezone is only knowable on the client, but fetching and the day buckets happen on the server. The change threads a single timezone (from the cookie) through both the server fetch/render and the client, gating the tz-dependent render until the cookie is known so the server never fetches/renders in UTC while the client renders local. No native `fetch`, `axios.create()`, or bare `axios` is introduced — the request stays on the shared `lib/api.ts` instance.

## Capabilities

### New Capabilities
- `viewer-timezone-rendering`: resolving the viewer's IANA timezone, persisting it for SSR, and using it as the single source of truth for the availability request window and all calendar day/time rendering.

### Modified Capabilities
<!-- No existing spec files under openspec/specs/ cover the calendar week view; the
     timezone behavior is introduced as a new capability above. -->

## Impact

- **Code**: `app/calendar/page.tsx`, `lib/availability.ts`, `lib/week.ts`, `app/calendar/types.ts` (VM doc comments shift from "UTC" to "viewer tz"), plus a small client component that writes the tz cookie and triggers a server re-render on first load / tz change.
- **Backend contract**: consumes the already-agreed `GET /availability/:date?tz=<IANA>`. Response shape is unchanged; `Slot.start`/`Slot.end` stay UTC ISO-8601 — no type change to `lib/types.ts`.
- **No dependency changes**: relies on the built-in `Intl` API and Next.js cookies; no new packages.
- **Acceptance**: a viewer in UTC−5 with a Google event at June 25 21:00 local sees it on June 25 at 21:00; no React hydration warnings; DST-correct via IANA tz + `Intl`.
