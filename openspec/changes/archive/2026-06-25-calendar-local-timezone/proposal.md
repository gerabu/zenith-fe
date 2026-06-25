## Why

The calendar highlights the wrong day as "today" and positions the current-time marker in the wrong place. Both are computed server-side in UTC (`new Date().toISOString().slice(0,10)`, `getUTCHours()`), so a viewer whose local time is behind UTC sees tomorrow highlighted as the current date. "Today" and "now" are inherently viewer-local concepts and must follow the user's timezone.

## What Changes

- Determine which day column is **today** using the viewer's local timezone instead of UTC.
- Position the **current-time marker** by the viewer's local minutes-since-midnight instead of UTC minutes.
- Make the **"Today" / current-week** navigation control target the week containing the viewer's local current date.
- Move the today/now computation into a dedicated client hook (`hooks/use-local-today.ts`), keeping the week structure, labels, and per-day availability server-rendered. Remove the now-incorrect server-computed `isToday` / `nowMinutes` fields.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `weekly-calendar`: today highlighting, the current-time marker, and the current-week control use the viewer's local timezone rather than UTC.

## Impact

- **Code**: new `hooks/use-local-today.ts`; `app/calendar/WeekGrid.tsx` (derive today + now from the hook); `app/calendar/WeekNav.tsx` (current-week from local today); `app/calendar/page.tsx` and `app/calendar/types.ts` (drop server `isToday` / `nowMinutes`).
- **Out of scope**: localizing event start times (events remain placed by their UTC start hour) and the no-`?week` default-week selection, which is still resolved server-side from the current date (correct except across the Sunday→Monday boundary for far-from-UTC viewers, because the server cannot know the viewer's timezone without additional plumbing). Tracked as a follow-up.
