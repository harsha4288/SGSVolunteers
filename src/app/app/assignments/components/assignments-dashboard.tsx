"use client";

import * as React from "react";
import { AssignmentsTable } from "./assignments-table";
import { AssignmentsFilters } from "./assignments-filters";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";
import { DateOverrideControl } from "@/components/date-override-control";

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
  const [timeSlots, setTimeSlots] = React.useState<TimeSlot[]>([]);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [assignments, setAssignments] = React.useState<Assignment[]>([]);
  const [familyMemberIds, setFamilyMemberIds] = React.useState<string[]>([]);

  // Loading and error states
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Listen for event changes from the header
  React.useEffect(() => {
    const handleEventChange = (e: CustomEvent) => {
      if (e.detail && e.detail.eventId) {
        setSelectedEvent(e.detail.eventId);
        setSelectedTimeSlot("all"); // Reset time slot when event changes
      }
    };

    // Add event listener
    window.addEventListener("eventChange", handleEventChange as EventListener);

    // Check for stored event ID on mount
    const storedEventId = localStorage.getItem("selectedEventId");
    if (storedEventId) {
      setSelectedEvent(storedEventId);
    }

    // Cleanup
    return () => {
      window.removeEventListener("eventChange", handleEventChange as EventListener);
    };
  }, []);

  // Fetch volunteer data for volunteer role
  React.useEffect(() => {
    const fetchVolunteerData = async () => {
      // Only fetch volunteer data if user is a volunteer
      if (userRole !== "volunteer" || !profileId) return;

      try {
        setLoading(true);

        // Get the impersonated email from localStorage
        const impersonatedEmail = localStorage.getItem("impersonatedEmail");

        if (!impersonatedEmail) {
          console.error("No impersonated email found in localStorage");
          throw new Error("No user email found. Please log in again.");
        }

        console.log("Fetching volunteers with email:", impersonatedEmail);

        // Fetch all volunteers with this email
        const { data: familyMembers, error: familyError } = await supabase
          .from("volunteers")
          .select("id, email")
          .eq("email", impersonatedEmail);

        if (familyError) {
          console.error("Error fetching family members:", familyError);
          throw new Error(`Error fetching family members: ${familyError.message}`);
        }

        if (!familyMembers || familyMembers.length === 0) {
          console.warn("No volunteers found with email:", impersonatedEmail);
          // Don't throw an error, just set empty family members
          setFamilyMemberIds([]);
        } else {
          console.log(`Found ${familyMembers.length} family members with email: ${impersonatedEmail}`);
          // Extract volunteer IDs
          const familyIds = familyMembers.map(member => member.id);
          setFamilyMemberIds(familyIds);
          console.log("Family member IDs:", familyIds);
        }
      } catch (err: any) {
        console.error("Error in volunteer data fetching:", err);
        setError(err.message || "An error occurred while loading volunteer data");
      } finally {
        setLoading(false);
      }
    };

    fetchVolunteerData();
  }, [supabase, profileId, userRole]);

  // Fetch initial data
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

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
          .eq("event_id", parseInt(selectedEvent, 10)) // Convert string to number
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
          query = query.eq("time_slot_id", parseInt(selectedTimeSlot, 10)); // Convert string to number
        } else {
          // Otherwise, filter by event through time slots
          query = query.in(
            "time_slot_id",
            timeSlots.map(slot => slot.id)
          );
        }

        // Add task filter if selected
        if (selectedTask && selectedTask !== "all") {
          query = query.eq("seva_category_id", parseInt(selectedTask, 10)); // Convert string to number
        }

        // For volunteer role, filter by family member IDs (volunteers with same email)
        if (userRole === "volunteer") {
          if (familyMemberIds.length > 0) {
            // If we have family members, filter by their IDs
            query = query.in("volunteer_id", familyMemberIds);
          } else {
            // If no family members found, we'll handle this after the query
            // Just continue with the query without additional filters
            // We'll set an empty array for assignments later
          }
        }

        // Execute the query
        const { data: assignmentsData, error: assignmentsError } = await query;

        if (assignmentsError) throw new Error(`Error fetching assignments: ${assignmentsError.message}`);

        // For volunteer role with no family members, return empty array
        let filteredAssignments = assignmentsData || [];
        if (userRole === "volunteer" && familyMemberIds.length === 0) {
          // If volunteer has no family members, show no assignments
          filteredAssignments = [];
        }
        // Filter by search query if provided
        else if (searchQuery) {
          const lowerQuery = searchQuery.toLowerCase();
          filteredAssignments = filteredAssignments.filter(assignment =>
            assignment.volunteer.first_name.toLowerCase().includes(lowerQuery) ||
            assignment.volunteer.last_name.toLowerCase().includes(lowerQuery) ||
            assignment.volunteer.email.toLowerCase().includes(lowerQuery)
          );
        }

        // Fetch check-in status for all assignments
        if (filteredAssignments.length > 0) {
          // Get all volunteer IDs
          const volunteerIds = [...new Set(filteredAssignments.map(a => a.volunteer_id))];

          // Fetch check-in records for these volunteers for the current event
          const { data: checkIns, error: checkInsError } = await supabase
            .from("volunteer_check_ins")
            .select("*")
            .eq("event_id", parseInt(selectedEvent, 10))
            .in("volunteer_id", volunteerIds);

          if (checkInsError) throw new Error(`Error fetching check-in status: ${checkInsError.message}`);

          // Create a map to store check-in status for each volunteer and time slot
          // Key format: `${volunteerId}-${timeSlotId}`
          const checkInStatusMap: Record<string, "checked_in" | "absent"> = {};

          if (checkIns && checkIns.length > 0) {
            // First, get all time slots for the event to match with check-ins
            const eventTimeSlots = timeSlots.map(slot => ({
              id: slot.id,
              date: new Date(slot.start_time).toISOString().split('T')[0] // Get just the date part
            }));

            checkIns.forEach(checkIn => {
              const checkInDate = new Date(checkIn.check_in_time).toISOString().split('T')[0];

              // Find matching time slots for this check-in date
              const matchingTimeSlots = eventTimeSlots.filter(slot =>
                slot.date === checkInDate
              );

              // For each matching time slot, set the check-in status
              matchingTimeSlots.forEach(slot => {
                const key = `${checkIn.volunteer_id}-${slot.id}`;
                // If check_out_time exists, it means the volunteer is marked as absent
                // Otherwise, if check_in_time exists, they are checked in
                checkInStatusMap[key] = checkIn.check_out_time ? "absent" : "checked_in";
              });
            });
          }

          // Update assignments with check-in status
          filteredAssignments = filteredAssignments.map(assignment => {
            const key = `${assignment.volunteer_id}-${assignment.time_slot_id}`;
            const status = checkInStatusMap[key];

            if (status) {
              return { ...assignment, check_in_status: status };
            }
            return assignment;
          });
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
  }, [supabase, selectedEvent, selectedTimeSlot, selectedTask, searchQuery, timeSlots, userRole, familyMemberIds]);

  // Handle filter changes
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

  // Show a message when no assignments are found for a volunteer
  const showNoAssignmentsMessage = userRole === "volunteer" &&
                                  assignments.length === 0 &&
                                  !loading &&
                                  !error &&
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
        <div className="overflow-hidden">
          <AssignmentsTable
            assignments={assignments}
            timeSlots={timeSlots}
            userRole={userRole}
            profileId={profileId}
            supabase={supabase}
            selectedEvent={selectedEvent}
          />
        </div>
      )}
    </div>
  );
}
