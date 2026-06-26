import { describe, expect, it } from "vitest";
import { bookingFormSchema, bookingSchema } from "./schema";

const validForm = {
  title: "Design review",
  date: "2026-06-25",
  startTime: "14:00",
  endTime: "15:00",
};

// Collect error messages keyed by field for easy assertions.
function fieldErrors(
  schema: typeof bookingFormSchema | typeof bookingSchema,
  input: unknown,
): Record<string, string[]> {
  const result = schema.safeParse(input);
  if (result.success) return {};
  const out: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "_");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

describe("bookingFormSchema (date + times)", () => {
  it("accepts a valid booking", () => {
    expect(bookingFormSchema.safeParse(validForm).success).toBe(true);
  });

  it("requires title, date, startTime, and endTime", () => {
    const errors = fieldErrors(bookingFormSchema, {
      title: "",
      date: "",
      startTime: "",
      endTime: "",
    });
    expect(errors.title?.[0]).toMatch(/required/i);
    expect(errors.date?.[0]).toMatch(/required/i);
    expect(errors.startTime?.[0]).toMatch(/required/i);
    expect(errors.endTime?.[0]).toMatch(/required/i);
  });

  it("rejects whitespace-only titles", () => {
    const errors = fieldErrors(bookingFormSchema, { ...validForm, title: "   " });
    expect(errors.title?.[0]).toMatch(/required/i);
  });

  it("rejects end time before start time", () => {
    const errors = fieldErrors(bookingFormSchema, {
      ...validForm,
      startTime: "15:00",
      endTime: "14:00",
    });
    expect(errors.endTime?.[0]).toMatch(/after start time/i);
  });

  it("rejects end time equal to start time", () => {
    const errors = fieldErrors(bookingFormSchema, {
      ...validForm,
      startTime: "14:00",
      endTime: "14:00",
    });
    expect(errors.endTime?.[0]).toMatch(/after start time/i);
  });

  it("rejects a duration under 15 minutes", () => {
    const errors = fieldErrors(bookingFormSchema, {
      ...validForm,
      startTime: "14:00",
      endTime: "14:14",
    });
    expect(errors.endTime?.[0]).toMatch(/15 minutes/i);
  });

  it("accepts a duration of exactly 15 minutes", () => {
    const result = bookingFormSchema.safeParse({
      ...validForm,
      startTime: "14:00",
      endTime: "14:15",
    });
    expect(result.success).toBe(true);
  });
});

describe("bookingSchema (server, ISO timestamps)", () => {
  it("accepts valid ISO UTC timestamps", () => {
    const result = bookingSchema.safeParse({
      title: "Design review",
      startTime: "2026-06-25T19:00:00.000Z",
      endTime: "2026-06-25T19:15:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a duration under 15 minutes", () => {
    const errors = fieldErrors(bookingSchema, {
      title: "Design review",
      startTime: "2026-06-25T19:00:00.000Z",
      endTime: "2026-06-25T19:10:00.000Z",
    });
    expect(errors.endTime?.[0]).toMatch(/15 minutes/i);
  });
});
