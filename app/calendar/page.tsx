import { auth } from "@/auth";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { getWeekAvailability } from "@/lib/availability";
import type { AvailabilityEvent } from "@/lib/types";
import { formatDateParam, parseWeekParam, weekDays } from "@/lib/week";
import { redirect } from "next/navigation";
import { CalendarSidebar } from "./CalendarSidebar";
import { CalendarWeekProvider } from "./CalendarWeekContext";
import { ConnectCalendarAlert } from "./ConnectCalendarAlert";
import { WeekGrid } from "./WeekGrid";
import { WeekNav } from "./WeekNav";
import type { CalendarDayVM, CalendarEventVM, CalendarWeekData } from "./types";

const weekdayFmt = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  timeZone: "UTC",
});
const monthDayFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const pad2 = (n: number) => String(n).padStart(2, "0");
const hhmm = (iso: string) => {
  const d = new Date(iso);
  return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
};

function toEventVM(event: AvailabilityEvent): CalendarEventVM {
  return {
    title: event.title,
    status: event.status as CalendarEventVM["status"],
    startHour: new Date(event.slot.start).getUTCHours(),
    timeLabel: `${hhmm(event.slot.start)} – ${hhmm(event.slot.end)}`,
  };
}

function rangeLabel(days: Date[]): string {
  const start = days[0];
  const end = days[6];
  const sameMonth = start.getUTCMonth() === end.getUTCMonth();
  const endStr = sameMonth ? String(end.getUTCDate()) : monthDayFmt.format(end);
  return `${monthDayFmt.format(start)} – ${endStr}, ${end.getUTCFullYear()}`;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) redirect("/onboarding");

  const { week } = await searchParams;
  const weekStart = parseWeekParam(week);
  const days = weekDays(weekStart);

  const availability = await getWeekAvailability(weekStart);

  const dayVMs: CalendarDayVM[] = days.map((date, i) => {
    const dateISO = formatDateParam(date);
    const day = availability[i];
    return {
      dateISO,
      weekdayLabel: weekdayFmt.format(date),
      dayNumber: String(date.getUTCDate()),
      error: day.error,
      // Only booked + external are rendered; available slots are dropped.
      events: day.events.filter((e) => e.status !== "available").map(toEventVM),
    };
  });

  // "Today" and the live marker are viewer-local — resolved on the client
  // (hooks/use-local-today.ts), not here in UTC.
  const data: CalendarWeekData = {
    weekStartISO: formatDateParam(weekStart),
    rangeLabel: rangeLabel(days),
    days: dayVMs,
  };

  return (
    <SidebarProvider>
      <CalendarSidebar name={session.user.name} email={session.user.email} />

      <SidebarInset className="h-svh overflow-hidden">
        <CalendarWeekProvider value={data}>
          <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-4">
            <SidebarTrigger className="md:hidden" />
            <h1 className="text-sm font-semibold tracking-tight text-foreground">
              Calendar
            </h1>
            <div className="ml-auto">
              <WeekNav />
            </div>
          </header>

          {!session.calendarConnected && (
            <div className="shrink-0 px-4 pt-3">
              <ConnectCalendarAlert />
            </div>
          )}

          <WeekGrid />
        </CalendarWeekProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}
