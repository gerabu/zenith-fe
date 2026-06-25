import { auth } from "@/auth";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { getWeekAvailability } from "@/lib/availability";
import { localHour, localTimeLabel, resolveTimeZone, TZ_COOKIE } from "@/lib/timezone";
import type { AvailabilityEvent } from "@/lib/types";
import { formatDateParam, parseWeekParam, weekDays } from "@/lib/week";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CalendarSidebar } from "./CalendarSidebar";
import { CalendarWeekProvider } from "./CalendarWeekContext";
import { ConnectCalendarAlert } from "./ConnectCalendarAlert";
import { TzCookieSync } from "./TzCookieSync";
import { WeekGrid } from "./WeekGrid";
import { WeekNav } from "./WeekNav";
import type { CalendarDayVM, CalendarEventVM, CalendarWeekData } from "./types";

// Day-structure labels read *civil* dates (UTC-midnight instants), so they
// format in UTC. The viewer-local correctness of which days are shown comes
// from computing the week in the viewer's zone (parseWeekParam), not from these
// formatters. Only true event instants below are rendered in the viewer's zone.
const weekdayFmt = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  timeZone: "UTC",
});
const monthDayFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

function toEventVM(event: AvailabilityEvent, tz: string): CalendarEventVM {
  const start = new Date(event.slot.start);
  return {
    title: event.title,
    status: event.status as CalendarEventVM["status"],
    startHour: localHour(start, tz),
    timeLabel: `${localTimeLabel(start, tz)} – ${localTimeLabel(new Date(event.slot.end), tz)}`,
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

  // The viewer's IANA zone arrives via cookie (set client-side by TzCookieSync).
  // Until it is known we must not fetch or render in UTC — gate on it instead so
  // the zone used to fetch and the zone used to render are always identical.
  const cookieStore = await cookies();
  const tz = resolveTimeZone(cookieStore.get(TZ_COOKIE)?.value);
  if (!tz) {
    return <TimezoneGate name={session.user.name} email={session.user.email} />;
  }

  const { week } = await searchParams;
  const weekStart = parseWeekParam(week, tz);
  const days = weekDays(weekStart);

  const availability = await getWeekAvailability(weekStart, tz);

  const dayVMs: CalendarDayVM[] = days.map((date, i) => {
    const dateISO = formatDateParam(date);
    const day = availability[i];
    return {
      dateISO,
      weekdayLabel: weekdayFmt.format(date),
      dayNumber: String(date.getUTCDate()),
      error: day.error,
      // Only booked + external are rendered; available slots are dropped.
      events: day.events
        .filter((e) => e.status !== "available")
        .map((e) => toEventVM(e, tz)),
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
      <CalendarSidebar
        name={session.user.name}
        email={session.user.email}
        timeZone={tz}
      />

      <SidebarInset className="h-svh overflow-hidden">
        {/* Keep the cookie aligned so a later zone change re-syncs fetch+render. */}
        <TzCookieSync />
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

// Shown only on the first visit, before the viewer's zone is known. It renders
// no day/time content (which would otherwise have to assume UTC) and mounts
// TzCookieSync, which sets the cookie and refreshes into the real calendar.
function TimezoneGate({
  name,
  email,
}: {
  name: string | null | undefined;
  email: string;
}) {
  return (
    <SidebarProvider>
      <CalendarSidebar name={name} email={email} />

      <SidebarInset className="h-svh overflow-hidden">
        <TzCookieSync />
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-4">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-sm font-semibold tracking-tight text-foreground">
            Calendar
          </h1>
        </header>
        <div className="flex flex-1 items-center justify-center p-8">
          <p className="text-sm text-muted-foreground">Loading your calendar…</p>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
