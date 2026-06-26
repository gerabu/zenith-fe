## 1. Types

- [x] 1.1 Add `refreshToken?: string`, `expiresAt?: number`, and `error?: string` to the `JWT` interface in `types/next-auth.d.ts`
- [x] 1.2 Add `error?: string` to the `Session` interface in `types/next-auth.d.ts`

## 2. Persist refresh material at sign-in (`auth.ts`)

- [x] 2.1 In the `jwt` callback `account` branch, store `account.refresh_token` on `token.refreshToken` (keep any existing value if the new account omits one)
- [x] 2.2 Store the ID token's absolute expiry on `token.expiresAt` (ms), derived from `account.expires_at`

> Note: the refresh helpers live in `lib/google-token.ts` (a pure, `next-auth`-free
> module) and `auth.ts` imports `refreshGoogleIdTokenIfNeeded` from there. This
> keeps the logic unit-testable under Vitest, which cannot import `auth.ts`
> (it pulls in `next-auth` → `next/server`).

## 3. Refresh-on-read

- [x] 3.1 Add a `refreshGoogleIdToken(token)` helper that POSTs to `https://oauth2.googleapis.com/token` with `grant_type=refresh_token`, `client_id`, `client_secret`, and the stored refresh token using a bare `axios.post` (import `axios` directly — NOT the `lib/api.ts` instance — to avoid interceptor recursion and because it targets Google, not the backend)
- [x] 3.2 In the `jwt` callback, when no `account` is present, return the token unchanged if `Date.now() < token.expiresAt - skew` (skew ≈ 60s)
- [x] 3.3 Otherwise call `refreshGoogleIdToken`; on success update `token.idToken`, `token.expiresAt` (and refresh token if Google rotates it) and clear `token.error`
- [x] 3.4 On refresh failure set `token.error = "RefreshAccessTokenError"` and return the token without overwriting with empty values

## 4. Surface and act on refresh failure

- [x] 4.1 In the `session` callback, expose `token.error` on `session.error`
- [x] 4.2 Ensure an errored session routes the user back to `/onboarding` (extend the `authorized` callback / `/calendar` guard)

## 5. Offline access for every session (`app/onboarding/page.tsx`)

- [x] 5.1 Update the base `signIn("google", …)` call to pass `{ access_type: "offline", prompt: "consent" }` so every session obtains a refresh token

## 6. Verification

- [x] 6.1 `pnpm lint` and `pnpm build` pass
- [x] 6.2 Add/adjust Vitest coverage for the refresh logic: valid token returned unchanged, expired token triggers refresh and updates `idToken`/`expiresAt`, refresh failure sets `error`
- [x] 6.3 Manual: sign in, wait past the ~1h ID-token expiry (or temporarily shorten the threshold), confirm backend calls still succeed (no 401) and the token has rotated
