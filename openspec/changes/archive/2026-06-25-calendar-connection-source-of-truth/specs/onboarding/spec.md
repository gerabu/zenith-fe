## MODIFIED Requirements

### Requirement: Connect-calendar step with deferral

After successful sign-in the system SHALL guide the user to a connect-calendar step. When the user's Google Calendar is already connected (per the backend connection status), the step SHALL redirect the user to `/calendar` instead of prompting to connect. Otherwise the step SHALL offer two actions: an active "Connect Google Calendar" action that starts the read-only calendar authorization, and a deferral action (e.g. "I'll do it later") that completes onboarding without connecting.

#### Scenario: User reaches the connect-calendar step

- **WHEN** a user completes sign-in
- **THEN** the system advances the onboarding flow to the connect-calendar step

#### Scenario: Already-connected user skips the step

- **WHEN** a user opens the connect-calendar step and the backend reports their calendar is already connected
- **THEN** the system redirects them to `/calendar` without showing the connect prompt

#### Scenario: User defers connecting the calendar

- **WHEN** the user chooses "I'll do it later" on the connect-calendar step
- **THEN** the system completes onboarding and redirects the user to the protected `/calendar` route without connecting any calendar

#### Scenario: User connects the calendar from onboarding

- **WHEN** the user activates the "Connect Google Calendar" action on the connect-calendar step
- **THEN** the system starts the incremental Google authorization requesting read-only calendar access

#### Scenario: Connection-status read fails on the step

- **WHEN** the connection-status read fails while rendering the connect-calendar step
- **THEN** the system renders the connect prompt (assuming disconnected) rather than redirecting
