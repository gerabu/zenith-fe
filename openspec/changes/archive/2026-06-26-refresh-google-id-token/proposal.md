## Why

The Bearer token the backend authenticates with is the Google **ID token**, captured once at sign-in and stored in the NextAuth session. Google ID tokens expire after ~1 hour, but the NextAuth session lives 24 hours — so an hour into a session the token embedded in it is stale and the backend starts returning 401 while the session still appears valid. We need the ID token to stay fresh for the life of the session.

## What Changes

- The base Google sign-in SHALL request offline access (`access_type=offline`, `prompt=consent`) so **every** session — not only sessions that connected a calendar — obtains a refresh token.
- The NextAuth `jwt` callback SHALL persist the refresh token and the ID token's absolute expiry on the token at sign-in.
- On every `jwt` callback invocation (not just first sign-in), the system SHALL refresh the Google ID token via Google's token endpoint when it is expired or near expiry, replacing the stored ID token and expiry.
- When a refresh fails (e.g. revoked/expired refresh token), the system SHALL mark the session as errored so the user is routed back to re-authenticate rather than continuing with a dead token.
- The session callback SHALL continue to expose a valid (refreshed) ID token; downstream backend calls via the axios instance are unchanged.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `user-authentication`: add requirements for obtaining a refresh token at sign-in, refreshing the Google ID token before expiry within the `jwt` callback, and handling refresh failure by forcing re-authentication.

## Impact

- Code: `auth.ts` (jwt/session callbacks, refresh logic), `app/onboarding/page.tsx` (base sign-in requests offline access), `types/next-auth.d.ts` (new JWT/Session fields: `refreshToken`, `expiresAt`, `error`).
- External: adds a server-to-server call to Google's OAuth token endpoint (`https://oauth2.googleapis.com/token`) during the `jwt` callback when refreshing.
- Behavior: first-time and re-consent sign-ins show Google's consent screen (`prompt=consent`); existing sessions keep working past the 1-hour mark without 401s.
- No backend API contract change; the backend still receives a Google ID token as `Authorization: Bearer`.
