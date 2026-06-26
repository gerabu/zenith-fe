# booking-creation Specification

## Purpose
Creating a booking through a validated form — required fields, end-after-start and minimum-duration rules, the `POST /bookings` server action, error surfacing, and connection-gated access to the form.

## Requirements
### Requirement: Reusable Create Booking form

The system SHALL provide a reusable Create Booking modal component containing a form with a `title`, a calendar `date`, a `startTime`, and an `endTime`. The `date` SHALL be combined with each time to form the booking's start and end instants. The component SHALL be usable from any route and SHALL not depend on calendar-page-specific state beyond what is passed in as props.

#### Scenario: Opening the form

- **WHEN** a user with a connected calendar activates the Create Booking trigger
- **THEN** a modal dialog opens showing empty `title`, `date`, `startTime`, and `endTime` fields and a submit control

#### Scenario: Closing without submitting

- **WHEN** the user dismisses the modal (close control, backdrop, or escape)
- **THEN** the modal closes and no booking is created

### Requirement: Required-field validation

The system SHALL require `title`, `date`, `startTime`, and `endTime`. Submission SHALL be blocked while any required field is empty, and the offending fields SHALL show a validation message.

#### Scenario: Submitting with a missing field

- **WHEN** the user submits with `title`, `date`, `startTime`, or `endTime` empty
- **THEN** the form does not call the backend and displays a validation message on each empty required field

### Requirement: End time after start time

The system SHALL reject input where the end instant (date + `endTime`) is not strictly after the start instant (date + `startTime`).

#### Scenario: End time before or equal to start time

- **WHEN** the user submits with `endTime` earlier than or equal to `startTime` on the same date
- **THEN** the form does not call the backend and displays a validation message indicating end time must be after start time

### Requirement: Minimum booking duration

The system SHALL reject input where the difference between the end instant and the start instant is less than 15 minutes.

#### Scenario: Duration under 15 minutes

- **WHEN** the user submits with the end instant less than 15 minutes after the start instant
- **THEN** the form does not call the backend and displays a validation message indicating the minimum duration is 15 minutes

#### Scenario: Duration of exactly 15 minutes

- **WHEN** the user submits with the end instant exactly 15 minutes after the start instant and all other fields valid
- **THEN** validation passes and the booking request is sent

### Requirement: Shared validation schema

The system SHALL define the booking validation rules once as zod schemas and reuse the order/duration rules for both the client react-hook-form resolver and the server action re-validation, so client and server enforce identical rules.

#### Scenario: Server rejects invalid input that bypassed the client

- **WHEN** the server action receives input that fails the shared schema
- **THEN** the action returns a failure result without calling the backend

### Requirement: Create booking via server action

On valid submission the system SHALL send `POST /bookings` through the shared axios instance from within a server action, so the authenticated Bearer token is attached server-side. The request body SHALL carry `title`, `startTime`, and `endTime` as ISO 8601 UTC timestamps. On success the calendar view SHALL be revalidated so the new booking appears.

#### Scenario: Successful booking

- **WHEN** the user submits valid input and the backend responds with a success `ApiResponse<Booking>`
- **THEN** the booking is created, the calendar view is revalidated, and the modal reflects success (closes)

#### Scenario: Local times sent as UTC

- **WHEN** the form's `date` and wall-clock `startTime`/`endTime` are submitted
- **THEN** they are combined and converted to ISO 8601 UTC in the viewer's zone before reaching the backend, consistent with existing slot timestamps

### Requirement: Backend error surfaced in the form

When the backend returns a failure `ApiResponse`, the system SHALL display the returned `error` message to the user in a destructive alert inside the form, and SHALL keep the modal open with the entered values preserved.

#### Scenario: Backend rejects the booking

- **WHEN** the backend responds with `{ success: false, error }` (e.g. a calendar conflict)
- **THEN** the form renders the `error` text in a destructive `Alert` and the modal stays open with the user's input intact

### Requirement: Connection-gated access

The system SHALL prevent opening the Create Booking form when the user's Google Calendar is not connected. The trigger SHALL be disabled in that state, consistent with ADR-001 (optional but blocking) and ADR-002 (read-only state).

#### Scenario: Calendar not connected

- **WHEN** the calendar connection state is not connected
- **THEN** the Create Booking trigger is disabled and the form cannot be opened

#### Scenario: Calendar connected

- **WHEN** the calendar connection state is connected
- **THEN** the Create Booking trigger is enabled and opens the form
