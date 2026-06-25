## ADDED Requirements

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

## MODIFIED Requirements

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
