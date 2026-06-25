## 1. Local-today hook

- [x] 1.1 Create `hooks/use-local-today.ts`: a `useLocalToday()` hook returning `{ todayISO, nowMinutes }` for the viewer's local timezone, backed by `useSyncExternalStore` (server snapshot `null`, ticking once a minute), with the snapshot kept as a primitive string to avoid render loops

## 2. Wire into the grid

- [x] 2.1 In `app/calendar/WeekGrid.tsx`, derive `isToday` from `day.dateISO === todayISO` and the now-marker from the hook's `nowMinutes` instead of the server-provided fields
- [x] 2.2 Show the now-marker only when the day is local-today and `nowMinutes` is non-null

## 3. Wire into navigation

- [x] 3.1 In `app/calendar/WeekNav.tsx`, compute the current week's Monday from the hook's `todayISO` so the "Today" control and its disabled state use the viewer's local date

## 4. Drop the stale server fields

- [x] 4.1 Remove `isToday` from `CalendarDayVM` and `nowMinutes` from `CalendarWeekData` in `app/calendar/types.ts`
- [x] 4.2 Remove the UTC `todayISO` / `nowMinutes` computation from `app/calendar/page.tsx`

## 5. Verify

- [x] 5.1 `pnpm lint`, `pnpm test`, `tsc --noEmit`, and `pnpm build` pass
- [x] 5.2 Manual check: in a timezone behind UTC late in the day, the highlighted column and now-marker are on the local current date, not the UTC one
