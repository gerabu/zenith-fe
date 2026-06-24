## Context

The repo is the default Next.js 16 (App Router, React 19) boilerplate. `ARCHITECTURE.md` already prescribes the data-flow stack: a single typed axios instance at `lib/api.ts` (base URL from `NEXT_PUBLIC_API_URL`), React Query for client reads, Server Actions for mutations, and Server Components by default. `AGENTS.md` warns that this Next.js has breaking changes — auth wiring must follow the App Router route-handler convention, not the legacy `pages/api` pattern.

The backend is a separate NestJS service at `http://localhost:3001` that exposes `POST /auth/sync`. It validates the Google-issued **ID token** (a signed JWT) cryptographically and registers or finds the user. The frontend's job in this slice is purely to authenticate via Google, hand the backend that ID token, and persist it on the session for later calendar work.

## Goals / Non-Goals

**Goals:**
- Google sign-in through NextAuth (Auth.js v5) with App Router route handlers.
- Capture the Google **ID token** (JWT) — explicitly not the opaque access token — and call `/auth/sync` with it as a Bearer token during the `jwt` callback.
- Persist the ID token on the session via the `session` callback.
- Provide the `lib/api.ts` axios instance ready to inject the Bearer token.
- A friendly two-step onboarding: sign-in, then a deferred connect-calendar step ("I'll do it later").

**Non-Goals:**
- Logout / session revocation.
- Requesting Google Calendar scopes or reading calendar data (next slice).
- User profile management.
- Persisting onboarding completion server-side (the deferral just routes the user forward).

## Decisions

### NextAuth (Auth.js v5) with a root `auth.ts` + catch-all route handler
Auth.js v5 is the App-Router-native shape: a root `auth.ts` calls `NextAuth({...})` and exports `{ handlers, auth, signIn, signOut }`. The route handler at `app/api/auth/[...nextauth]/route.ts` re-exports `const { GET, POST } = handlers`. This matches the location anticipated in `CLAUDE.md` (`app/api/auth/[...nextauth]/`). Chosen over hand-rolling OAuth because NextAuth already manages the Google flow, state/PKCE, and cookie session; over Clerk/Auth0 because the backend is the source of truth for users and only needs a verifiable Google token.

### Use the Google `id_token`, persist it through `jwt` → `session`
NextAuth's `jwt` callback receives `account` only on first sign-in; `account.id_token` is Google's signed JWT and `account.access_token` is the opaque token. We store `id_token` on the NextAuth token, then mirror it onto the session in the `session` callback. Rationale: the NestJS backend validates the JWT cryptographically (verifies Google's signature/claims) — the opaque access token cannot be verified that way and is meant for calling Google APIs. This is the explicit requirement from the flow diagram (step 2 returns ID/Access token; step 5 validates cryptographically).

### Call `/auth/sync` inside the `jwt` callback on first sign-in
The `jwt` callback runs server-side and is the first place the `id_token` is available, exactly once per sign-in (guarded by `if (account)`). We call `POST http://localhost:3001/auth/sync` with `Authorization: Bearer ${id_token}`. Chosen over the `signIn` callback (which is boolean-gating and runs before token assembly) and over a client-side effect (would leak the token to the browser network tab unnecessarily and violates the "no useEffect" preference). If the sync fails we propagate the failure rather than minting a session the backend doesn't know about.

### Axios instance per `ARCHITECTURE.md` (`lib/api.ts`), `NEXT_PUBLIC_API_URL=http://localhost:3001`
We reuse the prescribed single instance. The Bearer token will be injected via the request interceptor (token sourced from the session). For the `/auth/sync` call inside the `jwt` callback the token is passed explicitly as a header since the session does not yet exist at that moment.

### Onboarding as App Router routes, server-first
A sign-in screen and a connect-calendar step rendered as Server Components by default, with `"use client"` pushed to the leaf interactive buttons (sign-in trigger, "I'll do it later"). The deferral simply navigates forward — no server state in this slice.

### Environment variables
Server-only secrets `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` (no `NEXT_PUBLIC_` prefix). `NEXT_PUBLIC_API_URL=http://localhost:3001` for the axios instance.

## Risks / Trade-offs

- **Google ID token lifetime (~1 hour) is short** → For this slice we persist it on the session for later injection; a refresh strategy (using the refresh token / re-issuing) is deferred to when authenticated backend calls actually depend on a fresh token. Documented as an open question.
- **`/auth/sync` failure path is coupled to sign-in** → Making sync blocking means a backend outage blocks login. Mitigation: treat sync failure as a sign-in failure with a clear surfaced error; acceptable because an unsynced user can do nothing useful anyway.
- **Auth.js v5 + Next.js 16 compatibility** → v5 targets App Router but Next 16 has breaking changes (per `AGENTS.md`). Mitigation: follow the route-handler convention from `node_modules/next/dist/docs` and verify the handler builds; pin a known-good `next-auth` version.
- **Storing the ID token in the session cookie** → The token rides in the encrypted JWT session cookie (server-readable). Acceptable since it is exposed to backend calls deliberately; we keep it out of any `NEXT_PUBLIC_` surface.

## Open Questions

- Refresh strategy for the Google ID token once authenticated backend calls (calendar) need a non-expired token — handled in the calendar slice.
- Does `/auth/sync` return user data the frontend should cache on the session (e.g. a backend user id), or is it fire-and-forget? Assumed fire-and-forget for now; can be added to the `jwt`/`session` payload if the backend returns useful fields.
