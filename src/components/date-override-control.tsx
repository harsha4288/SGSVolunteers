"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDateOverride } from "@/components/providers/date-override-provider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function DateOverrideControl({ className }: { className?: string }) {
  const { overrideDate, setOverrideDate, isOverrideActive, isDevOverride, formattedOverrideDate } = useDateOverride();

  const handleReset = () => {
    setOverrideDate(null);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={isOverrideActive ? "destructive" : "outline"}
            size="sm"
            className="h-8 gap-1"
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            {isOverrideActive && overrideDate ? (
              <span>
                {isDevOverride ? `(Dev Override) ${formattedOverrideDate}` : `Override: ${formattedOverrideDate}`}
              </span>
            ) : (
              <span>Override Date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={overrideDate || undefined}
            onSelect={(date) => setOverrideDate(date)}
            initialFocus
          />
          {isOverrideActive && (
            <div className="p-2 border-t flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
              >
                Reset to Current Date
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
