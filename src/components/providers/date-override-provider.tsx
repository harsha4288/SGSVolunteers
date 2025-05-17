"use client";

import * as React from "react";
import { DEV_CONFIG } from "@/lib/dev-config";
import { format } from "date-fns";

type DateOverrideContextType = {
  overrideDate: Date | null;
  setOverrideDate: (date: Date | null) => void;
  getCurrentDate: () => Date;
  isOverrideActive: boolean;
  isDevOverride: boolean;
  formattedOverrideDate: string;
};

const DateOverrideContext = React.createContext<DateOverrideContextType | undefined>(undefined);

// Parse the default date override from config
const getDefaultOverrideDate = (): Date | null => {
  if (!DEV_CONFIG.defaultDateOverride || !DEV_CONFIG.autoApplyDateOverride) {
    return null;
  }

  try {
    const date = new Date(DEV_CONFIG.defaultDateOverride);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn("Invalid default date override in dev-config.ts");
      return null;
    }
    return date;
  } catch (error) {
    console.warn("Error parsing default date override:", error);
    return null;
  }
};

export function DateOverrideProvider({ children }: { children: React.ReactNode }) {
  const [overrideDate, setOverrideDate] = React.useState<Date | null>(getDefaultOverrideDate());

  // Function to get the current date (either real or overridden)
  const getCurrentDate = React.useCallback(() => {
    // Make sure we always return a valid date object
    if (overrideDate && overrideDate instanceof Date && !isNaN(overrideDate.getTime())) {
      return overrideDate;
    }
    return new Date();
  }, [overrideDate]);

  const isOverrideActive = overrideDate !== null;
  const isDevOverride = isOverrideActive && DEV_CONFIG.autoApplyDateOverride;

  // Format the override date to show day and month only (no year)
  const formattedOverrideDate = React.useMemo(() => {
    if (!overrideDate) return "";
    return format(overrideDate, "d MMM");
  }, [overrideDate]);

  const value = React.useMemo(() => ({
    overrideDate,
    setOverrideDate,
    getCurrentDate,
    isOverrideActive,
    isDevOverride,
    formattedOverrideDate
  }), [overrideDate, getCurrentDate, isDevOverride, formattedOverrideDate]);

  return (
    <DateOverrideContext.Provider value={value}>
      {children}
    </DateOverrideContext.Provider>
  );
}

export function useDateOverride() {
  const context = React.useContext(DateOverrideContext);
  if (context === undefined) {
    throw new Error("useDateOverride must be used within a DateOverrideProvider");
  }
  return context;
}
