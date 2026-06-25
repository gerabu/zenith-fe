## 1. Session & type plumbing

- [x] 1.1 Augment `next-auth.d.ts`: add `calendarConnected?: boolean` to both the `Session` and `JWT` module interfaces
- [x] 1.2 In `auth.ts` `session` callback, copy `token.calendarConnected` onto `session.calendarConnected`

## 2. jwt callback — incremental calendar authorization

- [x] 2.1 In `auth.ts` `jwt` callback, seed `token.calendarConnected` from the `GET /auth/sync` response (calendar connection status) on sign-in
- [x] 2.2 When `account.scope` includes `https://www.googleapis.com/auth/calendar.events.readonly`, call `api.patch("/auth/calendar-connection", { accessToken: account.access_token, refreshToken: account.refresh_token }, { headers: { Authorization: \`Bearer ${account.id_token}\` } })`
- [x] 2.3 On a successful PATCH set `token.calendarConnected = true`; on failure leave it false (do not swallow into a connected state)

## 3. Reusable connect-calendar control

- [x] 3.1 Add shared Server Action `connectCalendar` (`app/actions/calendar-connection.ts`, `"use server"`) that calls `signIn("google", { redirectTo }, { scope: "openid email profile https://www.googleapis.com/auth/calendar.events.readonly", access_type: "offline", prompt: "consent" })`
- [x] 3.2 Create `components/connect-calendar-button.tsx` (`"use client"`): a `<form action={connectCalendar}>` with a submit `Button`, accepting `redirectTo` (default `/calendar`), plus `variant`/`size`/`className`/`children` props for reuse
- [x] 3.3 Use `useFormStatus` to show a pending/disabled state while the redirect is in flight

## 4. Onboarding connect step

- [x] 4.1 In `app/onboarding/connect-calendar/page.tsx`, replace the disabled "Soon" button with `ConnectCalendarButton` (redirectTo `/calendar`); keep the existing "I'll do it later" deferral link

## 5. Not-connected alert on the calendar view

- [x] 5.1 Add the shadcn alert primitive: `pnpm shadcn add alert`
- [x] 5.2 Build a not-connected alert (server component) that explains connecting the calendar is required to book events and embeds `ConnectCalendarButton`
- [x] 5.3 In `app/calendar/page.tsx`, render the alert at the top of `SidebarInset` only when `!session.calendarConnected`

## 6. Verify

- [x] 6.1 `pnpm lint` and `pnpm test` pass
- [x] 6.2 Manual check: unconnected user sees the alert on `/calendar`; activating the button reaches Google consent for read-only calendar; after granting, the alert disappears and `PATCH /auth/calendar-connection` is sent
