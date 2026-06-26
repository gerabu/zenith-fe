import { z } from "zod";

/** Minimum booking duration. Shared by the rules below and any callers. */
export const MIN_BOOKING_MINUTES = 15;
const MIN_BOOKING_MS = MIN_BOOKING_MINUTES * 60 * 1000;

// End strictly after start, then at least 15 minutes apart. Factored out so the
// form schema (date + times) and the server schema (ISO timestamps) enforce the
// identical cross-field rules. `start`/`end` are epoch ms; callers pass `NaN`
// for empty/unparseable input so these defer to the per-field messages.
function refineOrderAndDuration<T extends z.ZodTypeAny>(
  schema: T,
  pick: (v: z.infer<T>) => { start: number; end: number },
) {
  return schema
    .refine(
      (v: z.infer<T>) => {
        const { start, end } = pick(v);
        return Number.isNaN(start) || Number.isNaN(end) || end > start;
      },
      { path: ["endTime"], message: "End time must be after start time" },
    )
    .refine(
      (v: z.infer<T>) => {
        const { start, end } = pick(v);
        if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return true;
        return end - start >= MIN_BOOKING_MS;
      },
      {
        path: ["endTime"],
        message: `Booking must be at least ${MIN_BOOKING_MINUTES} minutes long`,
      },
    );
}

// Client form shape: a calendar `date` (YYYY-MM-DD) plus time-only `startTime`
// and `endTime` (HH:MM), as produced by `<input type="date">` / `type="time">`.
// They are combined into wall-clock instants on the same day for validation.
export const bookingFormSchema = refineOrderAndDuration(
  z.object({
    title: z.string().trim().min(1, "Title is required"),
    date: z.string().min(1, "Date is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
  }),
  (v) => ({
    start: Date.parse(`${v.date}T${v.startTime}`),
    end: Date.parse(`${v.date}T${v.endTime}`),
  }),
);

export type BookingFormValues = z.infer<typeof bookingFormSchema>;

// Server-side shape: the `createBooking` action re-validates the already-combined
// ISO 8601 UTC `startTime`/`endTime`. Structurally identical to `BookingInput`.
export const bookingSchema = refineOrderAndDuration(
  z.object({
    title: z.string().trim().min(1, "Title is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
  }),
  (v) => ({ start: Date.parse(v.startTime), end: Date.parse(v.endTime) }),
);
