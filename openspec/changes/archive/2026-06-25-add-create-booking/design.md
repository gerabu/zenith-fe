## Context

The calendar view (`app/calendar/`) renders weekly availability in the viewer's IANA timezone and already computes `calendarConnected` per render (`app/calendar/page.tsx`). There is no way to create a booking yet. ARCHITECTURE.md prescribes react-hook-form + zod + Server Actions for mutations, but none of those libraries are installed — this change introduces them for the first time. The backend exposes `POST /bookings` and returns the standard `ApiResponse<T>` envelope from `lib/types.ts`. The shared axios instance (`lib/api.ts`) attaches the Bearer ID token **only server-side** (`typeof window === "undefined"`), which constrains where the request can originate.

## Goals / Non-Goals

**Goals:**
- A reusable Create Booking modal + form (title, startTime, endTime) with the required-field, end-after-start, and ≥15-minute rules.
- A single zod schema shared by the client resolver and the server action.
- Create the booking through a Server Action calling `api.post`, then revalidate the calendar.
- Surface backend `ApiResponse` errors in a destructive alert inside the form.
- Disable the trigger when the calendar is not connected.

**Non-Goals:**
- The full ADR-002 upsell modal (clicking a disabled action to launch a "Connect Google Calendar" CTA). Only trigger disabling is in scope.
- Editing or cancelling bookings.
- Introducing React Query — this mutation does not need it (Server Action path).
- A custom date/time picker; native `datetime-local` inputs are sufficient for the MVP.

## Decisions

### Server Action over client-side mutation
The axios interceptor attaches auth only when `typeof window === "undefined"`. A client-side `api.post("/bookings")` would be unauthenticated and rejected, and it would contradict ARCHITECTURE.md ("Mutations go through Server Actions"). So `createBooking` lives in `app/bookings/actions.ts` (`"use server"`), calls `api.post<ApiResponse<Booking>>`, and returns the discriminated union. It also `revalidatePath("/calendar")` on success so the RSC week grid re-fetches and shows the new booking. *Alternative considered:* React Query `useMutation` from the client — rejected for the auth and architecture reasons above.

### Shared zod schema
`app/bookings/schema.ts` exports `bookingSchema` used by both `zodResolver` (client) and `bookingSchema.safeParse` (server). The cross-field rules (`endTime > startTime`, `>= 15 min`) are expressed with `.refine`/`.superRefine`. *Alternative:* duplicate validation on each side — rejected; risks drift between client and server.

### Timezone handling — convert client-side
Native `datetime-local` yields a zoneless wall-clock string. Converting to ISO/UTC inside the server action would reinterpret it in the server's zone (wrong). The client converts wall-clock → ISO 8601 UTC (browser zone == viewer zone) before invoking the action; the schema validates/transports ISO strings. This keeps booking timestamps consistent with `Slot` (UTC ISO) used by availability. *Alternative:* send wall-clock + an explicit IANA zone and convert server-side — more robust but heavier; deferred.

### Error surfacing
The action never throws (per ARCHITECTURE). On `{ success: false, error }` the modal renders the message in `<Alert variant="destructive">` and stays open with input preserved. react-hook-form's `isSubmitting` drives the disabled/loading state.

### Connection gating via prop
The calendar page already knows `calendarConnected`; it is passed to the modal trigger which is `disabled` when false. No new fetch. The richer upsell interception is deferred (Non-Goal).

### Types and backend contract
`lib/types.ts` gains `Booking` (`id`, `userId`, `title`, `startTime`, `endTime`, `createdAt`) and `BookingInput` (`title`, `startTime`, `endTime`). Note the backend uses `startTime`/`endTime` field names, distinct from `Slot`'s `start`/`end`.

### Component placement
The modal is shared (`components/CreateBookingModal.tsx`) since it is intended to be reusable beyond the calendar route, consistent with the rule that components used across routes are promoted out of `app/`. shadcn `dialog`, `form`, and `label` are added to `components/ui/`.

## Risks / Trade-offs

- **Timezone conversion in the wrong layer silently shifts every booking** → Convert client-side and transport ISO UTC; cover the boundary with a unit test on the conversion helper.
- **New dependencies (react-hook-form, zod, @hookform/resolvers) introduced for the first time** → They are already mandated by ARCHITECTURE.md; pin versions and run `pnpm test`/`pnpm build` after adding.
- **Backend response shape assumption** → Modeled from the confirmed contract (`id`, `userId`, `title`, `startTime`, `endTime`, `createdAt`); if it differs, only `Booking` in `lib/types.ts` changes.
- **Stale read after create** → `revalidatePath("/calendar")` ensures the RSC week grid reflects the new booking; no client cache to invalidate since React Query is not used here.
- **shadcn `base-maia` / `@base-ui/react` dialog availability** → Use `pnpm shadcn add`; do not change the configured style or primitive library.
