## 1. Dependencies & environment

- [x] 1.1 Install `next-auth` (Auth.js v5) and `axios` with pnpm
- [x] 1.2 Add env vars to `.env.local` and document in `.env.example`: `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `NEXT_PUBLIC_API_URL=http://localhost:3001`
- [x] 1.3 Read `node_modules/next/dist/docs/01-app/.../route-handlers.md` and the Auth.js v5 App Router guide before wiring auth

## 2. Backend axios instance

- [x] 2.1 Create `lib/api.ts` exporting a single typed axios instance with `baseURL: process.env.NEXT_PUBLIC_API_URL` and `withCredentials: true`
- [x] 2.2 Add a request interceptor placeholder that will inject `Authorization: Bearer {idToken}` from the session

## 3. NextAuth configuration

- [x] 3.1 Create root `auth.ts` calling `NextAuth({...})` with the Google provider, exporting `{ handlers, auth, signIn, signOut }`
- [x] 3.2 In the `jwt` callback, on first sign-in (`account` present) store the Google `id_token` on the token (not the opaque access token)
- [x] 3.3 In the `jwt` callback, on first sign-in call `GET {NEXT_PUBLIC_API_URL}/auth/sync` with header `Authorization: Bearer {id_token}` and surface failures rather than minting an unsynced session
- [x] 3.4 In the `session` callback, expose the Google ID token on the session object
- [x] 3.5 Add NextAuth module augmentation types so the ID token on token/session is typed

## 4. Route handler

- [x] 4.1 Create `app/api/auth/[...nextauth]/route.ts` re-exporting `const { GET, POST } = handlers`

## 5. Onboarding flow UI

- [x] 5.1 Create the sign-in entry screen (Server Component) with a "Sign in with Google" action (client leaf calling `signIn("google")`)
- [x] 5.2 Create the connect-calendar step that, after sign-in, offers only an "I'll do it later" action which routes the user forward
- [x] 5.3 Gate the flow: unauthenticated users see sign-in; authenticated users reaching onboarding land on the connect-calendar step

## 6. Protected `/calendar` route

- [x] 6.1 Create an empty placeholder page at `app/calendar/page.tsx`
- [x] 6.2 Protect `/calendar` so only authenticated users can access it (via the `auth` helper / middleware), redirecting unauthenticated users to the sign-in entry point
- [x] 6.3 Redirect the user to `/calendar` after completing onboarding (the "I'll do it later" deferral)

## 7. Verification

- [x] 7.1 `pnpm build` succeeds and `pnpm lint` passes
- [x] 7.2 Manually verify: Google sign-in completes, `/auth/sync` is called with the Bearer ID token, session carries the ID token, "I'll do it later" redirects to `/calendar`, and an unauthenticated visit to `/calendar` is redirected to sign-in
