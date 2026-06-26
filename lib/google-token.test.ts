import { afterEach, describe, expect, it, vi } from "vitest";

// The Google token endpoint is hit with a bare `axios.post`, mocked here so the
// refresh helpers are exercised in isolation.
const { post } = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock("axios", () => ({ default: { post } }));

import {
  refreshGoogleIdToken,
  refreshGoogleIdTokenIfNeeded,
} from "@/lib/google-token";

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe("refreshGoogleIdTokenIfNeeded", () => {
  it("returns the token unchanged while it is comfortably valid", async () => {
    const token = {
      idToken: "current",
      refreshToken: "r",
      expiresAt: Date.now() + 10 * 60_000,
    };

    const result = await refreshGoogleIdTokenIfNeeded(token);

    expect(result).toBe(token);
    expect(post).not.toHaveBeenCalled();
  });

  it("refreshes when the token is past its near-expiry threshold", async () => {
    post.mockResolvedValue({
      data: { id_token: "fresh", expires_in: 3600 },
    });
    const token = {
      idToken: "stale",
      refreshToken: "r",
      expiresAt: Date.now() + 1_000, // inside the 60s skew window
    };

    const result = await refreshGoogleIdTokenIfNeeded(token);

    expect(post).toHaveBeenCalledOnce();
    expect(result.idToken).toBe("fresh");
    expect(result.expiresAt).toBeGreaterThan(token.expiresAt);
    expect(result.error).toBeUndefined();
  });
});

describe("refreshGoogleIdToken", () => {
  it("updates idToken and expiresAt on a successful exchange", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-25T00:00:00Z"));
    post.mockResolvedValue({
      data: { id_token: "fresh", expires_in: 3600 },
    });

    const result = await refreshGoogleIdToken({
      idToken: "stale",
      refreshToken: "r",
      expiresAt: 0,
    });

    expect(result.idToken).toBe("fresh");
    expect(result.expiresAt).toBe(Date.now() + 3600 * 1000);
    expect(result.refreshToken).toBe("r"); // preserved when Google omits one
    expect(result.error).toBeUndefined();
  });

  it("keeps a rotated refresh token when Google returns one", async () => {
    post.mockResolvedValue({
      data: { id_token: "fresh", expires_in: 3600, refresh_token: "rotated" },
    });

    const result = await refreshGoogleIdToken({
      idToken: "stale",
      refreshToken: "r",
      expiresAt: 0,
    });

    expect(result.refreshToken).toBe("rotated");
  });

  it("sets an error when the refresh request fails", async () => {
    post.mockRejectedValue(new Error("invalid_grant"));

    const result = await refreshGoogleIdToken({
      idToken: "stale",
      refreshToken: "r",
      expiresAt: 0,
    });

    expect(result.error).toBe("RefreshAccessTokenError");
    expect(result.idToken).toBe("stale"); // not overwritten with empty values
  });

  it("sets an error when there is no refresh token to exchange", async () => {
    const result = await refreshGoogleIdToken({
      idToken: "stale",
      expiresAt: 0,
    });

    expect(post).not.toHaveBeenCalled();
    expect(result.error).toBe("RefreshAccessTokenError");
  });
});
