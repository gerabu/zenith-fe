import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function CalendarPage() {
  const session = await auth();
  if (!session) redirect("/onboarding");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="text-center">
        <span className="block text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          Zenith
        </span>
        <h1 className="mt-4 text-2xl font-bold text-foreground">Your calendar</h1>
        <p className="mt-2 text-sm text-muted-foreground">Booking view coming soon.</p>
      </div>
    </main>
  );
}
