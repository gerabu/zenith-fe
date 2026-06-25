# weekly-calendar Specification

## Purpose

Let a signed-in user view their booked and external events for a Monday-start week at `/calendar`: a sidebar with their identity, week navigation, and a 24-hour day grid that places each event in its start-hour block and distinguishes internal (booked) from external sources by color. Availability is fetched per day at the page level.
## Requirements
### Requirement: Weekly calendar layout with sidebar

The system SHALL render the `/calendar` route as a two-pane layout: a left sidebar and a weekly calendar view filling the remaining space. The sidebar SHALL be a shadcn `sidebar` component at its default width and SHALL display the signed-in user's name and email.

#### Scenario: Authenticated user opens the calendar

- **WHEN** an authenticated user navigates to `/calendar`
- **THEN** the system renders the sidebar showing their name and email and a weekly calendar view filling the remaining width

#### Scenario: Unauthenticated user opens the calendar

- **WHEN** an unauthenticated user navigates to `/calendar`
- **THEN** the system redirects them to the sign-in entry point instead of rendering the calendar

### Requirement: Monday-start weekly view defaulting to the current week

The system SHALL display exactly seven day columns for one week, with the week starting on Monday. When no week is specified, the system SHALL default to the week containing the current date.

#### Scenario: Default week on first load

- **WHEN** a user opens `/calendar` without specifying a week
- **THEN** the system displays the Monday-to-Sunday week that contains the current date

#### Scenario: Week always starts on Monday

- **WHEN** any week is displayed
- **THEN** the leftmost day column is Monday and the rightmost is Sunday

### Requirement: Week navigation controls

The system SHALL provide controls to navigate to the previous week, the next week, and back to the current week, updating the displayed week and its data accordingly. The current-week control SHALL target the week containing the viewer's local current date.

#### Scenario: Navigate to the previous week

- **WHEN** the user activates the previous-week control
- **THEN** the system displays the seven days of the immediately preceding Monday-start week and loads that week's availability

#### Scenario: Navigate to the next week

- **WHEN** the user activates the next-week control
- **THEN** the system displays the seven days of the immediately following Monday-start week and loads that week's availability

#### Scenario: Return to the current week

- **WHEN** the user activates the "today"/current-week control while viewing another week
- **THEN** the system displays the Monday-start week containing the viewer's local current date

### Requirement: Per-day availability fetch at page level

The system SHALL fetch availability for each of the seven displayed days at the page (server) level by calling `GET /availability/:date`, where `:date` is formatted as `YYYY-MM-DD`. Requests SHALL be authorized with the user's Google ID token via an `Authorization: Bearer {idToken}` header, and the response SHALL be parsed as `ApiResponse<T>` honoring mutual exclusivity (success implies `data`; failure implies `error`).

#### Scenario: Successful availability fetch for the week

- **WHEN** the calendar page renders a given week
- **THEN** the system issues one `GET /availability/:date` request per day (seven total) with each date formatted `YYYY-MM-DD` and uses the returned `data` to populate that day's column

#### Scenario: A single day's availability fails

- **WHEN** one day's `GET /availability/:date` returns `success: false` or is unreachable
- **THEN** that day's column degrades gracefully (empty/error state) without preventing the rest of the week from rendering

### Requirement: Hourly 24-block day grid

The system SHALL render each day column as a vertical grid of 24 blocks, one per hour of the day, and SHALL place each rendered event in the block corresponding to its start hour.

#### Scenario: Event placed in its start-hour block

- **WHEN** a day has an event whose slot start falls within a given hour
- **THEN** the event is rendered in that hour's block within the day column

### Requirement: Event source rendering and filtering

The system SHALL render only events whose `status` is `booked` or `external`, and SHALL NOT render events whose `status` is `available`. Events with `status` `booked` SHALL use the primary background color and events with `status` `external` SHALL use the secondary background color, so the two sources are visually distinguishable. Each event SHALL display its `title`.

#### Scenario: Booked (internal) event styling

- **WHEN** an event has `status: "booked"`
- **THEN** it is rendered with the primary background color and its title is shown

#### Scenario: External event styling

- **WHEN** an event has `status: "external"`
- **THEN** it is rendered with the secondary background color and its title is shown

#### Scenario: Available slots are not shown

- **WHEN** an event has `status: "available"`
- **THEN** it is not rendered in the calendar

### Requirement: Share week state without prop drilling

The system SHALL share the displayed week and its availability data with interactive client components through a React Context rather than threading the data through intermediate component props. The system SHALL NOT introduce an external state library (e.g., Redux, Zustand) for this.

#### Scenario: Navigation and grid read shared week state

- **WHEN** the navigation controls and day/event components need the current week and its events
- **THEN** they read from a shared React Context provided at the calendar level, without receiving the data as drilled props through unrelated intermediate components

### Requirement: Today and current-time reflect the viewer's local timezone

The system SHALL determine which day column is "today" and the position of the current-time marker using the viewer's local timezone, not UTC. The day column whose calendar date equals the viewer's local current date SHALL be the highlighted "today" column, and the current-time marker SHALL be positioned by the viewer's local minutes since midnight. This determination SHALL run on the client so it follows the viewer's timezone, and SHALL NOT introduce a server/client hydration mismatch.

#### Scenario: Today highlight follows local date

- **WHEN** the viewer's local current date differs from the UTC date (their local time is behind or ahead of UTC)
- **THEN** the system highlights the day column matching the viewer's local current date, not the UTC date

#### Scenario: Current-time marker uses local time

- **WHEN** the calendar shows the week containing the viewer's local today
- **THEN** the current-time marker is drawn on the local-today column at the position corresponding to the viewer's local time of day

#### Scenario: Today not in the displayed week

- **WHEN** the displayed week does not contain the viewer's local current date
- **THEN** no day column is highlighted as today and no current-time marker is shown

