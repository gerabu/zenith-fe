## Context

Zenith authenticates with Google via NextAuth (Auth.js v5). The initial sign-in (`app/onboarding/page.tsx`) requests only the default `openid email profile` scopes and captures the Google `id_token`, which the `jwt` callback forwards to backend `GET /auth/sync`. The `calendar.events.readonly` scope is **not** requested at sign-in, so the backend never receives calendar credentials.

The connect-calendar onboarding step (`app/onboarding/connect-calendar/page.tsx`) currently renders a disabled "Connect Google Calendar" button marked "Soon", and the calendar view (`app/calendar/page.tsx`) gives no indication that calendar access is missing.

Constraints from `ARCHITECTURE.md` / `CLAUDE.md`:
- All backend HTTP goes through the shared axios instance in `lib/api.ts` (no bare `fetch`/`axios`).
- Server Components by default; `"use client"` only where needed; client boundaries kept at the leaf.
- shadcn primitives live in `components/ui/` (style `base-maia`, `@base-ui/react`); hand-written shared components go in `components/`.
- Mutations originating from forms use Server Actions.

## Goals / Non-Goals

**Goals:**
- A single reusable control that starts an incremental Google OAuth flow requesting `calendar.events.readonly` with offline access.
- Persist the granted `accessToken`/`refreshToken` to the backend via `PATCH /auth/calendar-connection` during the `jwt` callback.
- Expose a `calendarConnected` boolean on the session.
- Show a not-connected alert on the calendar view, and wire the onboarding step's button to the same control.

**Non-Goals:**
- Actually reading calendar events for conflict detection (separate change).
- Disconnect / revoke flow.
- Token refresh handling on the frontend (backend owns the stored refresh token).
- Booking creation UI.

## Decisions

### Incremental authorization via a re-`signIn` with extra scope
The connect action calls `signIn("google", { redirectTo }, { scope, access_type: "offline", prompt: "consent" })`. The `scope` requests `openid email profile https://www.googleapis.com/auth/calendar.events.readonly`; `access_type=offline` + `prompt=consent` force Google to return a `refresh_token` (Google only issues it on explicit consent). Re-running sign-in produces a fresh `account` object in the `jwt` callback carrying the new scopes and tokens.

*Alternative considered:* requesting calendar scope on the very first sign-in. Rejected — it front-loads a scary permission before the user understands the product and couples identity sign-in to calendar access; incremental consent is the recommended Google pattern.

### Reusable control = client component + shared Server Action
`components/connect-calendar-button.tsx` is promoted to `components/` because it is used by two routes (onboarding and calendar). It renders a `<form>` whose `action` is a shared Server Action `connectCalendar` (in `app/actions/calendar-connection.ts`, `"use server"`) which calls `signIn(...)` with the scope params. The button supports `variant`/`size`/`className`/`children` props so the same component covers the prominent onboarding CTA and the inline alert button. Pending state uses `useFormStatus`.

*Alternative considered:* calling client-side `signIn` from `next-auth/react`. Rejected to stay consistent with the existing server-action sign-in pattern in `app/onboarding/page.tsx`.

### `jwt` callback: detect scope, then PATCH
In `auth.ts`, when `account` is present, after the existing id-token capture, check `account.scope?.includes("calendar.events.readonly")`. If true, call:
```
api.patch("/auth/calendar-connection",
  { accessToken: account.access_token, refreshToken: account.refresh_token },
  { headers: { Authorization: `Bearer ${account.id_token}` } })
```
The explicit `Authorization` header mirrors the existing `/auth/sync` call and avoids the axios interceptor recursing into `auth()` before a session exists. On success set `token.calendarConnected = true`.

### Source of `calendarConnected`
The flag is set true in the `jwt` callback when the PATCH succeeds. For users who connected in a previous session, the existing `GET /auth/sync` response is the source of truth: `/auth/sync` returns `{ calendarConnected: boolean }` and the callback seeds `token.calendarConnected` from it on sign-in. This keeps the alert accurate across sessions without a per-render backend call. The `session` callback copies `token.calendarConnected` onto `session.calendarConnected`; `next-auth.d.ts` is augmented on both `Session` and `JWT`.

### Alert placement
`app/calendar/page.tsx` already `await`s `auth()`. When `!session.calendarConnected`, render a shadcn `Alert` banner at the top of the `SidebarInset` (above the week header) containing the explanation and an inline-styled `ConnectCalendarButton`. Kept server-rendered; only the button's form/pending state is a client leaf.

## Risks / Trade-offs

- **No refresh_token returned** (Google omits it when already granted) → force `prompt=consent` so consent is always shown and a refresh token is reissued.
- **PATCH fails after consent granted** → the user has consented but the backend lacks credentials; surface the failure rather than silently setting `calendarConnected=true`, and leave the alert visible so the user can retry. (Mirrors the `/auth/sync` fail-loud behavior.)
- **Stale flag** (connected in another session/device) → seeding from `GET /auth/sync` on each sign-in bounds staleness to one session; acceptable for a banner.
- **Backend contract dependency** → `PATCH /auth/calendar-connection` and `calendarConnected` on `/auth/sync` must exist; tracked in Open Questions.

## Open Questions

- Does `GET /auth/sync` already return `calendarConnected`, or does the backend need to add it? If unavailable initially, the flag is driven solely by the in-session PATCH result (returning users may see the alert until they reconnect once).
- Exact request/response shape expected by `PATCH /auth/calendar-connection` (field names `accessToken`/`refreshToken` assumed per the request).
