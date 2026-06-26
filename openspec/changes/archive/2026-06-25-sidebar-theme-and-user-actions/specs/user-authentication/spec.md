## ADDED Requirements

### Requirement: User can sign out

The system SHALL allow an authenticated user to sign out, ending their NextAuth session and returning them to the sign-in entry point (`/onboarding`). Sign-out SHALL be performed through the NextAuth `signOut` action exported from `auth.ts`.

#### Scenario: Authenticated user signs out

- **WHEN** an authenticated user activates the sign-out control
- **THEN** the system ends their session and redirects them to `/onboarding`

#### Scenario: Signed-out user cannot reach the calendar

- **WHEN** a user who has signed out navigates to `/calendar`
- **THEN** the system treats them as unauthenticated and redirects them to the sign-in entry point
