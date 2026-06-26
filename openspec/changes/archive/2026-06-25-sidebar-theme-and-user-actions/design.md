## Context

The calendar sidebar (`app/calendar/CalendarSidebar.tsx`) is a Server Component rendered from `app/calendar/page.tsx`. It shows the signed-in user's name/email in a card, a color legend, and a footer with a timezone note plus a stale "Pick a slot to book — coming soon." string.

`next-themes@0.4.6` is already a dependency but is **unused**: `app/layout.tsx` hard-codes `className="dark"` on `<html>` and there is no provider. `app/globals.css` already defines both `:root` (light) and `.dark` token sets via Tailwind v4 `@custom-variant dark (&:is(.dark *))`, so light mode is ready the moment the `.dark` class is driven dynamically.

Auth is NextAuth (Auth.js v5). `auth.ts` already exports `signOut`. The existing sign-in (`app/onboarding/page.tsx`) is a Server Component that calls `signIn` inside a `"use server"` form action — the established pattern for auth mutations in this repo.

## Goals / Non-Goals

**Goals:**
- Make light/dark switchable at runtime, persisted, with no flash of the wrong theme (FOUC) on load.
- Add a theme switch at the bottom (footer) of the calendar sidebar.
- Add a sign-out control to the user info block that ends the session and returns to `/onboarding`.
- Remove the obsolete "coming soon" placeholder.

**Non-Goals:**
- No system-preference auto-detection toggle UI (a simple light↔dark switch is enough; `enableSystem` is left off so the default stays dark).
- No new auth provider/config changes — reuse the exported `signOut`.
- No redesign of the sidebar layout, legend, or timezone note beyond the placeholder removal.

## Decisions

### Theme provider via next-themes with `attribute="class"`, `defaultTheme="dark"`
The app is currently dark-only; keeping `defaultTheme="dark"` preserves the current first-paint for users with no stored preference. `next-themes` injects a blocking pre-hydration script that sets the class before paint, so we remove the hard-coded `dark` from `<html>` and add `suppressHydrationWarning` (required because the script mutates `<html>` before React hydrates).

- The provider must run in a client boundary. Per ARCHITECTURE.md, this is `components/providers.tsx` (a `"use client"` wrapper) imported into the root layout — the same file the architecture reserves for client providers (e.g. React Query later).
- *Alternative considered:* keep `enableSystem` and a 3-way toggle. Rejected as scope creep; a binary switch matches the single requested control and avoids deciding system-default behavior now.

### Theme switch is a leaf client component
`useTheme()` requires a client component, but the sidebar is a Server Component. Per the repo's "client boundaries as deep as possible" rule, the switch is a small leaf component (`app/calendar/ThemeSwitch.tsx`) embedded in the server-rendered footer. It reads/sets theme via `useTheme` and guards against hydration mismatch by only rendering the resolved icon after mount (a mounted flag), which is the canonical next-themes pattern — isolated in this leaf, not a page-level `useEffect`.

### Sign-out as a server-action form, mirroring sign-in
A `<form action={...}>` with a `"use server"` action calling `signOut({ redirectTo: "/onboarding" })`. This keeps the user info block server-rendered, needs no client JS, and matches the existing sign-in implementation exactly. The sign-out trigger lives inside the user info card so it reads as part of "the user's info component" per the request.

### Footer composition
The footer keeps the timezone note (`Times shown in {tz}.`) when a zone is known, drops the "coming soon" sentence, and hosts the theme switch. Timezone text and the switch sit in the footer together.

## Risks / Trade-offs

- **FOUC / hydration mismatch on `<html>`** → Mitigated by `suppressHydrationWarning` on `<html>` plus next-themes' pre-paint script; the leaf switch defers icon rendering until mounted so its own markup matches on first client render.
- **Light-mode visual regressions** (tokens exist but were never exercised) → Low risk for this change's surface; the switch makes any pre-existing light-mode gaps visible but does not introduce them. Out of scope to audit every screen.
- **Losing the dark default** → Explicit `defaultTheme="dark"` and no `enableSystem` keep new/unset users on dark.

## Migration Plan

Pure frontend change, no data migration. Deploy is the code change; rollback is reverting it. The persisted theme lives in `localStorage` under next-themes' key and is harmless if the feature is reverted.
