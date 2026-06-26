## Why

The calendar sidebar is the app's only persistent chrome, yet it offers no way to sign out and no way to change the theme — the app is hard-locked to dark mode even though `next-themes` is already a dependency and the design tokens for light mode already exist. It also still shows a "coming soon" placeholder that no longer reflects the shipped booking flow. This change turns the sidebar into a functional control surface.

## What Changes

- Wrap the app in a `next-themes` provider and stop hard-coding the `dark` class on `<html>`, so the theme can be switched at runtime and persisted.
- Add a theme switch control to the bottom of the calendar sidebar (footer) that toggles between light and dark.
- Add a **Sign out** control to the signed-in user's info block in the sidebar, wired to the existing NextAuth `signOut` and redirecting back to the sign-in entry point.
- Remove the stale "Pick a slot to book — coming soon." text from the sidebar footer.
- Replace the hand-rolled `CalendarCheckIcon` SVG in `ConnectCalendarAlert` with the lucide `CalendarCheck2` icon.
- Add a lucide `AlertCircleIcon` to the destructive error alert in `CreateBookingModal`.
- Establish the convention of using `lucide-react` icons instead of hard-coded inline SVGs (the only exception is the Google "G" mark, which lucide does not provide); replace the remaining inline `Spinner` SVG with a lucide spinner icon.

## Capabilities

### New Capabilities
- `theme-switching`: App-wide light/dark theme that the user can switch at runtime, with the choice persisted across sessions and applied without a flash of the wrong theme.

### Modified Capabilities
- `weekly-calendar`: The sidebar gains a theme switch in its footer and a sign-out control in the user info block; the "coming soon" placeholder text is removed.
- `user-authentication`: The system gains an explicit sign-out capability that ends the session and returns the user to the sign-in entry point.

## Impact

- **UI**: `app/calendar/CalendarSidebar.tsx` (footer + user info block), `app/layout.tsx` (`<html>` class, provider, `suppressHydrationWarning`).
- **New components**: a client theme-provider wrapper and a leaf theme-switch control; a sign-out control (server-action form using `signOut` from `@/auth`).
- **Icon cleanup**: `app/calendar/ConnectCalendarAlert.tsx` (drop local `CalendarCheckIcon` → lucide `CalendarCheck2`), `components/CreateBookingModal.tsx` (add lucide `AlertCircleIcon` to the error alert), `components/connect-calendar-button.tsx` (drop local `Spinner` → lucide spinner). Both `GoogleIcon` SVGs are kept.
- **Dependencies**: `next-themes` (already installed) becomes active; `lucide-react` icons for the controls and the icon cleanup.
- **Auth**: uses the existing `signOut` exported from `auth.ts`; no provider/config changes.
