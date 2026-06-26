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
    return {
      success: false,
      error: backendError(
        err,
        "Something went wrong creating your booking. Please try again.",
      ),
    };
  }
}

/**
 * Delete an internal booking via `DELETE /bookings/:id`. Runs server-side so the
 * shared axios instance attaches the Bearer ID token. Never throws: always
 * returns the standard `ApiResponse` envelope. On success the calendar week grid
 * is revalidated so the deleted booking disappears.
 */
export async function deleteBooking(id: string): Promise<ApiResponse<null>> {
  if (!id) {
    return { success: false, error: "Invalid booking." };
  }

  try {
    // axios throws on any non-2xx, so reaching here means the delete succeeded.
    // `DELETE /bookings/:id` may answer 204 No Content (empty body) or a success
    // envelope — both are success. Only an explicit `{ success: false }` body is
    // treated as a failure.
    const { data } = await api.delete<ApiResponse<null> | "" | null>(
      `/bookings/${encodeURIComponent(id)}`,
    );

    if (data && typeof data === "object" && data.success === false) {
      return data;
    }

    revalidatePath("/calendar");
    return { success: true, data: null };
  } catch (err) {
    return {
      success: false,
      error: backendError(
        err,
        "Something went wrong deleting your booking. Please try again.",
      ),
    };
  }
}

// A non-2xx response (e.g. a calendar conflict) makes axios throw; the backend's
// `ApiResponse` error envelope rides along on the response body. `fallback` is
// used only when no backend error message is present.
function backendError(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as ApiResponse<unknown> | undefined;
    if (data && data.success === false && data.error) return data.error;
  }
  return fallback;
}
