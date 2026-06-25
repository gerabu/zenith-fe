import { api } from "@/lib/api";
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

        // Sync the user and learn whether their calendar is already linked, so
        // the flag survives across sessions/devices.
        const sync = await api.get<{ calendarConnected?: boolean }>(
          "/auth/sync",
          { headers: authHeader }
        );
        token.calendarConnected = sync.data?.calendarConnected ?? false;

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
          // Only on a successful PATCH — a thrown error leaves the flag false
          // so the connect prompt stays visible for a retry.
          token.calendarConnected = true;
        }
      }
      return token;
    },

    async session({ session, token }) {
      session.idToken = token.idToken as string;
      session.user.name = token.name ?? session.user.name;
      session.user.email = token.email ?? session.user.email;
      session.calendarConnected =
        (token.calendarConnected as boolean | undefined) ?? false;
      return session;
    },

    authorized({ auth: session, request }) {
      const isCalendar = request.nextUrl.pathname.startsWith("/calendar");
      if (isCalendar) return !!session?.user;
      return true;
    },
  },
});
