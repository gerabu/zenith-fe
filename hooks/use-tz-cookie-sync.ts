import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { TZ_COOKIE } from "@/lib/timezone";

// The viewer's IANA timezone is only knowable on the client, but the calendar
// fetches and renders on the server. This hook bridges the gap: it writes the
// resolved zone into the `zenith_tz` cookie and triggers a server re-render so
// fetching and rendering use one zone. Isolated here because it is an imperative
// browser side-effect (cookie write + refresh), which ARCHITECTURE.md keeps out
// of feature/page components.

function readCookie(name: string): string | undefined {
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${name}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function useTzCookieSync(): void {
  const router = useRouter();
  // Refresh at most once per mount so a browser that drops the cookie cannot
  // trap us in a write → refresh → write loop.
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz || readCookie(TZ_COOKIE) === tz) return;

    document.cookie = `${TZ_COOKIE}=${encodeURIComponent(tz)}; path=/; max-age=31536000; samesite=lax`;

    // Only re-render the server if the write actually took effect; if cookies
    // are disabled the value won't read back and we avoid a refresh loop.
    if (readCookie(TZ_COOKIE) === tz) router.refresh();
  }, [router]);
}
