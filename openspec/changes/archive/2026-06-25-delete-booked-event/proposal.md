## Why

Users can list and create internal bookings but have no way to remove one — a mistaken or no-longer-needed booking stays on the calendar (and keeps blocking its slot) forever. The backend now exposes `DELETE /bookings/:id`, and `/availability` returns the booking `id` on internal events, so the frontend can finally close the loop on the booking lifecycle.

## What Changes

- Surface the booking `id` returned by `/availability` (present only on `status: "booked"` events) through the availability → view-model → calendar-grid pipeline, which currently drops it.
- Add a `deleteBooking(id)` server action that calls `DELETE /bookings/:id` through the shared axios instance and revalidates `/calendar` on success, mirroring the existing `createBooking` action and its error envelope.
- Add a delete affordance to booked event tiles — shown only when the event is `status: "booked"` **and** carries an `id`. External (Google) events and id-less bookings get no affordance.
- Confirm deletion with a confirmation dialog (shadcn `alert-dialog`) before calling the action; surface a failed delete as a toast (shadcn `sonner`).

## Capabilities

### New Capabilities
- `booking-deletion`: deleting an internal booking — the `DELETE /bookings/:id` server action, confirmation before deletion, calendar revalidation on success, and toast-based error surfacing on failure.

### Modified Capabilities
- `weekly-calendar`: booked events now carry their `id` through the availability fetch and view model, and booked event tiles expose a delete control (only when an `id` is present).

## Impact

- **Types**: `AvailabilityEvent` (`lib/types.ts`) and `CalendarEventVM` (`app/calendar/types.ts`) gain an optional `id`.
- **Pipeline**: `toEventVM` (`app/calendar/page.tsx`) carries the `id` through.
- **Server action**: new `deleteBooking` in `app/bookings/actions.ts`, reusing the `backendError` helper.
- **UI**: `EventBlock` in `app/calendar/WeekGrid.tsx` gains the delete affordance + confirm flow + `useTransition` pending state.
- **New primitives**: `components/ui/alert-dialog.tsx` and `components/ui/sonner.tsx` via `pnpm shadcn add`; a single `<Toaster>` mounted once in a client boundary (root layout).
- **Backend dependency**: relies on the new `DELETE /bookings/:id` endpoint and the optional `id` on availability `booked` events.
