## 1. Dependencies & primitives

- [x] 1.1 Add `react-hook-form`, `zod`, and `@hookform/resolvers` to `package.json` and install with pnpm
- [x] 1.2 Add shadcn `dialog`, `form`, and `label` to `components/ui/` via `pnpm shadcn add` (keep `base-maia` style / `@base-ui/react`)
- [x] 1.3 Verify `pnpm build` still succeeds after the dependency additions

## 2. Types & contract

- [x] 2.1 Add `BookingInput` (`title`, `startTime`, `endTime`) to `lib/types.ts`
- [x] 2.2 Add `Booking` (`id`, `userId`, `title`, `startTime`, `endTime`, `createdAt`) to `lib/types.ts`

## 3. Validation schema

- [x] 3.1 Create `app/bookings/schema.ts` with `bookingSchema`: required `title`, `startTime`, `endTime`
- [x] 3.2 Add `.refine` for `endTime` strictly after `startTime`
- [x] 3.3 Add `.refine` for minimum 15-minute duration (boundary: exactly 15 min passes)
- [x] 3.4 Export the inferred `BookingInput` type and reuse it across resolver and action
- [x] 3.5 Unit-test the schema: required, end-before-start, <15 min, exactly 15 min

## 4. Timezone conversion helper

- [x] 4.1 Add a helper that converts a wall-clock `datetime-local` value to ISO 8601 UTC in the viewer's zone
- [x] 4.2 Unit-test the conversion against the existing timezone utilities

## 5. Server action

- [x] 5.1 Create `app/bookings/actions.ts` with `"use server"` and `createBooking(input: BookingInput)`
- [x] 5.2 Re-validate input with `bookingSchema.safeParse`; return failure without calling the backend if invalid
- [x] 5.3 Call `api.post<ApiResponse<Booking>>("/bookings", ...)` via the shared axios instance
- [x] 5.4 Map the response to `{ success: true, data } | { success: false, error }` (never throw)
- [x] 5.5 On success, `revalidatePath("/calendar")`

## 6. Create Booking modal

- [x] 6.1 Create `components/CreateBookingModal.tsx` (`"use client"`) with dialog + react-hook-form using `zodResolver(bookingSchema)`
- [x] 6.2 Render `title`, `startTime`, `endTime` fields with inline validation messages
- [x] 6.3 On submit, convert times to ISO UTC and invoke `createBooking`
- [x] 6.4 On failure, render the backend `error` in `<Alert variant="destructive">` and keep the modal open with input preserved
- [x] 6.5 On success, close the modal; disable submit while `isSubmitting`
- [x] 6.6 Accept a `calendarConnected`/`disabled` prop and disable the trigger when the calendar is not connected

## 7. Mount in calendar view

- [x] 7.1 Render the Create Booking trigger in the calendar (e.g. header in `app/calendar/page.tsx`), passing `calendarConnected`
- [x] 7.2 Manually verify: disabled when disconnected; connected flow creates a booking and the week grid refreshes; backend error shows in the destructive alert

## 8. Verify

- [x] 8.1 Run `pnpm lint` and `pnpm test`
- [x] 8.2 Confirm all booking-creation spec scenarios are satisfied
