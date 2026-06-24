## Context

`/calendar` is currently a placeholder RSC page. Auth is in place (NextAuth v5, Google-only, JWT strategy) and exposes a Google ID token on the session, but not the user's name/email. The backend exposes `GET /availability/:date` returning `ApiResponse<AvailabilitySlot[]>`. Per ARCHITECTURE.md, RSC pages fetch directly on the server (no axios, no React Query), client interactivity lives in leaf `"use client"` components, and shared state should use React Context (no Redux/Zustand). shadcn (`base-maia` over `@base-ui/react`) is the component source, and sidebar theme tokens already exist in `app/globals.css`.

## Goals / Non-Goals

**Goals:**
- Render a Monday-start weekly view of booked + external events from `GET /availability/:date`.
- Fetch availability for all 7 visible days at the RSC page level (one request per day).
- Show user identity (name, email) in a shadcn sidebar.
- Provide week navigation (prev / next / today) without prop drilling, via React Context.
- Distinguish event sources by background color (primary = booked, secondary = external).

**Non-Goals:**
- Creating, editing, deleting, or sorting events.
- Month / year / day views; sub-hour granularity / overlap layout.
- Client-side caching of availability (React Query) — RSC fetch is sufficient.

## Decisions

### D1: Week state lives in the URL, not just context
The displayed week is derived from a `?week=YYYY-MM-DD` (Monday anchor) search param, defaulting to the current week when absent. This keeps the RSC page as the source of truth so navigation triggers a server re-fetch of availability, and makes the view shareable/bookmarkable. Navigation controls are a small client component that pushes a new `week` param via `useRouter`. *Alternative considered:* holding the week purely in client context and fetching on the client — rejected because it pushes data fetching to the client, contradicting the RSC-first data-flow rule.

### D2: Availability fetched server-side with a dedicated fetcher
Add `lib/availability.ts` exporting a server-side `getWeekAvailability(weekStart, idToken)` that computes the 7 dates and fetches each `GET /availability/:date` in parallel (`Promise.all`) using native `fetch` with `Authorization: Bearer {idToken}`, parsing the `ApiResponse<T>` envelope and honoring mutual exclusivity (success ⇒ data, failure ⇒ error). Native fetch (not the axios instance) follows ARCHITECTURE's RSC rule. *Alternative considered:* a single backend "week" endpoint — not available; the spec mandates per-day calls.

### D3: Context provides serialized week data to client leaves
The RSC page wraps the grid in a `CalendarWeekProvider` (client component) seeded with serializable props: the week's day list and each day's events. Client components (navigation, day columns, event blocks) read from `useCalendarWeek()` instead of receiving drilled props. This satisfies the "avoid prop drilling / use Context" constraint while keeping fetching on the server. *Alternative considered:* passing props down 3-4 levels — rejected per the explicit no-prop-drilling instruction.

### D4: Event placement by start hour into a 24-row grid
Each day column is a CSS grid of 24 one-hour rows (00:00–23:00 local time). An event is placed in the row equal to its slot start hour (`new Date(slot.start).getHours()`). Events with `status === "available"` are filtered out before render. `booked` → `bg-primary text-primary-foreground`; `external` → `bg-secondary text-secondary-foreground`. Multi-hour or overlapping events are placed at their start block only (no overlap resolution — out of scope).

### D5: Session exposes name + email
Extend the NextAuth `jwt` callback to persist `name`/`email` (available from the Google profile / default token) and the `session` callback to surface them on `session.user`. `session.user` already carries name/email via `DefaultSession`, so the main work is ensuring they are populated and typed; update `types/next-auth.d.ts` only if needed. The sidebar reads `session.user.name` / `session.user.email`.

### D6: Sidebar via shadcn
Install the shadcn `sidebar` component (`pnpm shadcn add sidebar`) into `components/ui/`. The calendar layout uses `SidebarProvider` at the component's default sidebar width, with `SidebarInset` holding the grid in the remaining space.

## Risks / Trade-offs

- **7 sequential-looking requests per navigation** → Mitigate by firing them in parallel with `Promise.all`; acceptable for a 7-item fan-out.
- **Timezone ambiguity** (slots are ISO/UTC, grid is hour-based) → Render using the browser/server local hour consistently; document that placement uses local time. Server and client must agree — derive hour on the server during RSC render to avoid hydration mismatch.
- **Partial week failure** (one day's `/availability` fails) → The fetcher returns a per-day error marker so one failed day degrades to an empty/error column rather than failing the whole page.
- **Multi-hour / overlapping events not laid out** → Accepted; only start-block placement is in scope. Revisit when booking UI lands.
- **`week` param tampering** (invalid date) → Normalize/validate the param to a Monday; fall back to the current week on invalid input.
