import { api } from "@/lib/api";
import { refreshGoogleIdTokenIfNeeded } from "@/lib/google-token";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  pages: {
    signIn: "/onboarding",
  },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        // First sign-in: capture Google ID token (not the opaque access token)
        token.idToken = account.id_token;

        // Persist the refresh material so later reads can renew the ID token
        // before it expires. Keep any existing refresh token if this account
        // (e.g. a silent re-consent) didn't return one.
        token.refreshToken = account.refresh_token ?? token.refreshToken;
        if (account.expires_at) {
          token.expiresAt = account.expires_at * 1000;
        }

        // Persist identity so the calendar sidebar can render it without
        // another round-trip.
        if (profile) {
          token.name = profile.name ?? token.name;
          token.email = profile.email ?? token.email;
        }

        // Explicit Authorization header (not the axios interceptor) — this runs
        // before a session exists, so letting the interceptor call `auth()`
        // would recurse.
        const authHeader = { Authorization: `Bearer ${account.id_token}` };

        // Sync the user on sign-in (idempotent). Connection state is read per
        // render from the backend, not cached here.
        await api.get("/auth/sync", { headers: authHeader });

        // Incremental authorization: when this sign-in granted read-only
        // calendar access, hand the calendar tokens to the backend to persist.
        if (
          account.scope?.includes(
            "https://www.googleapis.com/auth/calendar.events.readonly"
          )
        ) {
          await api.patch(
            "/auth/calendar-connection",
            {
              accessToken: account.access_token,
              refreshToken: account.refresh_token,
            },
            { headers: authHeader }
          );
        }
        return token;
      }

      // Subsequent reads: renew the ID token via the refresh token when it is
      // expired or near expiry.
      return refreshGoogleIdTokenIfNeeded(token);
    },

    async session({ session, token }) {
      session.idToken = token.idToken as string;
      session.user.name = token.name ?? session.user.name;
      session.user.email = token.email ?? session.user.email;
      // Surface a refresh failure so the app can route the user back to sign-in
      // instead of issuing backend requests with a dead token.
      session.error = token.error;
      return session;
    },

    authorized({ auth: session, request }) {
      const isCalendar = request.nextUrl.pathname.startsWith("/calendar");
      // A session whose token refresh failed is treated as unauthenticated so
      // the user is bounced back to re-authenticate.
      if (isCalendar) return !!session?.user && !session.error;
      return true;
    },
  },
});
