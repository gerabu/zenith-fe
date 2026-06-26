// Shared backend contract types.

// Standard backend envelope. Mutual exclusivity: success => data present,
// error omitted; failure => error present, data omitted.
export type ApiResponse<T> =
  | { success: true; data: T; error?: never }
  | { success: false; error: string; data?: never };

export type AvailabilityStatus = "available" | "booked" | "external";

export interface Slot {
  /** ISO 8601 timestamp (UTC). */
  start: string;
  /** ISO 8601 timestamp (UTC). */
  end: string;
}

export interface AvailabilityEvent {
  status: AvailabilityStatus;
  slot: Slot;
  title: string;
}

/** Request body for `POST /bookings`. Times are ISO 8601 timestamps (UTC). */
export interface BookingInput {
  title: string;
  /** ISO 8601 timestamp (UTC). */
  startTime: string;
  /** ISO 8601 timestamp (UTC). */
  endTime: string;
}

/** A booking as returned by the backend. */
export interface Booking {
  id: string;
  userId: string;
  title: string;
  /** ISO 8601 timestamp (UTC). */
  startTime: string;
  /** ISO 8601 timestamp (UTC). */
  endTime: string;
  /** ISO 8601 timestamp (UTC). */
  createdAt: string;
}
