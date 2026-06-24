## ADDED Requirements

### Requirement: Sign-in entry point

The system SHALL present an onboarding sign-in screen to unauthenticated users with a clear call to action to sign in with Google.

#### Scenario: Unauthenticated user sees sign-in

- **WHEN** an unauthenticated user opens the onboarding entry point
- **THEN** the system shows a welcome/sign-in screen offering "Sign in with Google"

### Requirement: Connect-calendar step with deferral

After successful sign-in the system SHALL guide the user to a connect-calendar step whose only available action in this slice is to defer (e.g. "I'll do it later").

#### Scenario: User reaches the connect-calendar step

- **WHEN** a user completes sign-in
- **THEN** the system advances the onboarding flow to the connect-calendar step

#### Scenario: User defers connecting the calendar

- **WHEN** the user chooses "I'll do it later" on the connect-calendar step
- **THEN** the system completes onboarding and redirects the user to the protected `/calendar` route without connecting any calendar

#### Scenario: No active connect action in this slice

- **WHEN** the user views the connect-calendar step
- **THEN** the only offered action is to defer; actually connecting Google Calendar is not available in this slice

### Requirement: Protected `/calendar` route

The system SHALL provide a `/calendar` route that is accessible only to authenticated users. In this slice the page is intentionally empty (placeholder). After a user successfully signs in and completes onboarding, the system SHALL land them on `/calendar`.

#### Scenario: Authenticated user lands on /calendar after sign-in

- **WHEN** a user finishes the onboarding flow (including deferring the calendar step)
- **THEN** the system redirects them to `/calendar` and renders the (empty) calendar page

#### Scenario: Unauthenticated user is blocked from /calendar

- **WHEN** an unauthenticated user attempts to navigate directly to `/calendar`
- **THEN** the system denies access and redirects them to the sign-in entry point
