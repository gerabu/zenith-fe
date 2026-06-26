## 1. Theme provider wiring

- [x] 1.1 Create `components/providers.tsx` as a `"use client"` wrapper that renders `next-themes` `ThemeProvider` with `attribute="class"`, `defaultTheme="dark"`, `enableSystem={false}`, and `disableTransitionOnChange`, wrapping `children`.
- [x] 1.2 In `app/layout.tsx`, remove the hard-coded `"dark"` class from `<html>`, add `suppressHydrationWarning` to `<html>`, and wrap `{children}` (and `<Toaster />`) with `<Providers>`.

## 2. Theme switch control

- [x] 2.1 Create `app/calendar/ThemeSwitch.tsx` as a leaf `"use client"` component using `useTheme()`; render a button that toggles between `light` and `dark`, showing a Sun/Moon icon from `lucide-react`, with an accessible label.
- [x] 2.2 Defer icon rendering until after mount (mounted flag) to avoid hydration mismatch; render a stable placeholder before mount.

## 3. Sidebar updates

- [x] 3.1 In `app/calendar/CalendarSidebar.tsx`, add a `"use server"` sign-out action (or import a co-located one) that calls `signOut({ redirectTo: "/onboarding" })` from `@/auth`, and render a sign-out control as a `<form action={...}>` inside the user info block (lines ~36-46), with a `lucide-react` log-out icon and accessible label.
- [x] 3.2 In the `SidebarFooter`, remove the "Pick a slot to book — coming soon." text, keep the `Times shown in {timeZone}.` note when a zone is known, and render `<ThemeSwitch />`.

## 4. Icon cleanup (lucide over inline SVG)

- [x] 4.1 In `app/calendar/ConnectCalendarAlert.tsx`, import `CalendarCheck2` from `lucide-react`, use it in place of the local `CalendarCheckIcon` (keep the `text-primary` class), and delete the `CalendarCheckIcon` function.
- [x] 4.2 In `components/CreateBookingModal.tsx`, import `AlertCircleIcon` from `lucide-react` and render it as the first child of the destructive `serverError` `Alert`.
- [x] 4.3 In `components/connect-calendar-button.tsx`, replace the local `Spinner` SVG with a lucide spinner (e.g. `LoaderCircle` with `className="animate-spin"`) and delete the `Spinner` function. Leave the `GoogleIcon` SVG in place (lucide has no Google mark).

## 5. Verify

- [x] 5.1 Run `pnpm lint` and `pnpm build`; confirm no type/lint errors.
- [x] 5.2 Manually verify: theme switch toggles light/dark and persists across reload with no flash; sign-out ends the session and lands on `/onboarding`; the placeholder text is gone; the connect alert, booking error alert, and connect spinner render their lucide icons.
