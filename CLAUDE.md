# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md
@ARCHITECTURE.md

## Application Overview

Zenith is a Google Calendar-integrated booking app. Users sign in with Google, book named time slots (start/end time), and the system prevents conflicts against both existing bookings in the system and events in the user's connected Google Calendar.

## Commands

```bash
pnpm dev          # start dev server
pnpm build        # production build
pnpm lint         # ESLint (eslint.config.mjs)
pnpm test         # run all tests with Vitest (non-interactive)
```

Run a single test file:
```bash
pnpm vitest run path/to/file.test.ts
```

CI uses Node 22 + pnpm 10, runs `pnpm test` only.

## Stack

- **Next.js 16** (App Router, RSC enabled) — see `node_modules/next/dist/docs/` for current API
- **React 19**
- **Tailwind CSS v4** — configured via `app/globals.css`; no `tailwind.config.*` file
- **shadcn/ui** with `base-maia` style backed by `@base-ui/react` (not Radix UI)
- **Vitest** for all tests (not Jest)
- **pnpm** workspace (`pnpm-workspace.yaml`)
- Path alias: `@/*` resolves to repo root

## Architecture

### Planned feature areas

| Area | Expected location |
|---|---|
| Google OAuth + session | `app/api/auth/[...nextauth]/` or equivalent |
| Booking CRUD API | `app/api/bookings/` |
| Google Calendar sync | `lib/google-calendar.ts` |
| Conflict detection logic | `lib/conflicts.ts` |
| UI pages | `app/(routes)/...` |
| Shared UI components | `components/ui/` (shadcn-generated) |
| Non-UI utilities | `lib/` |
| Custom hooks | `hooks/` |

### Conflict detection rules

A booking must be rejected if it overlaps with:
1. Any existing booking in the system (all users share the same slot pool).
2. Any event in the authenticated user's Google Calendar — checked via the Calendar API using the OAuth token stored in the session.

The system must check Google Calendar **before** confirming a booking, not asynchronously after.

### HTTP requests

All backend HTTP calls — server (RSC, server actions) and client — MUST go through the shared axios instance at `lib/api.ts`. Do **not** use the native `fetch` API, `axios.create()`, or bare `axios.get()`/`axios.post()` for backend calls. The instance attaches the Bearer ID token (from the session) via its request interceptor; calling `fetch` directly bypasses auth and the shared config.

### shadcn components

Add components with:
```bash
pnpm shadcn add <component>
```
Components land in `components/ui/`. The configured style is `base-maia`; do not change the style or switch the underlying primitive library from `@base-ui/react`.
