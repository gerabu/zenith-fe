## Why

Users can view their weekly availability but cannot yet create bookings — the core action of the product. We need a reusable Create Booking form that validates input up front and creates a booking via the backend, while respecting the ADR-001/002 rule that booking is blocked until Google Calendar is connected.

## What Changes

- Add a reusable **Create Booking modal** component (dialog + form) usable from anywhere in the app (initially the calendar view).
- Form fields: **title**, **startTime**, **endTime** — all required. Validation: `endTime` must be after `startTime`, with a minimum 15-minute difference between them.
- Validate with a single **zod** schema shared between the **react-hook-form** resolver (client) and the server action (re-validation), per ARCHITECTURE.md.
- On valid submit, a **Server Action** issues `POST /bookings` through the shared axios instance (`lib/api.ts`) and revalidates the calendar so the new booking appears.
- The action returns the standard `ApiResponse<T>` discriminated union; on failure the modal renders the backend error in a destructive `Alert` inside the form.
- The modal **trigger is disabled when the calendar is not connected** (ADR-001 "optional but blocking", ADR-002 read-only state). The full upsell-modal interception is out of scope for this change.
- Introduce the prescribed-but-not-yet-installed dependencies: `react-hook-form`, `zod`, `@hookform/resolvers`, and shadcn `dialog`/`form`/`label` primitives.
- Add `Booking` and `BookingInput` types to `lib/types.ts` matching the backend contract (`id`, `userId`, `title`, `startTime`, `endTime`, `createdAt`).

## Capabilities

### New Capabilities
- `booking-creation`: Creating a booking through a validated form — required fields, end-after-start and minimum-duration rules, the `POST /bookings` server action, error surfacing, and connection-gated access to the form.

### Modified Capabilities
<!-- None: connection gating is expressed as a requirement of booking-creation; existing calendar-connection and weekly-calendar specs are unchanged. -->

## Impact

- **Dependencies**: adds `react-hook-form`, `zod`, `@hookform/resolvers` (first use in repo); adds shadcn `dialog`, `form`, `label` to `components/ui/`.
- **Types**: `lib/types.ts` gains `Booking` and `BookingInput`.
- **New files**: `app/bookings/schema.ts` (shared zod schema), `app/bookings/actions.ts` (`createBooking` server action), `components/CreateBookingModal.tsx` (reusable modal).
- **Touched**: `app/calendar/` to mount the trigger and pass `calendarConnected` (already computed in `app/calendar/page.tsx`).
- **Backend**: depends on `POST /bookings` returning `ApiResponse<Booking>`; auth Bearer token attached server-side by the existing axios interceptor.
- **Timezone**: wall-clock form values are converted to ISO 8601 UTC client-side (browser zone == viewer zone) before reaching the server action, consistent with `Slot` timestamps.
