## MODIFIED Requirements

### Requirement: Weekly calendar layout with sidebar

The system SHALL render the `/calendar` route as a two-pane layout: a left sidebar and a weekly calendar view filling the remaining space. The sidebar SHALL be a shadcn `sidebar` component at its default width and SHALL display the signed-in user's name and email. The user info block SHALL include a sign-out control. The sidebar footer SHALL include a theme switch and SHALL NOT display any "coming soon" placeholder text.

#### Scenario: Authenticated user opens the calendar

- **WHEN** an authenticated user navigates to `/calendar`
- **THEN** the system renders the sidebar showing their name and email and a weekly calendar view filling the remaining width

#### Scenario: Unauthenticated user opens the calendar

- **WHEN** an unauthenticated user navigates to `/calendar`
- **THEN** the system redirects them to the sign-in entry point instead of rendering the calendar

#### Scenario: Sidebar exposes a theme switch in the footer

- **WHEN** an authenticated user views the calendar sidebar
- **THEN** the sidebar footer presents a control to switch between light and dark themes

#### Scenario: Sidebar exposes a sign-out control in the user info block

- **WHEN** an authenticated user views the calendar sidebar
- **THEN** the user info block presents a sign-out control alongside their name and email

#### Scenario: No placeholder text in the footer

- **WHEN** an authenticated user views the calendar sidebar footer
- **THEN** the system does not display the "Pick a slot to book — coming soon." text
