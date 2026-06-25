import { afterEach, describe, expect, it, vi } from "vitest";

// Mock the shared axios instance so the reader is exercised in isolation; the
// real interceptor (which calls `auth()`) never runs under test. `vi.hoisted`
// keeps `get` defined before the hoisted `vi.mock` factory runs.
const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@/lib/api", () => ({ api: { get } }));

import { getCalendarConnected } from "@/lib/calendar-connection";

afterEach(() => {
  vi.clearAllMocks();
});

// The backend wraps the payload in the standard `ApiResponse` envelope, so the
// axios response body is `{ success, data: { calendarConnected } }`.
describe("getCalendarConnected", () => {
  it("returns true when the backend reports connected", async () => {
    get.mockResolvedValue({
      data: { success: true, data: { calendarConnected: true } },
    });
    expect(await getCalendarConnected()).toBe(true);
    expect(get).toHaveBeenCalledWith("/auth/calendar-connection");
  });

  it("returns false when the backend reports not connected", async () => {
    get.mockResolvedValue({
      data: { success: true, data: { calendarConnected: false } },
    });
    expect(await getCalendarConnected()).toBe(false);
  });

  it("returns false (assume disconnected) when the flag is absent", async () => {
    get.mockResolvedValue({ data: { success: true, data: {} } });
    expect(await getCalendarConnected()).toBe(false);
  });

  it("returns false (assume disconnected) on a failure envelope", async () => {
    get.mockResolvedValue({ data: { success: false, error: "nope" } });
    expect(await getCalendarConnected()).toBe(false);
  });

  it("returns false (assume disconnected) when the request throws", async () => {
    get.mockRejectedValue(new Error("network down"));
    expect(await getCalendarConnected()).toBe(false);
  });
});
