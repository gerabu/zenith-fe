import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SlotGrid } from "../SlotGrid";

export default async function ConnectCalendarPage() {
  const session = await auth();
  if (!session) redirect("/onboarding");

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4">
      <SlotGrid />

      <div className="relative z-10 w-full max-w-sm rounded-2xl border bg-card p-8">
        {/* Brand + step */}
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Zenith
          </span>
          <span className="text-xs text-muted-foreground">Step 2 of 2</span>
        </div>

        {/* Calendar illustration */}
        <CalendarIllustration />

        <h2 className="mt-6 text-2xl font-bold tracking-tight text-foreground">
          Connect your calendar
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Zenith checks Google Calendar before confirming any slot — so you
          never double-book again.
        </p>

        {/* Connect button — coming in next slice */}
        <div className="mt-6">
          <Button
            disabled
            variant="secondary"
            size="lg"
            className="relative w-full"
          >
            Connect Google Calendar
            <span className="absolute -right-2 -top-2 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-primary-foreground">
              Soon
            </span>
          </Button>
        </div>

        <div className="my-5 h-px w-full bg-border" />

        {/* Defer */}
        <Link
          href="/calendar"
          className="block text-center text-sm text-muted-foreground transition-opacity hover:opacity-80"
        >
          I&apos;ll set it up later →
        </Link>
      </div>
    </main>
  );
}

function CalendarIllustration() {
  const days = ["M", "T", "W", "T", "F"];
  const hours = 4;
  const booked: [number, number][] = [
    [0, 1],
    [1, 0],
    [2, 2],
    [3, 1],
    [4, 3],
  ];
  const isBooked = (d: number, h: number) =>
    booked.some(([bd, bh]) => bd === d && bh === h);

  return (
    <div className="mt-6 overflow-hidden rounded-xl border bg-secondary p-4">
      {/* Day headers */}
      <div className="mb-2 grid grid-cols-5 gap-1 text-center">
        {days.map((d, i) => (
          <span
            key={i}
            className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"
          >
            {d}
          </span>
        ))}
      </div>

      {/* Slot grid */}
      <div className="grid grid-cols-5 gap-1">
        {Array.from({ length: hours }, (_, h) =>
          Array.from({ length: 5 }, (_, d) => {
            const booked = isBooked(d, h);
            return (
              <div
                key={`${d}-${h}`}
                className={cn(
                  "h-7 rounded-md border",
                  booked
                    ? "border-primary bg-primary/10"
                    : "border-border bg-transparent opacity-60"
                )}
              />
            );
          })
        )}
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Your existing events will block these slots automatically.
      </p>
    </div>
  );
}
