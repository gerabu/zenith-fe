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
