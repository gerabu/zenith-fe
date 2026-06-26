## MODIFIED Requirements

### Requirement: Capture the Google-issued ID token

The system SHALL capture and retain the Google-issued ID token (the cryptographically verifiable JWT) from the OAuth response, and SHALL NOT use the opaque access token in its place for backend authorization. On first sign-in the system SHALL additionally persist, on the NextAuth token, the refresh token and the ID token's absolute expiry time so the token can be refreshed before it expires.

#### Scenario: ID token captured on first sign-in

- **WHEN** the NextAuth `jwt` callback runs with an `account` present (first sign-in)
- **THEN** the system stores the Google `id_token` on the NextAuth token so it is available to subsequent callbacks

#### Scenario: Refresh material persisted on first sign-in

- **WHEN** the NextAuth `jwt` callback runs with an `account` present that includes a refresh token and expiry
- **THEN** the system persists the `refresh_token` and the ID token's absolute expiry time on the NextAuth token

## ADDED Requirements

### Requirement: Obtain a refresh token for every session

The base Google sign-in SHALL request offline access so that every authenticated session — not only sessions that grant calendar access — obtains a refresh token capable of renewing the Google ID token. The sign-in SHALL request offline access (`access_type=offline`) and force consent (`prompt=consent`) so Google reliably returns a refresh token.

#### Scenario: Base sign-in requests offline access

- **WHEN** an unauthenticated user initiates the base Google sign-in
- **THEN** the authorization request includes `access_type=offline` and `prompt=consent` so the OAuth response carries a refresh token

#### Scenario: Refresh token available without calendar connection

- **WHEN** a user completes the base sign-in without granting calendar access
- **THEN** the NextAuth token still carries a refresh token usable to renew the ID token

### Requirement: Refresh the Google ID token before expiry

On every `jwt` callback invocation where no new `account` is present, the system SHALL determine whether the stored ID token is expired or near expiry and, if so, exchange the stored refresh token at Google's OAuth token endpoint for a fresh ID token, replacing the stored ID token and its expiry on the NextAuth token. A still-valid ID token SHALL be returned unchanged without contacting Google.

#### Scenario: Token still valid

- **WHEN** the `jwt` callback runs with no `account` and the stored ID token has not reached its expiry threshold
- **THEN** the system returns the existing token unchanged and does not call Google's token endpoint

#### Scenario: Token expired or near expiry

- **WHEN** the `jwt` callback runs with no `account` and the stored ID token is expired or within the near-expiry threshold
- **THEN** the system exchanges the stored refresh token at Google's token endpoint and updates the NextAuth token with the newly issued ID token and its new expiry

#### Scenario: Session keeps a valid token past one hour

- **WHEN** a session remains active beyond the Google ID token's ~1 hour lifetime
- **THEN** backend requests continue to carry a non-expired ID token and do not receive 401 responses due to an expired token

### Requirement: Handle refresh failure by forcing re-authentication

When refreshing the ID token fails — for example because the refresh token has been revoked or expired — the system SHALL mark the session as errored rather than returning a stale or empty token silently, so the user is routed back to re-authenticate.

#### Scenario: Refresh token rejected by Google

- **WHEN** the system attempts to refresh the ID token and Google's token endpoint returns an error
- **THEN** the system marks the NextAuth token with an error indicator and does not present a renewed, usable session token

#### Scenario: Errored session surfaced to the app

- **WHEN** the session callback runs for a token marked with a refresh error
- **THEN** the session exposes the error indicator so the app can route the user back to sign-in instead of issuing failing backend requests
