# user-authentication Specification

## Purpose

Authenticate users via Google (NextAuth/Auth.js v5), capture the Google-issued ID token for backend authorization, sync the user with the backend on sign-in, and expose the session (token plus user identity) to the rest of the app.
## Requirements
### Requirement: Google sign-in via NextAuth

The system SHALL allow a user to sign in using their Google account through NextAuth (Auth.js v5), with Google configured as the only authentication provider.

#### Scenario: User initiates Google sign-in

- **WHEN** an unauthenticated user triggers the sign-in action
- **THEN** the system redirects them to Google's OAuth consent screen and, on approval, returns them to the app with an authenticated session

#### Scenario: Sign-in is cancelled or fails

- **WHEN** the user denies consent or Google returns an OAuth error
- **THEN** the system does not create a session and returns the user to the sign-in entry point with no partial state persisted

### Requirement: Capture the Google-issued ID token

The system SHALL capture and retain the Google-issued ID token (the cryptographically verifiable JWT) from the OAuth response, and SHALL NOT use the opaque access token in its place for backend authorization. On first sign-in the system SHALL additionally persist, on the NextAuth token, the refresh token and the ID token's absolute expiry time so the token can be refreshed before it expires.

#### Scenario: ID token captured on first sign-in

- **WHEN** the NextAuth `jwt` callback runs with an `account` present (first sign-in)
- **THEN** the system stores the Google `id_token` on the NextAuth token so it is available to subsequent callbacks

#### Scenario: Refresh material persisted on first sign-in

- **WHEN** the NextAuth `jwt` callback runs with an `account` present that includes a refresh token and expiry
- **THEN** the system persists the `refresh_token` and the ID token's absolute expiry time on the NextAuth token

### Requirement: Backend user sync on sign-in

The system SHALL call the backend `GET /auth/sync` endpoint during the NextAuth `jwt` callback on first sign-in, sending the Google ID token in an `Authorization: Bearer {id_token}` header so the backend can validate it and register or find the user. The sync response SHALL be used to seed the user's calendar connection state (`calendarConnected`) on the token.

#### Scenario: Successful sync

- **WHEN** a user signs in for the first time in a session and `GET /auth/sync` returns success
- **THEN** the system completes sign-in and the user exists (created or found) in the backend database

#### Scenario: Sync sends the verifiable token, not the opaque one

- **WHEN** the system calls `/auth/sync`
- **THEN** the `Authorization` header carries the Google `id_token` (JWT), never the opaque access token

#### Scenario: Sync reports calendar connection state

- **WHEN** `GET /auth/sync` returns the user's calendar connection status
- **THEN** the system seeds `calendarConnected` on the token from that status so the session reflects it

#### Scenario: Backend sync fails

- **WHEN** the backend `/auth/sync` call returns an error or is unreachable
- **THEN** the system surfaces the failure rather than silently issuing a session that the backend does not recognize

### Requirement: Expose the ID token on the session

The system SHALL expose the Google ID token on the session via the NextAuth `session` callback so that authenticated backend requests can later inject it as a Bearer token. The session SHALL additionally expose the authenticated user's name and email so the UI can display the user's identity, and a `calendarConnected` boolean indicating whether the user's Google Calendar is linked.

#### Scenario: Token available on session

- **WHEN** the NextAuth `session` callback runs for an authenticated user
- **THEN** the returned session includes the Google ID token captured during the `jwt` callback

#### Scenario: User identity available on session

- **WHEN** the NextAuth `session` callback runs for an authenticated user
- **THEN** the returned session exposes the user's name and email (on `session.user`) so the calendar sidebar can render them

#### Scenario: Calendar connection state available on session

- **WHEN** the NextAuth `session` callback runs for an authenticated user
- **THEN** the returned session exposes `calendarConnected` reflecting the value carried on the token

### Requirement: Backend axios instance

The system SHALL provide a single typed axios instance targeting the backend API, configured to later inject the Bearer ID token, and all client-side backend HTTP calls SHALL go through it rather than calling axios directly.

#### Scenario: Instance points at the backend base URL

- **WHEN** application code needs to call the backend API
- **THEN** it imports the shared axios instance, which is configured with the backend base URL from environment configuration

### Requirement: Incremental calendar authorization in the jwt callback

The NextAuth `jwt` callback SHALL detect when a returned `account` was granted the `calendar.events.readonly` scope and, in that case, persist the account's calendar tokens to the backend and mark the token as calendar-connected. Detection SHALL be based on the account's granted `scope`.

#### Scenario: Calendar scope present on the account

- **WHEN** the `jwt` callback runs with an `account` whose `scope` includes `https://www.googleapis.com/auth/calendar.events.readonly`
- **THEN** the system calls `PATCH /auth/calendar-connection` with the account's `access_token` and `refresh_token` and, on success, sets `calendarConnected` to true on the token

#### Scenario: Calendar scope absent on the account

- **WHEN** the `jwt` callback runs with an `account` whose `scope` does not include the calendar read-only scope
- **THEN** the system does not call `PATCH /auth/calendar-connection`

### Requirement: Obtain a refresh token for every session

The base Google sign-in SHALL request offline access so that every authenticated session — not only sessions that grant calendar access — obtains a refresh token capable of renewing the Google ID token. The sign-in SHALL request offline access (`access_type=offline`) and force consent (`prompt=consent`) so Google reliably returns a refresh token.

#### Scenario: Base sign-in requests offline access

- **WHEN** an unauthenticated user initiates the base Google sign-in
- **THEN** the authorization request includes `access_type=offline` and `prompt=consent` so the OAuth response carries a refresh token

#### Scenario: Refresh token available without calendar connection

- **WHEN** a user completes the base sign-in without granting calendar access
- **THEN** the NextAuth token still carries a refresh token usable to renew the ID token

### Requirement: Refresh the Google ID token before expiry

On every `jwt` callback invocation where no new `account` is present, the system SHALL determine whether the stored ID token is expired or near expiry and, if so, exchange the stored refresh token at Google's OAuth token endpoint for a fresh ID token, replacing the stored ID token and its expiry on the NextAuth token. A still-valid ID token SHALL be returned unchanged without contacting Google.

#### Scenario: Token still valid

- **WHEN** the `jwt` callback runs with no `account` and the stored ID token has not reached its expiry threshold
- **THEN** the system returns the existing token unchanged and does not call Google's token endpoint

#### Scenario: Token expired or near expiry

- **WHEN** the `jwt` callback runs with no `account` and the stored ID token is expired or within the near-expiry threshold
- **THEN** the system exchanges the stored refresh token at Google's token endpoint and updates the NextAuth token with the newly issued ID token and its new expiry

#### Scenario: Session keeps a valid token past one hour

- **WHEN** a session remains active beyond the Google ID token's ~1 hour lifetime
- **THEN** backend requests continue to carry a non-expired ID token and do not receive 401 responses due to an expired token

### Requirement: Handle refresh failure by forcing re-authentication

When refreshing the ID token fails — for example because the refresh token has been revoked or expired — the system SHALL mark the session as errored rather than returning a stale or empty token silently, so the user is routed back to re-authenticate.

#### Scenario: Refresh token rejected by Google

- **WHEN** the system attempts to refresh the ID token and Google's token endpoint returns an error
- **THEN** the system marks the NextAuth token with an error indicator and does not present a renewed, usable session token

#### Scenario: Errored session surfaced to the app

- **WHEN** the session callback runs for a token marked with a refresh error
- **THEN** the session exposes the error indicator so the app can route the user back to sign-in instead of issuing failing backend requests

