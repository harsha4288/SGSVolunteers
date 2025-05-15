"use client";

import * as React from "react";
import { AssignmentsTable } from "./assignments-table";
import { AssignmentsFilters } from "./assignments-filters";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";

export interface Event {
  id: number;
  event_name: string;
}

export interface TimeSlot {
  id: number;
  event_id: number;
  slot_name: string;
  start_time: string;
  end_time: string;
  description: string | null;
}

export interface Task {
  id: number;
  category_name: string;
  description: string | null;
}

export interface Volunteer {
  id: string;
  profile_id: string | null;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
}

export interface Assignment {
  id: number;
  volunteer_id: string;
  time_slot_id: number;
  seva_category_id: number;
  commitment_type: string;
  task_notes: string | null;
  volunteer: {
    first_name: string;
    last_name: string;
    email: string;
  };
  time_slot: {
    slot_name: string;
    start_time: string;
    end_time: string;
  };
  seva_category: {
    category_name: string;
  };
  check_in_status?: "checked_in" | "absent" | null;
}

export interface AssignmentsDashboardProps {
  profileId: string;
  userRole: "admin" | "team_lead" | "volunteer";
  supabase: SupabaseClient<Database>;
}

export function AssignmentsDashboard({
  profileId,
  userRole,
  supabase
}: AssignmentsDashboardProps) {
  // State for filters
  const [selectedEvent, setSelectedEvent] = React.useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] = React.useState<string>("all");
  const [selectedTask, setSelectedTask] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // State for data
  const [events, setEvents] = React.useState<Event[]>([]);
  const [timeSlots, setTimeSlots] = React.useState<TimeSlot[]>([]);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [assignments, setAssignments] = React.useState<Assignment[]>([]);
  const [volunteers, setVolunteers] = React.useState<Volunteer[]>([]);

  // Loading and error states
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch initial data
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch events
        const { data: eventsData, error: eventsError } = await supabase
          .from("events")
          .select("id, event_name")
          .order("start_date", { ascending: false });

        if (eventsError) throw new Error(`Error fetching events: ${eventsError.message}`);
        setEvents(eventsData || []);

        // Set default event if available
        if (eventsData && eventsData.length > 0) {
          setSelectedEvent(eventsData[0].id.toString());
        }

        // Fetch tasks (seva categories)
        const { data: tasksData, error: tasksError } = await supabase
          .from("seva_categories")
          .select("id, category_name, description")
          .order("category_name");

        if (tasksError) throw new Error(`Error fetching tasks: ${tasksError.message}`);
        setTasks(tasksData || []);

      } catch (err: any) {
        console.error("Error fetching initial data:", err);
        setError(err.message || "An error occurred while loading data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  // Fetch time slots when event changes
  React.useEffect(() => {
    const fetchTimeSlots = async () => {
      if (!selectedEvent) return;

      try {
        const { data: timeSlotsData, error: timeSlotsError } = await supabase
          .from("time_slots")
          .select("id, event_id, slot_name, start_time, end_time, description")
          .eq("event_id", selectedEvent)
          .order("start_time");

        if (timeSlotsError) throw new Error(`Error fetching time slots: ${timeSlotsError.message}`);
        setTimeSlots(timeSlotsData || []);

      } catch (err: any) {
        console.error("Error fetching time slots:", err);
        setError(err.message || "An error occurred while loading time slots");
      }
    };

    fetchTimeSlots();
  }, [supabase, selectedEvent]);

  // Fetch assignments based on filters
  React.useEffect(() => {
    const fetchAssignments = async () => {
      if (!selectedEvent) return;

      try {
        setLoading(true);

        // Start building the query
        let query = supabase
          .from("volunteer_commitments")
          .select(`
            id,
            volunteer_id,
            time_slot_id,
            seva_category_id,
            commitment_type,
            task_notes,
            volunteer:volunteer_id (
              first_name,
              last_name,
              email
            ),
            time_slot:time_slot_id (
              slot_name,
              start_time,
              end_time
            ),
            seva_category:seva_category_id (
              category_name
            )
          `)
          .eq("commitment_type", "ASSIGNED_TASK");

        // Add time slot filter if selected
        if (selectedTimeSlot && selectedTimeSlot !== "all") {
          query = query.eq("time_slot_id", selectedTimeSlot);
        } else {
          // Otherwise, filter by event through time slots
          query = query.in(
            "time_slot_id",
            timeSlots.map(slot => slot.id)
          );
        }

        // Add task filter if selected
        if (selectedTask && selectedTask !== "all") {
          query = query.eq("seva_category_id", selectedTask);
        }

        // Execute the query
        const { data: assignmentsData, error: assignmentsError } = await query;

        if (assignmentsError) throw new Error(`Error fetching assignments: ${assignmentsError.message}`);

        // Filter by search query if provided
        let filteredAssignments = assignmentsData || [];
        if (searchQuery) {
          const lowerQuery = searchQuery.toLowerCase();
          filteredAssignments = filteredAssignments.filter(assignment =>
            assignment.volunteer.first_name.toLowerCase().includes(lowerQuery) ||
            assignment.volunteer.last_name.toLowerCase().includes(lowerQuery) ||
            assignment.volunteer.email.toLowerCase().includes(lowerQuery)
          );
        }

        setAssignments(filteredAssignments);

      } catch (err: any) {
        console.error("Error fetching assignments:", err);
        setError(err.message || "An error occurred while loading assignments");
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [supabase, selectedEvent, selectedTimeSlot, selectedTask, searchQuery, timeSlots]);

  // Handle filter changes
  const handleEventChange = (value: string) => {
    setSelectedEvent(value);
    setSelectedTimeSlot("all"); // Reset time slot when event changes
  };

  const handleTimeSlotChange = (value: string) => {
    setSelectedTimeSlot(value);
  };

  const handleTaskChange = (value: string) => {
    setSelectedTask(value);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  if (loading && assignments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading assignments...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <AssignmentsFilters
        events={events}
        timeSlots={timeSlots}
        tasks={tasks}
        selectedEvent={selectedEvent}
        selectedTimeSlot={selectedTimeSlot}
        selectedTask={selectedTask}
        searchQuery={searchQuery}
        onEventChange={handleEventChange}
        onTimeSlotChange={handleTimeSlotChange}
        onTaskChange={handleTaskChange}
        onSearchChange={handleSearchChange}
      />

      <AssignmentsTable
        assignments={assignments}
        timeSlots={timeSlots}
        userRole={userRole}
        profileId={profileId}
        supabase={supabase}
        isLoading={loading}
        selectedEvent={selectedEvent}
      />
    </div>
  );
}
