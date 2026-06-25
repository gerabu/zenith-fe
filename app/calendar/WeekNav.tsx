"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addWeeks, formatDateParam, startOfWeekMonday } from "@/lib/week";
import { useLocalToday } from "@/hooks/use-local-today";
import { useCalendarWeek } from "./CalendarWeekContext";

export function WeekNav() {
  const router = useRouter();
  const { weekStartISO, rangeLabel } = useCalendarWeek();
  const { todayISO } = useLocalToday();

  const goToWeek = (monday: Date) => {
    router.push(`/calendar?week=${formatDateParam(monday)}`);
  };

  const current = new Date(`${weekStartISO}T00:00:00.000Z`);
  // The current week is keyed off the viewer's local date (UTC-calendar-date
  // space, matching the day columns). Before the client mounts `todayISO` is
  // null, so the "Today" control stays enabled until the local date resolves.
  const thisWeek = todayISO
    ? startOfWeekMonday(new Date(`${todayISO}T00:00:00.000Z`))
    : null;
  const isCurrentWeek = thisWeek
    ? formatDateParam(thisWeek) === weekStartISO
    : false;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Previous week"
          onClick={() => goToWeek(addWeeks(current, -1))}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Next week"
          onClick={() => goToWeek(addWeeks(current, 1))}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <p className="min-w-0 font-mono text-sm tabular-nums tracking-tight text-foreground">
        {rangeLabel}
      </p>

      <Button
        variant="outline"
        size="sm"
        className="ml-1"
        disabled={isCurrentWeek || !thisWeek}
        onClick={() => thisWeek && goToWeek(thisWeek)}
      >
        Today
      </Button>
    </div>
  );
}
