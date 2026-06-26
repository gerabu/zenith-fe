# booking-deletion Specification

## Purpose
Deleting an internal booking — the `DELETE /bookings/:id` server action, restricting deletion to internal booked events that carry an `id`, requiring explicit confirmation before deleting, and surfacing failures as a toast.

## Requirements
### Requirement: Delete booking via server action

On request the system SHALL delete an internal booking by sending `DELETE /bookings/:id` through the shared axios instance from within a server action, so the authenticated Bearer token is attached server-side. The action SHALL accept the booking `id` and SHALL NOT throw — it SHALL return the standard `ApiResponse` envelope, mirroring the existing create-booking action. On success the calendar view SHALL be revalidated so the deleted booking disappears.

#### Scenario: Successful deletion

- **WHEN** the action is called with a valid booking `id` and the backend responds with a success `ApiResponse`
- **THEN** the booking is deleted, the calendar view is revalidated, and the deleted event no longer appears in the grid

#### Scenario: Backend rejects the deletion

- **WHEN** the backend responds with `{ success: false, error }` (e.g. the booking no longer exists or is not the user's)
- **THEN** the action returns the failure `ApiResponse` carrying the backend `error` message and does not revalidate

#### Scenario: Missing or empty id

- **WHEN** the action is called with a missing or empty `id`
- **THEN** the action returns a failure result without calling the backend

### Requirement: Deletion restricted to internal bookings

The system SHALL only offer deletion for events whose `status` is `booked` and that carry an `id`. External (Google Calendar) events and booked events without an `id` SHALL NOT expose a delete affordance.

#### Scenario: External event has no delete control

- **WHEN** an event has `status: "external"`
- **THEN** no delete control is rendered for it

#### Scenario: Booked event without an id has no delete control

- **WHEN** an event has `status: "booked"` but no `id`
- **THEN** no delete control is rendered for it

#### Scenario: Booked event with an id is deletable

- **WHEN** an event has `status: "booked"` and an `id`
- **THEN** a delete control is rendered for it

### Requirement: Confirmation before deletion

The system SHALL require explicit confirmation before deleting a booking. Activating the delete control SHALL open a confirmation dialog identifying the booking, and the booking SHALL only be deleted after the user confirms. Dismissing or cancelling the dialog SHALL leave the booking unchanged.

#### Scenario: User confirms deletion

- **WHEN** the user activates the delete control and confirms in the dialog
- **THEN** the delete server action is called for that booking's `id`

#### Scenario: User cancels deletion

- **WHEN** the user activates the delete control and then cancels or dismisses the dialog
- **THEN** no delete request is sent and the booking remains on the calendar

### Requirement: Failed deletion surfaced as a toast

When deletion fails, the system SHALL surface the failure to the user as a toast notification, and the booking SHALL remain on the calendar.

#### Scenario: Deletion fails

- **WHEN** the delete server action returns a failure result
- **THEN** the system shows an error toast and the booking remains rendered in the grid
