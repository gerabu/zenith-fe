## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Incremental calendar authorization in the jwt callback

The NextAuth `jwt` callback SHALL detect when a returned `account` was granted the `calendar.events.readonly` scope and, in that case, persist the account's calendar tokens to the backend and mark the token as calendar-connected. Detection SHALL be based on the account's granted `scope`.

#### Scenario: Calendar scope present on the account

- **WHEN** the `jwt` callback runs with an `account` whose `scope` includes `https://www.googleapis.com/auth/calendar.events.readonly`
- **THEN** the system calls `PATCH /auth/calendar-connection` with the account's `access_token` and `refresh_token` and, on success, sets `calendarConnected` to true on the token

#### Scenario: Calendar scope absent on the account

- **WHEN** the `jwt` callback runs with an `account` whose `scope` does not include the calendar read-only scope
- **THEN** the system does not call `PATCH /auth/calendar-connection`
