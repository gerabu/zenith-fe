## Why

The `calendarConnected` flag is a snapshot baked into the JWT only during a Google OAuth handshake (when `account` is present). Ordinary page loads decode the JWT and pass the flag through untouched, so the backend — the real source of truth — is never re-consulted. The flag drifts from reality, causing the `/calendar` "connect calendar" alert and the `/onboarding/connect-calendar` step to appear even when the calendar is already connected.

## What Changes

- **BREAKING**: Remove `calendarConnected` from the NextAuth JWT and session. The backend becomes the single source of truth, read per render.
- Add a frontend reader that calls a new read-only backend endpoint `GET /auth/calendar-connection` returning `{ calendarConnected: boolean }`, attached with the session's Google ID token like other backend calls.
- The `/calendar` RSC reads connection status per render and gates the not-connected alert on the fresh value instead of `session.calendarConnected`.
- The `/onboarding/connect-calendar` RSC reads connection status and redirects to `/calendar` when already connected; otherwise it renders the connect step (it currently performs no check at all).
- When the status fetch fails, the UI assumes **disconnected** (shows the alert / connect step) — a safe nudge consistent with the existing per-day availability degradation.
- The `jwt`/`session` callbacks stop sourcing the flag; the sign-in-time `GET /auth/sync` and the credential-persisting `PATCH /auth/calendar-connection` are unaffected.

## Capabilities

### New Capabilities

_None._ This change reshapes how an existing capability sources its state; it introduces no new capability.

### Modified Capabilities

- `calendar-connection`: Connection state is no longer carried on the session; it is read per render from a new `GET /auth/calendar-connection` backend endpoint, which is the source of truth. The not-connected alert gates on this fresh value, with a disconnected-on-error fallback.
- `onboarding`: The connect-calendar step gains a guard that redirects already-connected users to `/calendar` instead of unconditionally showing the connect step.

## Impact

- **Backend (additive, separate repo)**: new read-only `GET /auth/calendar-connection` → `{ calendarConnected: boolean }`. Idempotent, cheap, no side effects.
- **Frontend code**:
  - `auth.ts` — remove `calendarConnected` from the `jwt` and `session` callbacks.
  - `types/next-auth.d.ts` — drop `calendarConnected` from the `Session` and `JWT` augmentations.
  - new server reader (e.g. `lib/calendar-connection.ts`) — fetches status via the shared axios instance.
  - `app/calendar/page.tsx` — read status per render; gate `ConnectCalendarAlert` on it.
  - `app/onboarding/connect-calendar/page.tsx` — read status; redirect to `/calendar` when connected.
- **Behavioral**: connection state is now always live (reflects cross-device connects, revocations, and rotations) at the cost of one extra backend call per gated render. Tradeoff accepted because `/calendar` already issues per-render backend calls.
