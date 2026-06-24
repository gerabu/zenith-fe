## Why

The app is still the default Next.js boilerplate — there is no way for a user to enter the system. Zenith's entire value (conflict-free booking against a shared pool and the user's Google Calendar) depends on an authenticated, identified user whose Google credentials we can later use to read their calendar. This slice establishes the front door: signing in with Google and persisting the user in the backend, wrapped in an onboarding flow that already has a (deferred) calendar-connect step so the next slice can slot in without redesign.

## What Changes

- Add **NextAuth (Auth.js v5)** with **Google** as the only auth provider so users can sign in with their Google account.
- In the NextAuth **`jwt` callback**, on first sign-in call the backend `POST http://localhost:3001/auth/sync` with the **Google-issued ID token** (the verifiable JWT) in an `Authorization: Bearer {id_token}` header — never the opaque access token — so NestJS can validate it cryptographically and register/find the user in its database.
- In the NextAuth **`session` callback**, expose the Google ID token on the session so it can be injected into backend requests later.
- Add a **route handler** at `app/api/auth/[...nextauth]/route.ts` wired to the NextAuth config.
- Create the typed **axios instance** (`lib/api.ts`) pointing at the backend, ready to inject the Bearer token on subsequent calls.
- Build a **user-friendly onboarding flow**: a sign-in screen, and a connect-calendar step whose only action in this slice is **"I'll do it later"** (a placeholder for the next slice).

## Capabilities

### New Capabilities
- `user-authentication`: Google OAuth sign-in through NextAuth, session creation, capture of the Google-issued ID token, and backend user sync via `/auth/sync`.
- `onboarding`: A guided post-sign-in flow that welcomes the user and presents the (deferred) calendar-connect step with an "I'll do it later" option.

### Modified Capabilities
<!-- None — no existing specs to modify. -->

## Impact

- **Dependencies**: adds `next-auth` (Auth.js v5) and `axios`.
- **New code**: `auth.ts` (NextAuth config), `app/api/auth/[...nextauth]/route.ts`, `lib/api.ts`, onboarding route(s) under `app/`, and a sign-in entry point.
- **Environment variables**: `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` (server-only, not `NEXT_PUBLIC_`), and `NEXT_PUBLIC_API_URL=http://localhost:3001` for the axios instance.
- **External systems**: depends on the NestJS backend exposing `POST /auth/sync` that accepts a Bearer Google ID token.
- **Out of scope**: logout, actually connecting Google Calendar, user profile management.
