## ADDED Requirements

### Requirement: Calendar connection state read per render

The system SHALL determine whether the user's Google Calendar is connected by reading it from the backend on each render that needs it, treating the backend as the single source of truth. The system SHALL call a read-only `GET /auth/calendar-connection` endpoint that returns the standard `ApiResponse` envelope wrapping `{ calendarConnected: boolean }` (i.e. `{ success, data: { calendarConnected } }`), authorized with the session's Google ID token via the shared axios instance. The connection state SHALL NOT be carried on the session or JWT.

#### Scenario: Status read from backend on render

- **WHEN** a surface needs to know whether the calendar is connected
- **THEN** the system calls `GET /auth/calendar-connection` and uses the returned `calendarConnected` value, without reading any `calendarConnected` flag from the session or JWT

#### Scenario: Backend reports connected

- **WHEN** `GET /auth/calendar-connection` returns `{ calendarConnected: true }`
- **THEN** the system treats the user's calendar as connected for that render

#### Scenario: Backend reports not connected

- **WHEN** `GET /auth/calendar-connection` returns `{ calendarConnected: false }`
- **THEN** the system treats the user's calendar as not connected for that render

#### Scenario: Status read fails

- **WHEN** the `GET /auth/calendar-connection` call returns an error or is unreachable
- **THEN** the system treats the user's calendar as not connected (the safe fallback), so the connect prompt remains available

## MODIFIED Requirements

### Requirement: Not-connected alert on the calendar view

When the authenticated user has not connected their Google Calendar, the calendar view SHALL display an alert explaining that connecting the calendar is required to book events, and the alert SHALL embed the reusable connect-calendar control. The view SHALL determine connection state by reading it per render from the backend (per the "Calendar connection state read per render" requirement), not from a session flag.

#### Scenario: Unconnected user sees the alert

- **WHEN** an authenticated user whose backend-reported connection status is false opens the calendar view
- **THEN** the system shows an alert stating the calendar must be connected to book events, including the "Connect Google Calendar" control

#### Scenario: Connected user does not see the alert

- **WHEN** an authenticated user whose backend-reported connection status is true opens the calendar view
- **THEN** the system does not show the connect-calendar alert

#### Scenario: Status read fails on the calendar view

- **WHEN** the connection-status read fails while rendering the calendar view
- **THEN** the system shows the not-connected alert (assuming disconnected)

## REMOVED Requirements

### Requirement: Calendar connection state on the session

**Reason**: The session/JWT flag is a snapshot written only during an OAuth handshake and is never refreshed on ordinary page loads, so it drifts from the backend's true state. It is replaced by a per-render read from the backend (see the new "Calendar connection state read per render" requirement).

**Migration**: Remove `calendarConnected` from the `jwt` and `session` callbacks in `auth.ts` and from the `Session`/`JWT` augmentations in `types/next-auth.d.ts`. Replace every read of `session.calendarConnected` with a call to the per-render backend reader for `GET /auth/calendar-connection`.
