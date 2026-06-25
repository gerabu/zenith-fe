import { useMemo, useSyncExternalStore } from "react";

// "Today" and "now" are viewer-local, live facts — UTC is wrong for them. This
// hook owns the browser-clock subscription so the calendar's week structure can
// stay server-rendered while the today highlight and the current-time marker
// follow the viewer's timezone.

export interface LocalToday {
  /** Viewer-local current date as `YYYY-MM-DD`, or null before the client mounts. */
  todayISO: string | null;
  /** Minutes since local midnight, or null before the client mounts. */
  nowMinutes: number | null;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Snapshot as a primitive `"YYYY-MM-DD|minutes"` so equal ticks compare equal. */
function snapshot(): string {
  const now = new Date();
  const date = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  const minutes = now.getHours() * 60 + now.getMinutes();
  return `${date}|${minutes}`;
}

function subscribe(onChange: () => void): () => void {
  const id = setInterval(onChange, 60_000);
  return () => clearInterval(id);
}

// Server (and the first hydration render) get no local value, so SSR output
// matches and there is no hydration mismatch; the client fills it in on mount.
const getServerSnapshot = () => null;

export function useLocalToday(): LocalToday {
  const snap = useSyncExternalStore(subscribe, snapshot, getServerSnapshot);

  return useMemo(() => {
    if (!snap) return { todayISO: null, nowMinutes: null };
    const [todayISO, minutes] = snap.split("|");
    return { todayISO, nowMinutes: Number(minutes) };
  }, [snap]);
}
