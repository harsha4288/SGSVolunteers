"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";

export interface Event {
  id: number;
  event_name: string;
}

interface EventSelectorProps {
  className?: string;
}

export function EventSelector({ className }: EventSelectorProps) {
  const [events, setEvents] = React.useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);
  const [supabase, setSupabase] = React.useState<SupabaseClient<Database> | null>(null);

  // Initialize Supabase client
  React.useEffect(() => {
    const client = createClient();
    setSupabase(client);
  }, []);

  // Fetch events
  React.useEffect(() => {
    const fetchEvents = async () => {
      if (!supabase) return;

      try {
        setLoading(true);
        const { data: eventsData, error: eventsError } = await supabase
          .from("events")
          .select("id, event_name")
          .order("start_date", { ascending: false });

        if (eventsError) throw new Error(`Error fetching events: ${eventsError.message}`);
        
        setEvents(eventsData || []);

        // Set default event if available
        if (eventsData && eventsData.length > 0) {
          // Check if there's a stored event preference
          const storedEventId = localStorage.getItem("selectedEventId");
          
          if (storedEventId && eventsData.some(e => e.id.toString() === storedEventId)) {
            setSelectedEvent(storedEventId);
          } else {
            // Otherwise use the first (most recent) event
            setSelectedEvent(eventsData[0].id.toString());
            localStorage.setItem("selectedEventId", eventsData[0].id.toString());
          }
        }
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [supabase]);

  // Handle event change
  const handleEventChange = (value: string) => {
    setSelectedEvent(value);
    localStorage.setItem("selectedEventId", value);
    
    // Dispatch a custom event that other components can listen for
    const eventChangeEvent = new CustomEvent("eventChange", { 
      detail: { eventId: value } 
    });
    window.dispatchEvent(eventChangeEvent);
  };

  if (loading || events.length === 0) {
    return null; // Don't render anything while loading or if no events
  }

  return (
    <Select value={selectedEvent} onValueChange={handleEventChange}>
      <SelectTrigger id="event-selector" className={`w-[200px] ${className}`}>
        <SelectValue placeholder="Select event" />
      </SelectTrigger>
      <SelectContent>
        {events.map((event) => (
          <SelectItem key={event.id} value={event.id.toString()}>
            {event.event_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
