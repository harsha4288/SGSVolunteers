"use client";

import * as React from "react";
import { AssignmentsTable } from "./assignments-table";
import { AssignmentsFilters } from "./assignments-filters";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";
import { DateOverrideControl } from "@/components/date-override-control";
import { useAssignments } from "../hooks/use-assignments"; // Import the new hook

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
  phone?: string | null;
}

export interface Assignment {
  id: number;
  volunteer_id: string;
  time_slot_id: number;
  seva_category_id: number | null;
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
  } | null;
  check_in_status?: "checked_in" | "absent" | null;
}

export interface AssignmentsDashboardProps {
  profileId: string;
  userRole: "admin" | "team_lead" | "volunteer";
  supabase: SupabaseClient<Database>;
  selectedSevaId: number | null;
  setSelectedSevaId: React.Dispatch<React.SetStateAction<number | null>>;
  selectedTimeSlotId: number | null;
  setSelectedTimeSlotId: React.Dispatch<React.SetStateAction<number | null>>;
}

export function AssignmentsDashboard({
  profileId,
  userRole,
  supabase,
  selectedSevaId,
  setSelectedSevaId,
  selectedTimeSlotId,
  setSelectedTimeSlotId,
}: AssignmentsDashboardProps) {
  // State for filters
  const [selectedEvent, setSelectedEvent] = React.useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] = React.useState<string>("all"); // Keep for dropdown value
  const [selectedTask, setSelectedTask] = React.useState<string>("all"); // Keep for dropdown value
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // State for data
  const [timeSlots, setTimeSlots] = React.useState<TimeSlot[]>([]);
  const [tasks, setTasks] = React.useState<Task[]>([]);

  // Use the custom hook for assignments
  const { assignments, isLoading, error } = useAssignments({
    supabase,
    selectedEvent,
    selectedSevaId,
    selectedTimeSlotId,
    userRole,
    profileId,
    timeSlots, // Pass timeSlots to the hook
  });

  // Listen for event changes from the header
  React.useEffect(() => {
    const handleEventChange = (e: CustomEvent) => {
      if (e.detail && e.detail.eventId) {
        setSelectedEvent(e.detail.eventId);
        setSelectedTimeSlot("all"); // Reset time slot when event changes
        setSelectedTimeSlotId(null); // Reset time slot ID when event changes
        setSelectedSevaId(null); // Reset seva ID when event changes
      }
    };

    // Add event listener
    window.addEventListener("eventChange", handleEventChange as EventListener);

    // Check for stored event ID on mount
    const storedEventId = localStorage.getItem("selectedEventId");
    if (storedEventId) {
      setSelectedEvent(storedEventId);
    } else {
      // Default to event ID 1 if no stored event
      setSelectedEvent("1");
    }

    // Cleanup
    return () => {
      window.removeEventListener("eventChange", handleEventChange as EventListener);
    };
  }, []);

  // Fetch initial data (tasks and time slots)
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch tasks (seva categories)
        const { data: tasksData, error: tasksError } = await supabase
          .from("seva_categories")
          .select("id, category_name, description")
          .order("category_name");

        if (tasksError) throw new Error(`Error fetching tasks: ${tasksError.message}`);
        setTasks(tasksData || []);

      } catch (err: any) {
        console.error("Error fetching initial data:", err);
        // setError(err.message || "An error occurred while loading data"); // Error handled by useAssignments hook
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
          .eq("event_id", parseInt(selectedEvent, 10)) // Convert string to number
          .order("start_time");

        if (timeSlotsError) throw new Error(`Error fetching time slots: ${timeSlotsError.message}`);
        setTimeSlots(timeSlotsData || []);

      } catch (err: any) {
        console.error("Error fetching time slots:", err);
        // setError(err.message || "An error occurred while loading time slots"); // Error handled by useAssignments hook
      }
    };

    fetchTimeSlots();
  }, [supabase, selectedEvent]);

  // Handle filter changes
  const handleTimeSlotChange = (value: string) => {
    setSelectedTimeSlot(value);
    setSelectedTimeSlotId(value === "all" ? null : parseInt(value, 10));
  };

  const handleTaskChange = (value: string) => {
    setSelectedTask(value);
    setSelectedSevaId(value === "all" ? null : parseInt(value, 10));
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleSearchSubmit = (value: string) => {
    // setSubmittedSearchQuery(value); // No longer needed as search is handled by AssignmentsTable
  };

  if (isLoading && assignments.length === 0) { // Use isLoading from hook
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading assignments...</span>
      </div>
    );
  }

  if (error) { // Use error from hook
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Show a message when no assignments are found for a volunteer
  const showNoAssignmentsMessage = userRole === "volunteer" &&
                                  assignments.length === 0 &&
                                  !isLoading && // Use isLoading from hook
                                  !error && // Use error from hook
                                  selectedEvent;

  return (
    <div className="space-y-2 p-2 sm:p-4 overflow-hidden">
      <div className="flex flex-nowrap items-center gap-2 mb-2 overflow-x-auto">
        <div className="flex-1 min-w-0">
          <AssignmentsFilters
            timeSlots={timeSlots}
            tasks={tasks}
            selectedTimeSlot={selectedTimeSlot}
            selectedTask={selectedTask}
            searchQuery={searchQuery}
            onTimeSlotChange={handleTimeSlotChange}
            onTaskChange={handleTaskChange}
            onSearchChange={handleSearchChange}
            onSearchSubmit={handleSearchSubmit}
          />
        </div>
        <div className="flex-shrink-0 ml-auto">
          <DateOverrideControl />
        </div>
      </div>

      {showNoAssignmentsMessage ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Assignments Found</AlertTitle>
          <AlertDescription>
            No assignments were found for you or your family members. If you believe this is an error, please contact an administrator.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="overflow-x-auto">
          <AssignmentsTable
            // assignments={assignments} // AssignmentsTable will now fetch its own data via hook
            timeSlots={timeSlots}
            userRole={userRole}
            profileId={profileId}
            supabase={supabase}
            selectedEvent={selectedEvent}
            selectedSevaId={selectedSevaId}
            selectedTimeSlotId={selectedTimeSlotId}
          />
        </div>
      )}
    </div>
  );
}
