"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addWeeks, formatDateParam, startOfWeekMonday } from "@/lib/week";
import { useCalendarWeek } from "./CalendarWeekContext";

export function WeekNav() {
  const router = useRouter();
  const { weekStartISO, rangeLabel } = useCalendarWeek();

  const goToWeek = (monday: Date) => {
    router.push(`/calendar?week=${formatDateParam(monday)}`);
  };

  const current = new Date(`${weekStartISO}T00:00:00.000Z`);
  const thisWeek = startOfWeekMonday(new Date());
  const isCurrentWeek = formatDateParam(thisWeek) === weekStartISO;

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
        disabled={isCurrentWeek}
        onClick={() => goToWeek(thisWeek)}
      >
        Today
      </Button>
    </div>
  );
}
