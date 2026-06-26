import { CalendarCheck2 } from "lucide-react";

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
      <CalendarCheck2 className="text-primary" />
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
