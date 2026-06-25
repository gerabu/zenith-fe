import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { ConnectCalendarButton } from "@/components/connect-calendar-button";

/**
 * Shown on the calendar view while the user's Google Calendar is not linked.
 * Booking depends on reading their events for conflicts, so this states the
 * requirement plainly and offers the connect action inline.
 */
export function ConnectCalendarAlert() {
  return (
    <Alert className="border-primary/25 bg-primary/5 sm:pr-56">
      <CalendarCheckIcon className="text-primary" />
      <AlertTitle className="text-foreground">
        Connect your calendar to book
      </AlertTitle>
      <AlertDescription>
        Zenith checks Google Calendar for conflicts before confirming a slot.
        Until it&apos;s connected you can view your week, but booking stays off.
      </AlertDescription>
      <AlertAction className="static col-start-2 mt-4 sm:absolute sm:top-1/2 sm:right-4 sm:col-auto sm:mt-0 sm:-translate-y-1/2">
        <ConnectCalendarButton redirectTo="/calendar" size="sm" />
      </AlertAction>
    </Alert>
  );
}

function CalendarCheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 2v4M16 2v4M3 10h18" />
      <path d="M21 13V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7" />
      <path d="m16 20 2 2 4-4" />
    </svg>
  );
}
