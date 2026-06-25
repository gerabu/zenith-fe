## Context

`calendarConnected` is written into the NextAuth JWT only when the `jwt` callback runs with an `account` present — i.e. only during a Google OAuth handshake (`auth.ts:17-61`). The `session` callback copies it onto `session.calendarConnected` (`auth.ts:69-70`). On every ordinary request the `jwt` callback runs without `account` and returns the token unchanged, so the backend is never re-consulted. The flag is therefore a snapshot frozen at sign-in time.

Two surfaces consume it:
- `app/calendar/page.tsx:121` gates `ConnectCalendarAlert` on `!session.calendarConnected`.
- `app/onboarding/connect-calendar/page.tsx` performs **no** connection check and always renders the connect step.

The backend already owns this state: `auth.ts` persists it via `PATCH /auth/calendar-connection` and reads it once at sign-in via `GET /auth/sync`. The user has confirmed `/auth/sync` is idempotent but prefers a dedicated read-only endpoint. The `/calendar` page is already an RSC that performs per-render backend calls (`getWeekAvailability` issues 7), so adding one cheap status read fits the existing pattern and ARCHITECTURE.md's "RSC pages fetch directly on the server."

## Goals / Non-Goals

**Goals:**
- Make calendar-connection state reflect the backend's truth on every gated render.
- Fix the stale `/calendar` alert and the unconditional `/onboarding/connect-calendar` prompt.
- Keep the backend as the single source of truth; eliminate the drift-prone session snapshot.

**Non-Goals:**
- Changing the connect flow itself (the reusable control, the incremental OAuth scope grant, or the `PATCH /auth/calendar-connection` persist on grant).
- Changing `GET /auth/sync`'s role at sign-in.
- Client-side caching / React Query for connection status (reads happen in RSCs).
- Real-time push of connection changes; per-render read on navigation is sufficient.

## Decisions

### Decision: Read connection status per render from a dedicated backend GET

Add `GET /auth/calendar-connection → { calendarConnected: boolean }`, read in the RSCs that gate on it via the shared axios instance (`lib/api.ts`), which attaches the session ID token server-side.

- **Why over reusing `GET /auth/sync`**: even though `/auth/sync` is idempotent, its name and intent are "sync this user on sign-in." A dedicated read-only endpoint keeps the two concerns separate and stays cheap regardless of how `sync` evolves. (User decision.)
- **Why over a TTL-refresh of the JWT claim**: a refresh window still serves stale values and still can't reflect a cross-device connect instantly; it also pushes a backend call into the auth hot path on requests that don't need the flag.
- **Why over deriving "connected" from the availability payload**: couples two concerns and is ambiguous — a connected-but-empty calendar looks unconnected.

### Decision: Remove `calendarConnected` from the JWT and session entirely

Drop it from the `jwt`/`session` callbacks (`auth.ts`) and from the `Session`/`JWT` augmentations (`types/next-auth.d.ts`). The backend read is the only authority.

- **Why over keeping it as a first-paint hint**: a hint reintroduces "two sources can disagree." Since every gated surface is an RSC already making backend calls, there is no first-paint window to optimize. (User decision.)

### Decision: Assume disconnected when the status read fails

On error or unreachable backend, treat the calendar as not connected — show the alert / connect step.

- **Why**: a false "connect" nudge is harmless (the user re-confirms); a false "connected" hides the only path to fix a genuinely disconnected calendar. Mirrors the per-day availability degradation that already shows an error marker rather than silently succeeding (`availability.ts:28`). (User decision.)

### Decision: Encapsulate the read in a server-only module

Place the fetch in e.g. `lib/calendar-connection.ts` (`import "server-only"`), returning a plain boolean with the disconnected-on-error fallback applied, mirroring `lib/availability.ts`. Both `/calendar` and `/onboarding/connect-calendar` import it.

- **Why**: one place owns the endpoint shape and the failure policy, so both surfaces behave identically.

## Risks / Trade-offs

- **Extra backend call per gated render** → Negligible next to the 7 availability calls already issued on `/calendar`; the endpoint is read-only and cheap.
- **Backend endpoint must ship before/with the frontend** → Cross-repo coordination. Mitigation: the additive GET is small; until it exists the frontend reader's disconnected-on-error fallback keeps the app functional (it just always shows the prompt).
- **Backend down now hides the calendar's connected state** → Users see a connect nudge during an outage. Mitigation: accepted; the nudge is non-destructive and the alert is informational, not a hard block.
- **Removing the session flag is breaking for any other reader** → Mitigation: grep confirms the only consumers are `app/calendar/page.tsx` and the type augmentation; both are updated in this change.

## Migration Plan

1. Backend: add read-only `GET /auth/calendar-connection → { calendarConnected: boolean }` (separate repo; can ship first).
2. Frontend: add `lib/calendar-connection.ts` reader (disconnected-on-error).
3. Frontend: gate `/calendar` alert and add the `/onboarding/connect-calendar` redirect on the reader.
4. Frontend: remove `calendarConnected` from `auth.ts` callbacks and `types/next-auth.d.ts`.
5. Rollback: revert the frontend commit; the JWT-snapshot behavior returns. The additive backend endpoint can stay unused with no effect.

## Open Questions

- Exact backend route/shape — assumed `GET /auth/calendar-connection → { calendarConnected: boolean }`; confirm against backend conventions (it pairs with the existing `PATCH /auth/calendar-connection`).
- Should the `/onboarding/connect-calendar` already-connected case hard-redirect to `/calendar`, or render a brief "✓ Connected — continue" confirmation? Proposal assumes redirect for consistency with the existing unauthenticated redirect; revisit if a confirmation screen is preferred.
