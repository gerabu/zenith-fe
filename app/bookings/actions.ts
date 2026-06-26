"use server";

import { isAxiosError } from "axios";
import { revalidatePath } from "next/cache";

import { api } from "@/lib/api";
import type { ApiResponse, Booking, BookingInput } from "@/lib/types";
import { bookingSchema } from "./schema";

/**
 * Create a booking via `POST /bookings`. Runs server-side so the shared axios
 * instance attaches the Bearer ID token (its interceptor only does so on the
 * server). `startTime`/`endTime` are expected as ISO 8601 UTC — the client
 * converts wall-clock input in the viewer's zone before calling this. Never
 * throws: always returns the standard `ApiResponse` envelope.
 */
export async function createBooking(
  input: BookingInput,
): Promise<ApiResponse<Booking>> {
  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid booking details." };
  }

  try {
    const { data } = await api.post<ApiResponse<Booking>>(
      "/bookings",
      parsed.data,
    );
    // Refresh the RSC week grid so the new booking appears.
    if (data.success) revalidatePath("/calendar");
    return data;
  } catch (err) {
    return { success: false, error: backendError(err) };
  }
}

// A non-2xx response (e.g. a calendar conflict) makes axios throw; the backend's
// `ApiResponse` error envelope rides along on the response body.
function backendError(err: unknown): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as ApiResponse<unknown> | undefined;
    if (data && data.success === false && data.error) return data.error;
  }
  return "Something went wrong creating your booking. Please try again.";
}
