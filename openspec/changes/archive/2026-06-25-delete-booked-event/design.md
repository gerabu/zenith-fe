## Context

The booking lifecycle is currently create-and-list only. The `/availability/:date` fetch returns events the calendar renders as tiles, but the pipeline (`AvailabilityEvent` → `toEventVM` → `CalendarEventVM` → `EventBlock`) deliberately keeps only four fields and drops everything else. The backend now returns an `id` on internal (`status: "booked"`) availability events and exposes `DELETE /bookings/:id`, so the missing piece is purely frontend: carry the `id` through and add a delete affordance.

The create path is the template. `createBooking` (`app/bookings/actions.ts`) is a server action that calls the shared axios instance, returns the `ApiResponse` envelope without throwing, and calls `revalidatePath("/calendar")` on success so the RSC-rendered `WeekGrid` (fed via `CalendarWeekContext`) re-reads from the backend. Delete should mirror this exactly — no React Query, no client cache, revalidation as the single source of truth.

## Goals / Non-Goals

**Goals:**
- Let a user delete their own internal bookings (`status: "booked"`) from the calendar grid.
- Reuse the existing server-action + `ApiResponse` + `revalidatePath` pattern, including the `backendError` helper.
- Guard the affordance so only booked events with an `id` are deletable.
- Confirm before deleting; surface failures clearly.

**Non-Goals:**
- Deleting or editing external (Google Calendar) events — read-only, per ADR-002.
- Editing an existing booking (only create and delete exist).
- Optimistic removal / client-side cache reconciliation — revalidation handles refresh.
- Bulk delete or undo.

## Decisions

**Optional `id`, guarded affordance.** `AvailabilityEvent.id` and `CalendarEventVM.id` are both `id?: string`. The render guard is `status === "booked" && Boolean(event.id)`. Because the `id` is optional even on booked events, a booked event without one degrades to no delete control rather than a broken button — chosen over making `id` required (which would lie about the backend contract) or asserting non-null (which would crash on the contract's own optionality).

**Server action mirrors `createBooking`.** New `deleteBooking(id: string)` in `app/bookings/actions.ts`: validate `id` is non-empty, `api.delete(\`/bookings/${id}\`)`, `revalidatePath("/calendar")` on success, reuse `backendError` for the failure envelope. Keeps both booking mutations co-located and consistent. Alternative — a route handler — was rejected; it adds an HTTP hop and abandons the established action pattern.

**Confirmation via shadcn `alert-dialog`.** `pnpm shadcn add alert-dialog`. The trash control opens an `AlertDialog` naming the booking; confirm triggers the action inside `useTransition` for pending state. `WeekGrid` is already `"use client"`, so `EventBlock` can hold the dialog and transition with no new client boundary. Alternative — reusing the installed `dialog` — was rejected as less idiomatic for a destructive confirm; instant no-confirm delete was rejected as too misclick-prone for a tiny tile.

**Errors via shadcn `sonner` toast.** A delete has no host modal to show an inline `Alert` (unlike create). `pnpm shadcn add sonner`; mount one `<Toaster>` in a client boundary in the root layout; `toast.error(result.error)` on failure. Alternative inline-on-tile error was rejected (the tile is ~4px-padded and cramped).

## Risks / Trade-offs

- **`<Toaster>` reaches outside the calendar feature** → It must mount once in the root layout (or a providers boundary). ARCHITECTURE references a planned `components/providers.tsx` that doesn't exist yet; this change mounts `<Toaster>` directly in the root layout's client tree to avoid scope creep, leaving the providers refactor for later.
- **Concurrent/stale delete (event already gone)** → Backend returns a failure `ApiResponse`; the action surfaces it as a toast and revalidation reconciles the grid. No special-casing needed.
- **No optimistic feedback** → The tile stays until revalidation completes; `useTransition` pending state disables the confirm control so the delay is visible rather than silent. Acceptable for a low-frequency action.
- **Two new shadcn primitives** → `alert-dialog` and `sonner` are standard `base-maia` additions to `components/ui/`; no change to style or underlying primitive library.
