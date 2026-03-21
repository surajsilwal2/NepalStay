"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface CalendarContextType {
  isBS: boolean;
  toggleCalendar: () => void;
}

const CalendarContext = createContext<CalendarContextType>({
  isBS: false,
  toggleCalendar: () => {},
});

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [isBS, setIsBS] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem("ns_calendar_mode") === "BS") setIsBS(true);
    } catch {}
  }, []);

  const toggleCalendar = () => {
    setIsBS((prev) => {
      const next = !prev;
      try { localStorage.setItem("ns_calendar_mode", next ? "BS" : "AD"); } catch {}
      return next;
    });
  };

  return (
    <CalendarContext.Provider value={{ isBS, toggleCalendar }}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() {
  return useContext(CalendarContext);
}
