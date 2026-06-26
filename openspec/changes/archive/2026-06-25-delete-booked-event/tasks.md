## 1. Carry the booking id through the pipeline

- [x] 1.1 Add optional `id?: string` to `AvailabilityEvent` in `lib/types.ts` (present only on `booked` events)
- [x] 1.2 Add optional `id?: string` to `CalendarEventVM` in `app/calendar/types.ts`
- [x] 1.3 Carry `id` through `toEventVM` in `app/calendar/page.tsx`

## 2. Delete server action

- [x] 2.1 Add `deleteBooking(id: string)` to `app/bookings/actions.ts`: reject empty `id`, call `api.delete(\`/bookings/${id}\`)`, return the `ApiResponse` envelope
- [x] 2.2 `revalidatePath("/calendar")` on success and reuse the existing `backendError` helper for failures

## 3. UI primitives

- [x] 3.1 `pnpm shadcn add alert-dialog`
- [x] 3.2 `pnpm shadcn add sonner`
- [x] 3.3 Mount a single `<Toaster>` in the root layout's client tree

## 4. Delete affordance on booked tiles

- [x] 4.1 In `app/calendar/WeekGrid.tsx`, render a delete control on `EventBlock` only when `status === "booked" && Boolean(event.id)`
- [x] 4.2 Wrap the control in an `AlertDialog` confirm that names the booking
- [x] 4.3 On confirm, call `deleteBooking(event.id)` inside `useTransition`; disable the confirm control while pending
- [x] 4.4 On failure result, call `toast.error(result.error)`; leave the tile in place (revalidation reconciles)

## 5. Verify

- [x] 5.1 Booked event with an `id` shows the control; external and id-less booked events do not
- [x] 5.2 Confirming removes the event from the grid after revalidation; cancelling leaves it
- [x] 5.3 A failed delete shows an error toast and keeps the event
- [x] 5.4 `pnpm lint` and `pnpm test` pass
