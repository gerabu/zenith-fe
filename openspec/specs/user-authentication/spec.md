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

The system SHALL capture and retain the Google-issued ID token (the cryptographically verifiable JWT) from the OAuth response, and SHALL NOT use the opaque access token in its place for backend authorization.

#### Scenario: ID token captured on first sign-in

- **WHEN** the NextAuth `jwt` callback runs with an `account` present (first sign-in)
- **THEN** the system stores the Google `id_token` on the NextAuth token so it is available to subsequent callbacks

### Requirement: Backend user sync on sign-in

The system SHALL call the backend `GET /auth/sync` endpoint during the NextAuth `jwt` callback on first sign-in, sending the Google ID token in an `Authorization: Bearer {id_token}` header so the backend can validate it and register or find the user.

#### Scenario: Successful sync

- **WHEN** a user signs in for the first time in a session and `GET /auth/sync` returns success
- **THEN** the system completes sign-in and the user exists (created or found) in the backend database

#### Scenario: Sync sends the verifiable token, not the opaque one

- **WHEN** the system calls `/auth/sync`
- **THEN** the `Authorization` header carries the Google `id_token` (JWT), never the opaque access token

#### Scenario: Backend sync fails

- **WHEN** the backend `/auth/sync` call returns an error or is unreachable
- **THEN** the system surfaces the failure rather than silently issuing a session that the backend does not recognize

### Requirement: Expose the ID token on the session

The system SHALL expose the Google ID token on the session via the NextAuth `session` callback so that authenticated backend requests can later inject it as a Bearer token. The session SHALL additionally expose the authenticated user's name and email so the UI can display the user's identity.

#### Scenario: Token available on session

- **WHEN** the NextAuth `session` callback runs for an authenticated user
- **THEN** the returned session includes the Google ID token captured during the `jwt` callback

#### Scenario: User identity available on session

- **WHEN** the NextAuth `session` callback runs for an authenticated user
- **THEN** the returned session exposes the user's name and email (on `session.user`) so the calendar sidebar can render them

### Requirement: Backend axios instance

The system SHALL provide a single typed axios instance targeting the backend API, configured to later inject the Bearer ID token, and all client-side backend HTTP calls SHALL go through it rather than calling axios directly.

#### Scenario: Instance points at the backend base URL

- **WHEN** application code needs to call the backend API
- **THEN** it imports the shared axios instance, which is configured with the backend base URL from environment configuration

