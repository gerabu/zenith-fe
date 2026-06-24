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
    async jwt({ token, account }) {
      if (account) {
        // First sign-in: capture Google ID token (not the opaque access token)
        token.idToken = account.id_token;

        await api.get("/auth/sync", {
          headers: { Authorization: `Bearer ${account.id_token}` },
        });
      }
      return token;
    },

    async session({ session, token }) {
      session.idToken = token.idToken as string;
      return session;
    },

    authorized({ auth: session, request }) {
      const isCalendar = request.nextUrl.pathname.startsWith("/calendar");
      if (isCalendar) return !!session?.user;
      return true;
    },
  },
});
