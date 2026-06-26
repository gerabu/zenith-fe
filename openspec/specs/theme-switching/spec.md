# theme-switching Specification

## Purpose

Provide a runtime light/dark theme for the app, toggled via `next-themes`, persisted on the client across sessions, and applied before first paint to avoid a flash of the wrong theme.
## Requirements
### Requirement: Runtime light/dark theme

The system SHALL support a light theme and a dark theme, applied by toggling a `dark` class on the document root via `next-themes`. When no preference has been stored, the system SHALL default to the dark theme.

#### Scenario: First visit with no stored preference

- **WHEN** a user loads the app for the first time with no previously stored theme preference
- **THEN** the system applies the dark theme

#### Scenario: Theme tokens follow the active theme

- **WHEN** the active theme is light
- **THEN** the document root does not carry the `dark` class and the light design tokens are in effect
- **WHEN** the active theme is dark
- **THEN** the document root carries the `dark` class and the dark design tokens are in effect

### Requirement: Theme preference persists across sessions

The system SHALL persist the user's chosen theme on the client and re-apply it on subsequent loads without requiring the user to choose again.

#### Scenario: Returning user keeps their theme

- **WHEN** a user who previously selected the light theme returns to the app
- **THEN** the system applies the light theme on load

### Requirement: No flash of the wrong theme on load

The system SHALL apply the persisted theme before first paint so the user does not see a flash of the non-selected theme during hydration. The document root SHALL suppress hydration warnings caused by the pre-paint theme script.

#### Scenario: Persisted theme applied before paint

- **WHEN** a returning user with a stored light-theme preference loads a page
- **THEN** the page renders in light theme on first paint without first flashing the dark theme
