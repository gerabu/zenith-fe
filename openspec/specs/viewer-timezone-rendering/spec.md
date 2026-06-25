# viewer-timezone-rendering Specification

## Purpose

Render the calendar in the viewer's own IANA timezone end-to-end: resolve the viewer's zone on the client, persist it for server-side rendering, request availability with that zone, compute the displayed week in the viewer's local calendar, and render every day and time in that zone — without producing a hydration mismatch between the fetch and render timezones.

## Requirements

### Requirement: Resolve the viewer's IANA timezone

The system SHALL determine the viewer's timezone as an IANA zone name (e.g. `America/New_York`) using `Intl.DateTimeFormat().resolvedOptions().timeZone`, evaluated on the client. The system SHALL NOT infer the zone from a fixed UTC offset, locale, or geo-IP.

#### Scenario: Browser timezone is resolved on the client

- **WHEN** the calendar loads in a browser whose system timezone is `America/New_York`
- **THEN** the resolved timezone used by the application is the IANA name `America/New_York`

#### Scenario: Daylight saving is handled by the IANA zone

- **WHEN** an event instant falls on either side of a DST transition for the viewer's zone
- **THEN** the local hour shown is derived from the IANA zone via `Intl` (DST-correct), never from a fixed offset

### Requirement: Persist the timezone for server-side rendering

The system SHALL persist the resolved IANA timezone in a cookie so the server component can read it during SSR. A client component SHALL write the cookie on first load and SHALL update it whenever the resolved zone differs from the stored value, triggering a server re-render so the new zone takes effect.

#### Scenario: Timezone cookie set on first load

- **WHEN** a viewer opens the calendar and no timezone cookie exists
- **THEN** the client writes the resolved IANA zone to the cookie and triggers a server re-render that uses that zone

#### Scenario: Timezone change re-syncs

- **WHEN** the resolved browser zone differs from the stored cookie value (e.g. the viewer has travelled)
- **THEN** the client rewrites the cookie with the current zone and triggers a server re-render so fetching and rendering use the updated zone

### Requirement: Request availability in the viewer's timezone

The system SHALL request each day's availability with the viewer's IANA timezone as a `tz` query parameter — `GET /availability/:date?tz=<IANA>` — using the shared `lib/api.ts` axios instance. The `tz` value SHALL be URL-encoded. The response shape is unchanged and `Slot.start`/`Slot.end` remain UTC ISO-8601 instants.

#### Scenario: Day request carries the timezone

- **WHEN** the server fetches availability for `2026-06-25` for a viewer in `America/New_York`
- **THEN** the request is `GET /availability/2026-06-25?tz=America%2FNew_York` issued through the shared axios instance

#### Scenario: Returned instants are not reinterpreted

- **WHEN** the backend returns a slot with `start` as a UTC ISO-8601 instant
- **THEN** the system renders that exact instant converted to the viewer's zone, and does not alter or re-offset the instant itself

### Requirement: Compute the displayed week in the viewer's local calendar

The system SHALL compute the Monday–Sunday week and each day's `YYYY-MM-DD` request key from the viewer's local calendar in the resolved IANA zone, so that the dates requested and the day buckets used for placement match the viewer's local days.

#### Scenario: Local week boundaries

- **WHEN** the week is resolved for a viewer in a non-UTC zone
- **THEN** the seven day keys are the viewer's local Monday through Sunday `YYYY-MM-DD` values, not UTC-derived dates

#### Scenario: Week param interpreted locally

- **WHEN** a `?week=YYYY-MM-DD` param is provided
- **THEN** it is aligned to the Monday of that date's week in the viewer's zone

### Requirement: Render days and times in the viewer's timezone

The system SHALL render every event's day placement, start hour, time labels, and the weekday/month-day/range headers in the viewer's resolved IANA zone. A UTC ISO instant SHALL be formatted to the viewer's local day and hour for display.

#### Scenario: Event shown on the correct local day and hour

- **WHEN** a viewer in UTC−5 has a Google event whose UTC instant is `2026-06-26T02:00:00Z`
- **THEN** the event appears on June 25 at 21:00 in the calendar, not on June 26 at 02:00

#### Scenario: Hour placement matches the label

- **WHEN** an event renders at local hour `21:00`
- **THEN** its vertical placement (`startHour`) is the local hour `21` and its time label reads `21:00` in the viewer's zone

### Requirement: No hydration mismatch between fetch and render timezones

The system SHALL ensure the timezone used to fetch availability and the timezone used to render are identical, and SHALL NOT produce a render where the server fetched/rendered in UTC while the client rendered local. Tz-dependent content SHALL be gated until the viewer's zone is known, and SHALL produce no React hydration warnings.

#### Scenario: No UTC-then-local flash

- **WHEN** a first-time viewer in a non-UTC zone opens the calendar
- **THEN** the system does not first fetch and render the week in UTC; it renders tz-dependent content only once the viewer's zone is known

#### Scenario: Server and client agree

- **WHEN** the calendar hydrates on the client
- **THEN** the server-rendered markup matches the client render and React reports no hydration warnings
