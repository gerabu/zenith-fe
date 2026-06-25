## Why

Users can sign in and view booked events, but there is no way to actually connect their Google Calendar. Conflict detection — Zenith's core promise — depends on reading the user's calendar events, so without a connection the product cannot prevent double-booking. The connect-calendar step today is a disabled placeholder.

## What Changes

- Add a reusable **"Connect Google Calendar"** control that starts an incremental Google OAuth sign-in requesting the `calendar.events.readonly` scope (with offline access so a refresh token is issued).
- Extend the NextAuth `jwt` callback: when an `account` comes back whose granted scopes include `calendar.events.readonly`, call backend `PATCH /auth/calendar-connection` with the `accessToken` and `refreshToken` from the account so the backend can persist the calendar credentials.
- Add a `calendarConnected` flag to the JWT and session so the UI can tell whether the user has linked their calendar.
- Display a shadcn **Alert** on the calendar view (when not connected) explaining that connecting the calendar is required to book events, embedding the reusable connect button.
- Activate the previously-deferred connect action on the onboarding connect-calendar step using the same reusable control.

## Capabilities

### New Capabilities
- `calendar-connection`: incremental Google OAuth to grant read-only calendar access, persisting calendar credentials to the backend, exposing connection state on the session, and the reusable connect control plus the not-connected alert.

### Modified Capabilities
- `user-authentication`: the `jwt` callback gains calendar-scope handling and the `PATCH /auth/calendar-connection` call; the session additionally exposes `calendarConnected`.
- `onboarding`: the connect-calendar step now offers an active "Connect Google Calendar" action instead of being deferral-only.

## Impact

- **Code**: `auth.ts` (jwt/session callbacks), `next-auth.d.ts` type augmentation (`calendarConnected`), new reusable connect component + server action, calendar page (alert), onboarding connect-calendar page (active button).
- **Dependencies**: add shadcn `alert` component to `components/ui/`.
- **Backend**: depends on `PATCH /auth/calendar-connection` accepting `{ accessToken, refreshToken }` and on a way to learn connection state (e.g. `GET /auth/sync` reporting `calendarConnected`).
- **OAuth config**: Google OAuth client must allow the `calendar.events.readonly` scope; sign-in requests `access_type=offline` and `prompt=consent` to obtain a refresh token.
