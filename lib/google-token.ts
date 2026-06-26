import axios from "axios";
import type { JWT } from "next-auth/jwt";

// Refresh the Google ID token slightly before it actually expires so we never
// hand the backend a token in its final seconds.
const EXPIRY_SKEW_MS = 60_000;

/**
 * Exchange the stored refresh token at Google's OAuth token endpoint for a fresh
 * ID token. Uses a bare `axios` call (NOT the shared `lib/api.ts` instance):
 * this targets Google, not our backend, and routing it through the instance
 * would trip its request interceptor (recursing into `auth()` and attaching our
 * backend Bearer/base URL to a Google request).
 */
export async function refreshGoogleIdToken(token: JWT): Promise<JWT> {
  try {
    if (!token.refreshToken) {
      throw new Error("No refresh token available to renew the ID token");
    }

    const { data } = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        client_id: process.env.AUTH_GOOGLE_ID!,
        client_secret: process.env.AUTH_GOOGLE_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    );

    return {
      ...token,
      idToken: data.id_token,
      expiresAt: Date.now() + data.expires_in * 1000,
      // Google usually keeps the same refresh token, but honour rotation.
      refreshToken: data.refresh_token ?? token.refreshToken,
      error: undefined,
    };
  } catch {
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

/**
 * Return the token untouched while its Google ID token is still comfortably
 * valid; otherwise renew it via the refresh token.
 */
export async function refreshGoogleIdTokenIfNeeded(token: JWT): Promise<JWT> {
  if (token.expiresAt && Date.now() < token.expiresAt - EXPIRY_SKEW_MS) {
    return token;
  }
  return refreshGoogleIdToken(token);
}
