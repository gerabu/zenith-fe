"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useMounted } from "@/hooks/use-mounted";

/**
 * Leaf client control embedded in the server-rendered sidebar footer. Toggles
 * between light and dark via `next-themes`. The resolved icon is only rendered
 * after mount: before hydration the theme isn't known on the client, so we keep
 * the markup stable to avoid a hydration mismatch.
 */
export function ThemeSwitch() {
  const mounted = useMounted();
  const { resolvedTheme, setTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full justify-start gap-2"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      {mounted ? (
        isDark ? <Moon className="size-4" /> : <Sun className="size-4" />
      ) : (
        <span className="size-4" aria-hidden />
      )}
      {mounted ? (isDark ? "Dark" : "Light") : "Theme"}
    </Button>
  );
}
