"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

/**
 * Client provider boundary imported into the root layout. Hosts `next-themes`
 * so the light/dark class is driven at runtime and persisted. The app defaults
 * to dark (its original hard-coded look) when no preference is stored; system
 * detection is intentionally left off in favour of an explicit light↔dark
 * switch.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
