import { describe, expect, it } from "vitest";
import {
  localDateKey,
  localHour,
  localTimeLabel,
  resolveTimeZone,
} from "@/lib/timezone";

describe("viewer-timezone rendering", () => {
  // Acceptance case: a UTC instant late in the day rolls back to the previous
  // local day and the correct local hour in a UTC−5 zone. Lima has no DST, so
  // it is a stable −5 fixture.
  const instant = new Date("2026-06-26T02:00:00Z");

  it("places the instant on the viewer's local day", () => {
    expect(localDateKey(instant, "America/Lima")).toBe("2026-06-25");
  });

  it("renders the viewer-local hour and label", () => {
    expect(localHour(instant, "America/Lima")).toBe(21);
    expect(localTimeLabel(instant, "America/Lima")).toBe("21:00");
  });

  it("is DST-correct (same UTC hour, different offset by season)", () => {
    // New York: EST (−5) in January, EDT (−4) in July.
    expect(localHour(new Date("2026-01-15T17:00:00Z"), "America/New_York")).toBe(
      12,
    );
    expect(localHour(new Date("2026-07-15T17:00:00Z"), "America/New_York")).toBe(
      13,
    );
  });

  it("validates the timezone cookie value", () => {
    expect(resolveTimeZone("America/New_York")).toBe("America/New_York");
    expect(resolveTimeZone("Not/AZone")).toBeNull();
    expect(resolveTimeZone(undefined)).toBeNull();
    expect(resolveTimeZone("")).toBeNull();
  });
});
