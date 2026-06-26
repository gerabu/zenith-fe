# Zenith

> A Google Calendar–integrated booking application, built with **AI-assisted, Spec-Driven Development**.

Zenith lets users sign in with Google, book named time slots, and have the system prevent conflicts against **both** existing bookings in the platform **and** the events already on the user's connected Google Calendar. Conflict validation runs against Google Calendar *before* a booking is confirmed — never asynchronously after the fact.

This repository is the **Next.js 16 frontend**. It talks to a separate NestJS backend over a shared, authenticated axios instance.

---

## How it was built

This project was built end-to-end using a disciplined **Spec-Driven Development (SDD)** workflow on top of [**OpenSpec**](https://github.com/Fission-AI/OpenSpec), with Claude Code as the AI pair. Three habits shaped the codebase:

- **Every feature started as a written spec, not a prompt.** Specs are the source of truth; code is the artifact derived from them.
- **Every non-trivial trade-off is captured in an ADR.** See [Architecture Decision Records](#architecture-decision-records).
- **The auth model is deliberate and documented**, separating *authentication* from *calendar authorization*. See [Authentication & Authorization](#authentication--authorization).

---

## Spec-Driven Development with the OpenSpec core flow

Rather than prompting an AI to "build a booking app" and accepting whatever it produced, every capability flowed through the **OpenSpec core loop**:

```
  ┌─────────────┐      ┌──────────────┐      ┌──────────────┐
  │   PROPOSE   │ ───► │    APPLY     │ ───► │   ARCHIVE    │
  │             │      │              │      │              │
  │ proposal.md │      │ implement    │      │ fold deltas  │
  │ design.md   │      │ tasks.md one │      │ into the     │
  │ specs/*.md  │      │ at a time    │      │ living specs │
  │ tasks.md    │      │              │      │              │
  └─────────────┘      └──────────────┘      └──────────────┘
```

1. **Propose** — Each change began as a `proposal.md` (the *what* and *why*), a `design.md` (the technical approach and alternatives), spec deltas under `specs/`, and a granular `tasks.md` checklist. Nothing was coded until the intent was written down and reviewable.
2. **Apply** — Implementation worked through `tasks.md` one task at a time, keeping each step small, reviewable, and traceable back to a requirement.
3. **Archive** — On completion, the change's spec deltas were folded into the **living specifications**, and the change moved to `changes/archive/` with a date stamp — preserving a full audit trail of how the system evolved.

### Where to look

| Path | What it holds |
|---|---|
| `openspec/specs/` | The **living specifications** — the current source of truth for every capability |
| `openspec/changes/archive/` | Every completed change, with its original `proposal.md`, `design.md`, and `tasks.md` |
| `docs/adr/` | Architecture Decision Records for cross-cutting decisions |

### The capabilities, as specs

Each of these is a formally specified capability under `openspec/specs/`, written in requirement/scenario form (`SHALL` + WHEN/THEN):

- **`user-authentication`** — Google sign-in via NextAuth, ID-token capture, backend user sync.
- **`onboarding`** — Soft onboarding with a "skip for now" path.
- **`calendar-connection`** — Incremental OAuth to grant read-only calendar access, persisted server-side.
- **`weekly-calendar`** — Weekly grid view of availability.
- **`booking-creation`** — Validated booking form with conflict prevention.
- **`booking-deletion`** — Removing a booked slot from the calendar.
- **`viewer-timezone-rendering`** — Availability windows defined in the *viewer's* timezone.
- **`theme-switching`** — Light/dark theming.

The archived change log (`openspec/changes/archive/`) reads as a chronological history of the build — from `user-signin-onboarding`, through `weekly-calendar-view`, `connect-google-calendar`, and `add-create-booking`, to refinements like `render-calendar-in-viewer-tz` and `refresh-google-id-token`.

---

## Architecture Decision Records

Significant trade-offs were captured as ADRs in `docs/adr/` so the reasoning survives the decision. The three that most shape the product:

### ADR-001 — Calendar connection is "optional but blocking"
Authentication (Google login) is **decoupled** from authorization (Calendar API access). Users authenticate with only basic profile/email scopes; granting calendar permission is deferred until it delivers value. However, because the domain rules require conflict validation against Google Calendar, a connected calendar is a **strict prerequisite for creating a booking**. This applies the principle of least privilege and reduces onboarding drop-off, at the cost of the app having to model two states: *Authenticated* and *Authenticated + Connected*.

### ADR-002 — Soft onboarding & proactive UI
A user can enter in a read-only state (logged in, calendar not connected). Rather than letting them fill out a booking form only to be rejected by the backend ("error-by-design"), the UI **communicates state before the user acts**: disabled slots, a persistent connect-calendar banner, and an *upsell modal* — not a red error toast — when a disabled slot is clicked. Preventive UX over reactive error handling.

### ADR-003 — Primary calendar only
Conflict validation checks only the user's **Primary** Google Calendar (via the API's `'primary'` alias), not secondary/shared/subscribed calendars. This keeps backend integration to a single low-latency call and avoids multi-calendar selection UI — a deliberate, documented MVP trade-off with a noted future-iteration path.

---

## Authentication & Authorization

Zenith uses **Google OAuth via NextAuth (Auth.js v5)** with a JWT session strategy, and a clear contract between frontend and backend built on the **Google-issued ID token**.

### Design principles

- **The ID token, not the access token, is the backend credential.** The system captures Google's cryptographically verifiable **ID token** (a JWT the backend can validate) and uses it as the `Bearer` for backend calls. The opaque access token is *never* used for backend authorization.
- **Authentication ≠ calendar authorization** (per ADR-001). Identity scopes are requested at login; the read-only calendar scope is requested later, incrementally.

### Frontend flow

```
User ──► Google OAuth consent ──► NextAuth jwt() callback
                                        │
                                        ├─ capture id_token, refresh_token, expiry
                                        ├─ GET  /auth/sync                (Bearer id_token) — register/find user
                                        └─ if calendar scope granted:
                                             PATCH /auth/calendar-connection { accessToken, refreshToken }
                                        ▼
                                   session.idToken exposed to the app
```

- **`auth.ts`** — NextAuth config. The `jwt` callback captures the ID token, persists refresh material, syncs the user with the backend (`GET /auth/sync`), and — on an incremental sign-in that granted `calendar.events.readonly` — forwards the calendar tokens to the backend (`PATCH /auth/calendar-connection`). The `authorized` callback gates `/calendar`, treating a failed token refresh as unauthenticated.
- **`proxy.ts`** (middleware) — Routes the root path to `/calendar` or `/onboarding` based on auth state, and steers authenticated users from sign-in into the connect-calendar step.
- **`lib/api.ts`** — A **single shared axios instance**. Its request interceptor injects `Authorization: Bearer {idToken}` from the NextAuth session on server-side calls, so feature code never handles tokens directly. (Per project convention, *all* backend HTTP goes through this instance — no bare `fetch`, no `axios.create()` in components.)
- **`lib/google-token.ts`** — Proactively **refreshes the Google ID token before expiry** (with a 60s skew) by exchanging the stored refresh token at Google's OAuth endpoint, so the backend never receives a token in its final seconds. A refresh failure is surfaced on the session, bouncing the user back to re-authenticate rather than firing requests with a dead token.

### Backend contract

The frontend authenticates to the NestJS backend purely with the **Bearer ID token**, which the backend validates against Google's public keys to establish identity:

| Endpoint | Purpose |
|---|---|
| `GET /auth/sync` | Validate the ID token; register or find the user; report calendar connection state |
| `PATCH /auth/calendar-connection` | Persist the user's Google Calendar access/refresh tokens after an incremental grant |
| `GET /availability/:date?tz=…` | Return a day's availability in the viewer's timezone |
| `POST` / `DELETE` bookings | Create/delete bookings, with conflict validation against the system **and** the primary Google Calendar |

The frontend holds calendar tokens only long enough to hand them to the backend; the backend owns calendar synchronization and conflict detection.

---

## Tech stack

- **Next.js 16** (App Router, React Server Components) + **React 19**
- **NextAuth / Auth.js v5** — Google OAuth, JWT sessions
- **Tailwind CSS v4** (configured in `app/globals.css`, no config file)
- **shadcn/ui** in the `base-maia` style, backed by **`@base-ui/react`** (not Radix)
- **react-hook-form + zod** — one schema shared by the client resolver and the server action
- **axios** — single shared, auth-injecting instance (`lib/api.ts`)
- **Vitest** — unit/logic tests (timezone math, week math, schema, token refresh, calendar connection)
- **pnpm** workspace; CI on Node 22

### Architectural conventions

- **Server Components by default**; `"use client"` only at interactive leaves.
- **RSC fetches data directly**; client reads use React Query; **mutations go through Server Actions** that re-validate with the shared zod schema.
- **`useEffect` is a last resort**, isolated to custom hooks in `hooks/` when unavoidable.

See `ARCHITECTURE.md` for the full data-flow and component rules, and `CLAUDE.md` / `AGENTS.md` for the AI-collaboration guardrails.

---

## Getting started

Prerequisites: **Node 22+** and **pnpm 10**.

```bash
pnpm install
cp .env.example .env.local   # then fill in the values below
pnpm dev                     # http://localhost:3000
```

Required environment variables (`.env.example`):

```bash
AUTH_SECRET=            # openssl rand -base64 32
AUTH_GOOGLE_ID=         # Google OAuth client — console.cloud.google.com
AUTH_GOOGLE_SECRET=
NEXT_PUBLIC_API_URL=    # backend base URL, e.g. http://localhost:3001 (no trailing slash)
```

> Google OAuth secrets are server-only and must **never** be prefixed with `NEXT_PUBLIC_`.

### Commands

```bash
pnpm dev      # start dev server
pnpm build    # production build
pnpm lint     # ESLint
pnpm test     # run all tests (Vitest, non-interactive)

pnpm vitest run path/to/file.test.ts   # single test file
```

---

## Repository map

```
app/                     Routes, feature components, server actions, schemas
  ├─ onboarding/         Sign-in + soft onboarding (ADR-002)
  ├─ calendar/           Weekly view, sidebar, connect-calendar alert, theme switch
  ├─ bookings/           Booking server actions + shared zod schema
  └─ api/auth/           NextAuth route handler
lib/                     Shared utilities — axios instance, token refresh,
                         availability, timezone & week math, calendar connection
hooks/                   Custom hooks (the only home for unavoidable effects)
components/ui/           shadcn-generated primitives (base-maia)
auth.ts                  NextAuth configuration (the auth core)
proxy.ts                 Middleware: routing + route protection
docs/adr/                Architecture Decision Records
openspec/                Living specs + archived change history (the SDD trail)
```
