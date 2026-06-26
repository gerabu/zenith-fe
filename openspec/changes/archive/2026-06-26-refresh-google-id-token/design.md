## Context

The backend authenticates each request using the Google **ID token** that the frontend injects as `Authorization: Bearer` (see `lib/api.ts` interceptor, which reads `session.idToken`). The ID token is captured once in the NextAuth `jwt` callback at sign-in (`auth.ts:20`) and stored on the NextAuth token; the session lives 24h while a Google ID token's `exp` is ~1h. After an hour, the session is still valid but the embedded ID token is expired, so the backend returns 401.

Today only the calendar-connect flow (`app/actions/calendar-connection.ts`) requests `access_type=offline`, so a refresh token isn't reliably available for sessions that never connected a calendar. The base sign-in (`app/onboarding/page.tsx`) requests no offline access.

NextAuth v5 (`5.0.0-beta.31`) invokes the `jwt` callback on every session read, with `account` present only on the initial sign-in. This callback is the correct seam for refresh-on-read.

## Goals / Non-Goals

**Goals:**
- Keep the injected Google ID token non-expired for the full life of the session, eliminating the post-1-hour 401s.
- Make refresh available for **every** session, including ones that never connect a calendar.
- Fail safe: a dead refresh token routes the user to re-auth rather than silently sending bad tokens.

**Non-Goals:**
- Changing the backend's auth contract (it still receives a Google ID token).
- Changing how calendar tokens are persisted to the backend (`PATCH /auth/calendar-connection` is unchanged).
- Adding a client-side refresh path — refresh happens server-side in the `jwt` callback only.

## Decisions

### Refresh inside the `jwt` callback (refresh-token rotation)
Persist `refreshToken` and `expiresAt` (absolute ms) on the token at sign-in. On every later `jwt` invocation, if `Date.now()` is within a skew margin of `expiresAt`, POST to `https://oauth2.googleapis.com/token` with `grant_type=refresh_token` to mint a fresh `id_token` + `access_token` and update `idToken`/`expiresAt`.

- *Why:* canonical Auth.js v5 pattern; transparent to callers; session stays valid 24h.
- *Alternative rejected:* shortening session `maxAge` to 1h so both expire together — trades 401s for an hourly forced re-login (bad UX). Refresh is strictly better.

### Refresh call uses bare `axios`, NOT the `lib/api.ts` instance
The token-endpoint call targets Google (`oauth2.googleapis.com`), not our backend. Use a direct `axios.post(...)` (imported straight from `axios`) here — **not** the shared `lib/api.ts` instance. Routing it through the instance would trigger its request interceptor's `auth()` call (recursion) and attach our backend's Bearer/base URL to a Google request. The CLAUDE.md "all backend calls go through `lib/api.ts`" rule applies to **our backend**; Google's OAuth endpoint is not the backend, so a bare `axios` call is the correct exception (mirroring the sign-in carve-out that sets an explicit `Authorization` header to avoid recursion).

### Compute `expiresAt` from `account.expires_at`
Google returns `account.expires_at` (seconds) on sign-in and `expires_in` on refresh. Store the absolute expiry in ms. Refresh when `Date.now() >= expiresAt - skew` (skew ~60s) so we never hand out a token in its last seconds.

### Base sign-in requests offline access
Update `app/onboarding/page.tsx`'s `signIn("google", …)` to pass `{ access_type: "offline", prompt: "consent" }` (mirroring `calendar-connection.ts`) so every session gets a refresh token. `prompt=consent` is required because Google omits the refresh token on silent re-consent.

### Surface refresh failure via `token.error`
On a failed refresh, set `token.error = "RefreshAccessTokenError"` and return the token; the `session` callback exposes it so the app/route guard sends the user back to `/onboarding`.

## Risks / Trade-offs

- **`prompt=consent` shows the consent screen on every fresh sign-in** → acceptable; only affects the interactive sign-in, not session refresh. Needed to guarantee a refresh token.
- **Existing sessions created before this change lack a stored refresh token** → on their next refresh attempt there is nothing to exchange; mark `token.error` and force re-auth once. One-time re-login on rollout.
- **Concurrent `jwt` invocations could refresh in parallel** → Google tolerates reusing a valid refresh token; brief duplicate refreshes are harmless. No locking needed for this scale.
- **Refresh token revoked/expired (e.g. password change, 6-month inactivity)** → caught by the failure path → re-auth.
- **Type drift** → add `refreshToken`, `expiresAt`, `error` to `types/next-auth.d.ts` for both `JWT` and `Session` so callbacks stay typed.

## Migration Plan

1. Add fields to `types/next-auth.d.ts`.
2. Update `auth.ts`: persist refresh material at sign-in; add refresh-on-read branch; add failure handling; expose `error` on session.
3. Update `app/onboarding/page.tsx` base sign-in to request offline access.
4. Deploy. Existing sessions hit the failure path once and re-authenticate (acquiring a refresh token); new sessions refresh transparently.
- *Rollback:* revert `auth.ts` and the sign-in param change; sessions revert to the prior 1-hour-401 behavior. No persisted data migration to undo.

## Open Questions

- Where should the errored-session redirect be enforced — extend the existing `authorized` callback in `auth.ts`, or handle it where the session is consumed? (Leaning on `authorized`/route guard for `/calendar`.) Resolve during implementation.
