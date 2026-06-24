## Why

A user can sign in, but `/calendar` is a placeholder ("Booking view coming soon") with no way to see what is booked. Users need to view their booked time so they can understand their availability before the booking flow is built.

## What Changes

- Replace the placeholder `/calendar` page with a two-pane layout: a left sidebar and a weekly calendar view filling the remaining space.
- Add a shadcn `sidebar` component showing the signed-in user's name and email.
- Render a **weekly** calendar (Monday-start) with week-navigation controls (previous / next / today); the default week is the one containing the current date.
- Each day column is a vertical 24-block grid (one block per hour). Events are placed in the block matching their start hour.
- Distinguish event sources by background color: `booked` (internal) uses the **primary** background, `external` uses the **secondary** background. `available` slots are not rendered.
- Fetch daily availability at the page (RSC) level by calling `GET /availability/:date` (date as `YYYY-MM-DD`) once per day of the displayed week.
- Extend the NextAuth `session` callback to expose the user's name and email so the sidebar can display them.
- Introduce a React Context to share the displayed week / availability data with client components (navigation), avoiding prop drilling. No Redux/Zustand.

### Out of scope

Creating bookings, deleting events, sorting events, and any yearly / monthly / daily calendar views.

## Capabilities

### New Capabilities
- `weekly-calendar`: Viewing booked and external events in a Monday-start weekly grid, including week navigation and the per-day availability fetch + rendering rules.

### Modified Capabilities
- `user-authentication`: The session must additionally expose the authenticated user's name and email (currently only the ID token is exposed) so the calendar sidebar can render user identity.

## Impact

- **Pages / layout**: `app/calendar/page.tsx` (rewritten to fetch availability and compose the layout); a calendar layout/route segment.
- **Auth**: `auth.ts` (`session` callback), `types/next-auth.d.ts` (session typing).
- **Data**: new server-side fetcher for `GET /availability/:date`; shared availability/event types in `lib/`.
- **UI**: new shadcn `sidebar` component in `components/ui/`; calendar feature components (sidebar content, week grid, day column, event block, navigation controls); a React Context provider for the displayed week.
- **Backend dependency**: relies on `GET /availability/:date` returning `ApiResponse<{ status, slot, title }[]>` with `status ∈ available | booked | external`.
