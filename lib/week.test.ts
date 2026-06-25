import { afterEach, describe, expect, it, vi } from "vitest";
import { formatDateParam, parseWeekParam } from "@/lib/week";

afterEach(() => {
  vi.useRealTimers();
});

describe("parseWeekParam", () => {
  it("aligns an explicit civil date to its Monday, zone-independently", () => {
    // 2026-06-25 is a Thursday → Monday of that week is 2026-06-22.
    expect(formatDateParam(parseWeekParam("2026-06-25", "America/Lima"))).toBe(
      "2026-06-22",
    );
    expect(formatDateParam(parseWeekParam("2026-06-25", "UTC"))).toBe(
      "2026-06-22",
    );
  });

  it("falls back to the viewer-local week containing today", () => {
    // Instant where UTC and Lima (−5) fall in different weeks:
    // UTC      → Mon 2026-06-29 → week of 2026-06-29
    // Lima −5  → Sun 2026-06-28 → week of 2026-06-22
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-29T02:00:00Z"));

    expect(formatDateParam(parseWeekParam(undefined, "UTC"))).toBe("2026-06-29");
    expect(formatDateParam(parseWeekParam(undefined, "America/Lima"))).toBe(
      "2026-06-22",
    );
  });
});
