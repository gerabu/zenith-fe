"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteBooking } from "@/app/bookings/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useLocalToday } from "@/hooks/use-local-today";
import { cn } from "@/lib/utils";
import { useCalendarWeek } from "./CalendarWeekContext";
import type { CalendarDayVM, CalendarEventVM } from "./types";

const HOURS = Array.from({ length: 24 }, (_, h) => h);

// One source of truth for row height so the gutter, headers, and the live
// marker all line up.
const ROW_CLASS = "h-14"; // 3.5rem

export function WeekGrid() {
  const { days } = useCalendarWeek();
  // "Today" and "now" are viewer-local; the week structure is server-rendered.
  const { todayISO, nowMinutes } = useLocalToday();

  return (
    <div className="flex-1 overflow-auto">
      <div className="flex min-w-[56rem]">
        <TimeGutter />
        <div className="grid flex-1 grid-cols-7">
          {days.map((day) => (
            <DayColumn
              key={day.dateISO}
              day={day}
              isToday={day.dateISO === todayISO}
              nowMinutes={nowMinutes}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TimeGutter() {
  return (
    <div className="sticky left-0 z-20 w-14 shrink-0 bg-background">
      {/* Spacer aligned to the sticky day headers. */}
      <div className="sticky top-0 z-10 h-16 border-b border-border bg-background" />
      {HOURS.map((h) => (
        <div
          key={h}
          className={cn(
            ROW_CLASS,
            "relative -top-2 pr-2 text-right font-mono text-[0.625rem] tabular-nums text-muted-foreground/70"
          )}
        >
          {h === 0 ? "" : String(h).padStart(2, "0")}
        </div>
      ))}
    </div>
  );
}

function DayColumn({
  day,
  isToday,
  nowMinutes,
}: {
  day: CalendarDayVM;
  isToday: boolean;
  nowMinutes: number | null;
}) {
  const showNow = isToday && nowMinutes !== null;

  return (
    <div className="relative border-l border-border first:border-l-0">
      {/* Sticky header */}
      <header
        className={cn(
          "sticky top-0 z-10 flex h-16 flex-col items-center justify-center gap-0.5 border-b bg-background",
          isToday ? "border-primary/60" : "border-border"
        )}
      >
        <span
          className={cn(
            "text-[0.625rem] font-semibold uppercase tracking-[0.2em]",
            isToday ? "text-primary" : "text-muted-foreground"
          )}
        >
          {day.weekdayLabel}
        </span>
        <span
          className={cn(
            "flex h-7 min-w-7 items-center justify-center rounded-full px-1.5 text-sm font-semibold tabular-nums",
            isToday
              ? "bg-primary text-primary-foreground"
              : "text-foreground"
          )}
        >
          {day.dayNumber}
        </span>
      </header>

      {/* Hour grid body */}
      <div className={cn("relative", isToday && "bg-primary/[0.03]")}>
        {HOURS.map((h) => (
          <div
            key={h}
            className={cn(ROW_CLASS, "border-b border-border/40 px-1 py-0.5")}
          >
            {day.events
              .filter((e) => e.startHour === h)
              .map((event, i) => (
                <EventBlock key={`${event.title}-${i}`} event={event} />
              ))}
          </div>
        ))}

        {day.error ? <DayError message={day.error} /> : null}

        {showNow ? <NowMarker minutes={nowMinutes!} /> : null}
      </div>
    </div>
  );
}

function EventBlock({ event }: { event: CalendarEventVM }) {
  const isBooked = event.status === "booked";
  // Only internal bookings that carry an id can be deleted; external (Google)
  // events and id-less bookings show no delete affordance.
  const deletable = isBooked && Boolean(event.id);

  return (
    <div
      className={cn(
        "group relative mb-0.5 rounded-md px-2 py-1 text-xs leading-tight shadow-sm",
        isBooked
          ? "bg-primary text-primary-foreground"
          : "border border-secondary-foreground/10 bg-secondary text-secondary-foreground"
      )}
      title={`${event.title} · ${event.timeLabel}`}
    >
      <p className="truncate font-medium">{event.title}</p>
      <p
        className={cn(
          "truncate font-mono text-[0.625rem] tabular-nums",
          isBooked ? "text-primary-foreground/75" : "text-secondary-foreground/60"
        )}
      >
        {event.timeLabel}
      </p>
      {deletable ? <DeleteEventButton event={event} /> : null}
    </div>
  );
}

// Hover-revealed trash control on a booked tile. Deletion is confirmed in an
// AlertDialog; the request runs in a transition (the confirm button reflects the
// pending state), and a failure is surfaced as a toast while the tile stays put —
// revalidation reconciles the grid on success.
function DeleteEventButton({ event }: { event: CalendarEventVM }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function confirmDelete() {
    startTransition(async () => {
      const result = await deleteBooking(event.id!);
      if (result.success) {
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        aria-label={`Delete booking ${event.title}`}
        className="absolute right-1 top-1 inline-flex size-5 items-center justify-center rounded text-primary-foreground/70 opacity-0 transition group-hover:opacity-100 hover:bg-primary-foreground/15 hover:text-primary-foreground focus-visible:opacity-100 focus-visible:outline-none"
      >
        <Trash2 className="size-3.5" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete booking?</AlertDialogTitle>
          <AlertDialogDescription>
            “{event.title}” · {event.timeLabel} will be removed. This can’t be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={confirmDelete}
          >
            {isPending ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Signature element: a hairline marking the current time across today's column.
function NowMarker({ minutes }: { minutes: number }) {
  const top = `${(minutes / 1440) * 100}%`;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
      style={{ top }}
    >
      <span className="size-2 -translate-x-1 rounded-full bg-primary" />
      <span className="h-px flex-1 bg-primary/70" />
    </div>
  );
}

function DayError({ message }: { message: string }) {
  return (
    <div className="absolute inset-x-1 top-2 rounded-md border border-dashed border-destructive/40 bg-destructive/5 px-2 py-1.5 text-[0.625rem] leading-snug text-destructive">
      {message}
    </div>
  );
}
