# onboarding Specification

## Purpose

Onboard new users from an unauthenticated entry point through Google sign-in to the protected `/calendar` route, including a connect-calendar step that may be deferred.
## Requirements
### Requirement: Sign-in entry point

The system SHALL present an onboarding sign-in screen to unauthenticated users with a clear call to action to sign in with Google.

#### Scenario: Unauthenticated user sees sign-in

- **WHEN** an unauthenticated user opens the onboarding entry point
- **THEN** the system shows a welcome/sign-in screen offering "Sign in with Google"

### Requirement: Connect-calendar step with deferral

After successful sign-in the system SHALL guide the user to a connect-calendar step that offers two actions: an active "Connect Google Calendar" action that starts the read-only calendar authorization, and a deferral action (e.g. "I'll do it later") that completes onboarding without connecting.

#### Scenario: User reaches the connect-calendar step

- **WHEN** a user completes sign-in
- **THEN** the system advances the onboarding flow to the connect-calendar step

#### Scenario: User defers connecting the calendar

- **WHEN** the user chooses "I'll do it later" on the connect-calendar step
- **THEN** the system completes onboarding and redirects the user to the protected `/calendar` route without connecting any calendar

#### Scenario: User connects the calendar from onboarding

- **WHEN** the user activates the "Connect Google Calendar" action on the connect-calendar step
- **THEN** the system starts the incremental Google authorization requesting read-only calendar access

### Requirement: Protected `/calendar` route

The system SHALL provide a `/calendar` route that is accessible only to authenticated users. In this slice the page is intentionally empty (placeholder). After a user successfully signs in and completes onboarding, the system SHALL land them on `/calendar`.

#### Scenario: Authenticated user lands on /calendar after sign-in

- **WHEN** a user finishes the onboarding flow (including deferring the calendar step)
- **THEN** the system redirects them to `/calendar` and renders the (empty) calendar page

#### Scenario: Unauthenticated user is blocked from /calendar

- **WHEN** an unauthenticated user attempts to navigate directly to `/calendar`
- **THEN** the system denies access and redirects them to the sign-in entry point

