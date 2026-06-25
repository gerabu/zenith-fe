import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";

function initials(name: string | null | undefined, email: string): string {
  const source = name?.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export function CalendarSidebar({
  name,
  email,
  timeZone,
}: {
  name: string | null | undefined;
  email: string;
  /** Viewer's resolved IANA zone; absent until it is known on first load. */
  timeZone?: string | null;
}) {
  return (
    <Sidebar>
      <SidebarHeader className="gap-0 p-5">
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          Zenith
        </span>
        <p className="mt-1 text-sm text-muted-foreground">Your week at a glance</p>
      </SidebarHeader>

      <SidebarContent className="px-5">
        {/* Signed-in user */}
        <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {initials(name, email)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {name || "Signed in"}
            </p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
        </div>

        {/* Legend: what the two colors mean */}
        <div className="mt-6">
          <span className="text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Legend
          </span>
          <ul className="mt-3 space-y-2.5">
            <li className="flex items-center gap-2.5 text-sm text-foreground">
              <span className="size-3 shrink-0 rounded-sm bg-primary" />
              Booked on Zenith
            </li>
            <li className="flex items-center gap-2.5 text-sm text-foreground">
              <span className="size-3 shrink-0 rounded-sm border border-secondary-foreground/15 bg-secondary" />
              From your calendar
            </li>
          </ul>
        </div>
      </SidebarContent>

      <SidebarFooter className="p-5">
        <p className="text-[0.625rem] leading-relaxed text-muted-foreground">
          {timeZone ? `Times shown in ${timeZone}. ` : ""}Pick a slot to book —
          coming soon.
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
