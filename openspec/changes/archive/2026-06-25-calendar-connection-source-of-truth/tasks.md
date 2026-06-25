## 1. Backend endpoint (separate repo — coordinate)

- [x] 1.1 Add read-only `GET /auth/calendar-connection` returning the `ApiResponse` envelope wrapping `{ calendarConnected: boolean }`, authorized with the Google ID token, idempotent and side-effect-free
- [x] 1.2 Confirm the route/shape matches the existing `PATCH /auth/calendar-connection` conventions (returns the standard `ApiResponse` envelope; reader updated to unwrap it)

## 2. Server-only status reader

- [x] 2.1 Add `lib/calendar-connection.ts` (`import "server-only"`) exporting `getCalendarConnected(): Promise<boolean>` that calls `GET /auth/calendar-connection` via the shared axios instance (`lib/api.ts`)
- [x] 2.2 Apply the disconnected-on-error fallback: any thrown/error/unreachable response resolves to `false`, mirroring `lib/availability.ts`

## 3. Gate the calendar view

- [x] 3.1 In `app/calendar/page.tsx`, read connection status via `getCalendarConnected()` during render
- [x] 3.2 Gate `ConnectCalendarAlert` on the fresh value instead of `session.calendarConnected`

## 4. Guard the onboarding connect step

- [x] 4.1 In `app/onboarding/connect-calendar/page.tsx`, read connection status via `getCalendarConnected()`
- [x] 4.2 `redirect("/calendar")` when connected; otherwise render the existing connect step (preserve the unauthenticated `redirect("/onboarding")` guard)

## 5. Remove the JWT/session snapshot

- [x] 5.1 Remove `calendarConnected` assignment from the `jwt` and `session` callbacks in `auth.ts` (leave the `PATCH /auth/calendar-connection` persist and `GET /auth/sync` sign-in call intact)
- [x] 5.2 Drop `calendarConnected` from the `Session` and `JWT` augmentations in `types/next-auth.d.ts`
- [x] 5.3 Grep for any remaining `calendarConnected` session reads and confirm none remain outside the change

## 6. Verify

- [x] 6.1 Add/adjust tests covering the reader's disconnected-on-error fallback. (Surface gating is a pass-through of the reader's boolean; the repo has no DOM/component-test stack — adding jsdom + testing-library was out of scope, so RSC render tests were not added.)
- [x] 6.2 Manually verify: connect calendar, then refresh `/calendar` and revisit `/onboarding/connect-calendar` — alert is hidden and the step redirects
- [x] 6.3 Run `pnpm lint` and `pnpm test`
