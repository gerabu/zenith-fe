"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Returns `false` during SSR and the first (hydration) client render, then
 * `true` once mounted. Backed by `useSyncExternalStore` — the server snapshot
 * is `false` and the client snapshot is `true` — so it needs no `useEffect`.
 * Used to defer rendering of client-only values (e.g. the resolved theme) until
 * hydration completes, avoiding hydration mismatches.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
