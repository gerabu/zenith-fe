# calendar-connection Specification

## Purpose
TBD - created by archiving change connect-google-calendar. Update Purpose after archive.
## Requirements
### Requirement: Reusable connect-calendar control

The system SHALL provide a single reusable "Connect Google Calendar" control that, when activated, starts an incremental Google OAuth sign-in requesting the `https://www.googleapis.com/auth/calendar.events.readonly` scope in addition to the identity scopes, using offline access so Google issues a refresh token. The same control SHALL be usable on both the onboarding connect-calendar step and the calendar view.

#### Scenario: User starts the calendar connection

- **WHEN** the user activates the "Connect Google Calendar" control
- **THEN** the system redirects to Google's OAuth consent screen requesting read-only calendar access with offline/consent parameters so a refresh token is returned

#### Scenario: Control is reused across surfaces

- **WHEN** the control is rendered on the onboarding connect-calendar step and on the not-connected alert
- **THEN** both surfaces use the same component and trigger the same scope-granting sign-in

### Requirement: Persist calendar credentials on grant

When a Google sign-in returns an account whose granted scopes include `calendar.events.readonly`, the system SHALL send the account's access token and refresh token to the backend `PATCH /auth/calendar-connection` endpoint so the backend can persist the calendar connection.

#### Scenario: Calendar scope granted

- **WHEN** the NextAuth `jwt` callback runs with an `account` whose `scope` includes `calendar.events.readonly`
- **THEN** the system calls `PATCH /auth/calendar-connection` with `{ accessToken, refreshToken }` taken from the account, authorized with the Google ID token

#### Scenario: Sign-in without calendar scope

- **WHEN** the `jwt` callback runs with an `account` whose scopes do NOT include `calendar.events.readonly`
- **THEN** the system does not call `PATCH /auth/calendar-connection`

#### Scenario: Persisting the connection fails

- **WHEN** the `PATCH /auth/calendar-connection` call returns an error or is unreachable
- **THEN** the system does not report the calendar as connected and leaves the not-connected prompt visible so the user can retry

### Requirement: Calendar connection state on the session

The system SHALL expose a `calendarConnected` boolean on the session so the UI can determine whether the user's Google Calendar is linked. The flag SHALL be true after a successful credential persist, and SHALL otherwise reflect the backend's connection state reported on sign-in.

#### Scenario: Flag true after connecting

- **WHEN** the calendar credentials are successfully persisted during sign-in
- **THEN** the session's `calendarConnected` is `true`

#### Scenario: Flag reflects backend state on sign-in

- **WHEN** a user signs in and the backend reports the user's calendar connection status
- **THEN** the session's `calendarConnected` reflects that status without an additional per-render backend call

### Requirement: Not-connected alert on the calendar view

When the authenticated user has not connected their Google Calendar, the calendar view SHALL display an alert explaining that connecting the calendar is required to book events, and the alert SHALL embed the reusable connect-calendar control.

#### Scenario: Unconnected user sees the alert

- **WHEN** an authenticated user whose `calendarConnected` is false opens the calendar view
- **THEN** the system shows an alert stating the calendar must be connected to book events, including the "Connect Google Calendar" control

#### Scenario: Connected user does not see the alert

- **WHEN** an authenticated user whose `calendarConnected` is true opens the calendar view
- **THEN** the system does not show the connect-calendar alert

