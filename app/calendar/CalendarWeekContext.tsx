"use client";

import { createContext, useContext } from "react";
import type { CalendarWeekData } from "./types";

const CalendarWeekContext = createContext<CalendarWeekData | null>(null);

export function CalendarWeekProvider({
  value,
  children,
}: {
  value: CalendarWeekData;
  children: React.ReactNode;
}) {
  return (
    <CalendarWeekContext.Provider value={value}>
      {children}
    </CalendarWeekContext.Provider>
  );
}

export function useCalendarWeek(): CalendarWeekData {
  const ctx = useContext(CalendarWeekContext);
  if (!ctx) {
    throw new Error("useCalendarWeek must be used within a CalendarWeekProvider");
  }
  return ctx;
}
