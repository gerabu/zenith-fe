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

        await api.get("/auth/sync", {
          headers: { Authorization: `Bearer ${account.id_token}` },
        });
      }
      return token;
    },

    async session({ session, token }) {
      session.idToken = token.idToken as string;
      session.user.name = token.name ?? session.user.name;
      session.user.email = token.email ?? session.user.email;
      return session;
    },

    authorized({ auth: session, request }) {
      const isCalendar = request.nextUrl.pathname.startsWith("/calendar");
      if (isCalendar) return !!session?.user;
      return true;
    },
  },
});
