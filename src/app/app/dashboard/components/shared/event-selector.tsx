"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export interface EventSelectorProps {
  currentEventId: number | null;
  onEventChange: (eventId: number) => void;
}

export function EventSelector({ currentEventId, onEventChange }: EventSelectorProps) {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const supabase = createClient();

        const { data, error } = await supabase
          .from("events")
          .select("id, event_name, start_date, end_date")
          .order("start_date", { ascending: false });

        if (error) {
          throw new Error(error.message);
        }

        setEvents(data || []);
      } catch (err) {
        console.error("Error fetching events:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  if (loading) {
    return <Skeleton className="h-10 w-full max-w-xs" />;
  }

  if (events.length === 0) {
    return <div className="text-sm text-muted-foreground">No events available</div>;
  }

  return (
    <Select
      value={currentEventId?.toString() || ""}
      onValueChange={(value) => onEventChange(parseInt(value))}
    >
      <SelectTrigger className="w-full max-w-xs">
        <SelectValue placeholder="Select an event" />
      </SelectTrigger>
      <SelectContent>
        {events.map((event) => (
          <SelectItem key={event.id} value={event.id.toString()}>
            {event.event_name}
            {currentEventId === event.id && " (Current)"}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
