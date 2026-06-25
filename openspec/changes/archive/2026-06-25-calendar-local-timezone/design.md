## Context

The calendar was built to do all date math on the server in UTC so that "server render and client hydration agree regardless of the host timezone" (`lib/week.ts`, `app/calendar/types.ts`). That holds for the *week structure* — which seven calendar dates are shown, their labels, and each day's events — because those are timezone-agnostic calendar dates plus UTC-formatted labels.

It breaks for two values that are not calendar facts but *live, viewer-local* facts: which column is "today" and where the current-time marker sits. Computing them in UTC highlights tomorrow for viewers behind UTC (the reported bug: Thu highlighted while the viewer's local day is Wed).

## Goals / Non-Goals

**Goals:**
- "Today" highlight and the current-time marker reflect the viewer's local timezone.
- The "Today" / current-week control navigates to the week of the viewer's local current date.
- Preserve the server-rendered week structure and avoid hydration mismatches.

**Non-Goals:**
- Re-placing events into local-time hour blocks (events keep their UTC start hour).
- Making the server-side default-week selection timezone-aware (would require sending the timezone to the server).

## Decisions

### Compute today/now on the client via a hook, not on the server
The browser is the only place that knows the viewer's timezone. Per `ARCHITECTURE.md` ("Subscribing to browser APIs → a dedicated custom hook in `hooks/`"), a `useLocalToday()` hook owns this. The week structure stays server-rendered; only the today flag and now-marker become client-derived. The server-computed `isToday` (on `CalendarDayVM`) and `nowMinutes` (on `CalendarWeekData`) are removed so there is no stale/duplicate source of truth.

*Alternative considered:* persist the timezone in a cookie and keep the math on the server (preserving the "all server-side" philosophy and also fixing default-week selection). Rejected for this change as heavier (cookie write + `router.refresh()` + first-load fallback) than the bug warrants; the today/now values are genuinely live and belong client-side. The cookie route remains the path if event localization / default-week correctness is taken up later.

### Avoid hydration mismatch with `useSyncExternalStore`
`useLocalToday()` uses `useSyncExternalStore` whose `getServerSnapshot` returns `null`. So SSR and the first hydration render produce no "today" highlight and no marker (matching the server output), then the client store fills in the local value immediately after mount and re-renders. The store ticks once a minute to keep the marker and the date current across midnight. The snapshot is a primitive string (`"YYYY-MM-DD|minutes"`) so repeated `getSnapshot` calls compare equal by value and don't loop.

### Local date as `YYYY-MM-DD` keyed to the existing week dates
The hook derives today via `Date#getFullYear/getMonth/getDate` (local), formatted `YYYY-MM-DD` — the same key space as the server's day columns (`dateISO`). The today column is then simply `day.dateISO === todayISO`. `WeekNav` reuses `todayISO` to compute the current week's Monday (`startOfWeekMonday(new Date(\`${todayISO}T00:00:00.000Z\`))`), keeping week keys in the existing UTC-calendar-date space.

## Risks / Trade-offs

- **Brief first-paint with no highlight** (until the client store mounts) → acceptable and invisible in practice; avoids hydration errors.
- **Now-marker is local but events are UTC-placed** → a known inconsistency scoped out here; called out so it is a deliberate follow-up, not an oversight.
- **Default week near the Sun→Mon boundary** may not contain the viewer's local today (server resolves it in UTC) → the highlight simply won't show that week; the corrected "Today" control lets the user jump to it. Full fix needs the timezone on the server.
