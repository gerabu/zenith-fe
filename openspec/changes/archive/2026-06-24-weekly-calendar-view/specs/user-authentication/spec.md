## MODIFIED Requirements

### Requirement: Expose the ID token on the session

The system SHALL expose the Google ID token on the session via the NextAuth `session` callback so that authenticated backend requests can later inject it as a Bearer token. The session SHALL additionally expose the authenticated user's name and email so the UI can display the user's identity.

#### Scenario: Token available on session

- **WHEN** the NextAuth `session` callback runs for an authenticated user
- **THEN** the returned session includes the Google ID token captured during the `jwt` callback

#### Scenario: User identity available on session

- **WHEN** the NextAuth `session` callback runs for an authenticated user
- **THEN** the returned session exposes the user's name and email (on `session.user`) so the calendar sidebar can render them
