## MODIFIED Requirements

### Requirement: Event source rendering and filtering

The system SHALL render only events whose `status` is `booked` or `external`, and SHALL NOT render events whose `status` is `available`. Events with `status` `booked` SHALL use the primary background color and events with `status` `external` SHALL use the secondary background color, so the two sources are visually distinguishable. Each event SHALL display its `title`. For events with `status: "booked"`, the system SHALL carry the booking `id` returned by `/availability` through to the rendered tile so the tile can offer deletion; the `id` is optional and present only on `booked` events.

#### Scenario: Booked (internal) event styling

- **WHEN** an event has `status: "booked"`
- **THEN** it is rendered with the primary background color and its title is shown

#### Scenario: External event styling

- **WHEN** an event has `status: "external"`
- **THEN** it is rendered with the secondary background color and its title is shown

#### Scenario: Available slots are not shown

- **WHEN** an event has `status: "available"`
- **THEN** it is not rendered in the calendar

#### Scenario: Booked event carries its id to the tile

- **WHEN** an availability event has `status: "booked"` and an `id`
- **THEN** that `id` is carried through the availability fetch and the view model to the rendered tile, so the tile can expose a delete affordance
