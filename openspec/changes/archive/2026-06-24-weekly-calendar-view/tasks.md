## 1. Auth: expose user identity on session

- [x] 1.1 In `auth.ts` `jwt` callback, persist the user's `name` and `email` onto the token (from `profile`/default token) on first sign-in
- [x] 1.2 In `auth.ts` `session` callback, ensure `session.user.name` and `session.user.email` are populated alongside the existing `idToken`
- [x] 1.3 Update `types/next-auth.d.ts` only if needed so `session.user` name/email are correctly typed
- [x] 1.4 Manually verify `await auth()` in an RSC returns `session.user.name` and `session.user.email`

## 2. Shared types and availability fetcher

- [x] 2.1 Add shared types in `lib/` for `ApiResponse<T>`, `AvailabilityStatus` (`available | booked | external`), `Slot` (`{ start, end }`), and `AvailabilityEvent` (`{ status, slot, title }`)
- [x] 2.2 Create `lib/week.ts` helpers: derive the Monday-start week from a date, list its 7 days, format a date as `YYYY-MM-DD`, and parse/normalize a `week` param to a Monday (fallback to current week on invalid input)
- [x] 2.3 Create `lib/availability.ts` with a server-side `getWeekAvailability(weekStart, idToken)` that fetches `GET /availability/:date` for all 7 days in parallel (`Promise.all`) using native `fetch` with `Authorization: Bearer {idToken}`
- [x] 2.4 Parse each response as `ApiResponse<AvailabilityEvent[]>`, honoring mutual exclusivity, and return per-day results with an error marker for any failed day (so one failure does not fail the week)

## 3. Calendar context (no prop drilling)

- [x] 3.1 Create a `"use client"` `CalendarWeekProvider` + `useCalendarWeek()` hook exposing the displayed week's days and per-day events
- [x] 3.2 Seed the provider from serializable props passed by the RSC page (week days + each day's filtered events)

## 4. Calendar UI components

- [x] 4.1 Install the shadcn sidebar: `pnpm shadcn add sidebar` (lands in `components/ui/`)
- [x] 4.2 Build the calendar sidebar content component rendering the signed-in user's name and email from the session
- [x] 4.3 Build week navigation controls (prev / next / today) as a client leaf that pushes a new `?week=YYYY-MM-DD` param via `useRouter`
- [x] 4.4 Build the day column as a 24-row hourly grid and an event block component; place each event at its start hour
- [x] 4.5 Filter out `available` events; style `booked` with `bg-primary text-primary-foreground` and `external` with `bg-secondary text-secondary-foreground`; render each event's `title`
- [x] 4.6 Render an empty/error state for any day whose availability fetch failed

## 5. Calendar page + layout assembly

- [x] 5.1 Rewrite `app/calendar/page.tsx` to read the `week` search param, resolve the Monday-start week (default = current week), call `getWeekAvailability`, and redirect unauthenticated users
- [x] 5.2 Compose the layout with `SidebarProvider` (default sidebar width) + `SidebarInset` holding the weekly grid in the remaining space
- [x] 5.3 Wrap the grid in `CalendarWeekProvider` and wire navigation + day columns to read from `useCalendarWeek()`

## 6. Verification

- [x] 6.1 `pnpm lint` and `pnpm build` pass
- [ ] 6.2 Manually verify: default week is current Monday-start week; prev/next/today navigation re-fetches; booked vs external colors differ; available events are hidden; events land in their start-hour block; sidebar shows name + email
