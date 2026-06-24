import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

// Server-side: inject the Google ID token from the NextAuth session as a Bearer
// token. Skipped when the caller already set an Authorization header (e.g. the
// sign-in `/auth/sync` call, which runs before a session exists) so we never
// recurse into `auth()` during sign-in. The dynamic import avoids a static
// import cycle with `auth.ts`.
api.interceptors.request.use(async (config) => {
  if (typeof window === "undefined" && !config.headers.Authorization) {
    const { auth } = await import("@/auth");
    const session = await auth();
    if (session?.idToken) {
      config.headers.Authorization = `Bearer ${session.idToken}`;
    }
  }

  return config;
});
