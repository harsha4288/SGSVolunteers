import * as React from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";
import type { Assignment, TimeSlot } from "../components/assignments-dashboard"; // Adjust path as needed
import { useToast } from "@/hooks/use-toast";

interface UseAssignmentsOptions {
  supabase: SupabaseClient<Database>;
  selectedEvent: string;
  selectedSevaId?: number | null;
  selectedTimeSlotId?: number | null;
  userRole: "admin" | "team_lead" | "volunteer";
  profileId: string | null; // Can be null for non-logged in users or volunteers without profiles
  timeSlots: TimeSlot[]; // Add timeSlots prop
}

export function useAssignments({
  supabase,
  selectedEvent,
  selectedSevaId,
  selectedTimeSlotId,
  userRole,
  profileId,
  timeSlots, // Destructure timeSlots
}: UseAssignmentsOptions) {
  const { toast } = useToast();
  const [assignments, setAssignments] = React.useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [familyMemberIds, setFamilyMemberIds] = React.useState<string[]>([]);

  // Fetch volunteer data for volunteer role (to get family member IDs)
  React.useEffect(() => {
    const fetchVolunteerData = async () => {
      if (userRole === "admin" || userRole === "team_lead") {
        setFamilyMemberIds([]);
        return;
      }

      if (userRole !== "volunteer" || !profileId) {
        setFamilyMemberIds([]); // Ensure it's empty if not a volunteer or no profile
        return;
      }

      try {
        const impersonatedEmail = localStorage.getItem("impersonatedEmail");
        if (!impersonatedEmail) {
          console.warn("No impersonated email found for volunteer role.");
          setFamilyMemberIds([]);
          return;
        }

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
          setFamilyMemberIds([]);
        } else {
          const familyIds = familyMembers.map(member => member.id);
          setFamilyMemberIds(familyIds);
        }
      } catch (err: any) {
        console.error("Error in volunteer data fetching for hook:", err);
        setError(err.message || "An error occurred while loading volunteer data for assignments.");
        setFamilyMemberIds([]); // Ensure state is reset on error
      }
    };

    fetchVolunteerData();
  }, [supabase, userRole, profileId]); // Depend on supabase, userRole, profileId

  React.useEffect(() => {
    const fetchAssignments = async () => {
      if (!selectedEvent || timeSlots.length === 0) { // Add timeSlots.length check
        setAssignments([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log("useAssignments: Fetching assignments with params:", {
          selectedEvent,
          selectedSevaId,
          selectedTimeSlotId,
          userRole,
          profileId,
          familyMemberIds,
          timeSlots: timeSlots.map(ts => ts.id), // Log time slot IDs
        });

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
          .in("time_slot_id", timeSlots.map(slot => slot.id)) // Filter by time_slot_id from provided timeSlots
          .eq("commitment_type", "ASSIGNED_TASK")
          .order("created_at", { ascending: false });

        if (selectedSevaId) {
          query = query.eq("seva_category_id", selectedSevaId);
        }
        if (selectedTimeSlotId) {
          query = query.eq("time_slot_id", selectedTimeSlotId);
        }

        // Apply volunteer-specific filtering if role is 'volunteer'
        if (userRole === "volunteer") {
          if (familyMemberIds.length > 0) {
            query = query.in("volunteer_id", familyMemberIds);
          } else {
            // If no family members found, return empty assignments immediately
            setAssignments([]);
            setIsLoading(false);
            return;
          }
        }

        const { data: assignmentsData, error: assignmentsError } = await query;

        if (assignmentsError) {
          console.error("Error fetching assignments: Supabase error object:", assignmentsError); // Log the full error object
          throw new Error(`Failed to load assignments: ${assignmentsError.message || JSON.stringify(assignmentsError)}`);
        }

        let finalAssignments: Assignment[] = assignmentsData || [];

        // Fetch check-in status for all assignments
        if (finalAssignments.length > 0) {
          const volunteerIds = [...new Set(finalAssignments.map(a => a.volunteer_id))];
          const timeSlotIdsForCheckIns = [...new Set(finalAssignments.map(a => a.time_slot_id))]; // Use time slots from assignments

          const { data: checkIns, error: checkInsError } = await supabase
            .from("volunteer_check_ins")
            .select("volunteer_id, time_slot_id, check_in_time, check_out_time")
            .eq("event_id", Number(selectedEvent))
            .in("volunteer_id", volunteerIds)
            .in("time_slot_id", timeSlotIdsForCheckIns); // Filter by relevant time slots from assignments

          if (checkInsError) {
            console.error("Error fetching check-in status: Supabase error object:", checkInsError); // Log the full error object
            toast({
              title: "Error",
              description: `Failed to load check-in statuses: ${checkInsError.message || JSON.stringify(checkInsError)}`,
              variant: "destructive",
            });
            // Continue without check-in status if there's an error
          } else {
            const checkInStatusMap: Record<string, "checked_in" | "absent"> = {};
            if (checkIns && checkIns.length > 0) {
              checkIns.forEach(checkIn => {
                if (checkIn.time_slot_id) {
                  const key = `${checkIn.volunteer_id}-${checkIn.time_slot_id}`;
                  checkInStatusMap[key] = checkIn.check_out_time ? "absent" : "checked_in";
                }
              });
            }

            finalAssignments = finalAssignments.map(assignment => {
              const key = `${assignment.volunteer_id}-${assignment.time_slot_id}`;
              const status = checkInStatusMap[key];
              return { ...assignment, check_in_status: status || "pending" };
            });
          }
        }

        setAssignments(finalAssignments);
      } catch (err: any) {
        setError(err.message || "An unknown error occurred.");
        setAssignments([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch assignments if timeSlots are available and selectedEvent is present,
    // and if familyMemberIds is populated for volunteer role, or if not a volunteer.
    if (selectedEvent && timeSlots.length > 0 && (userRole !== "volunteer" || familyMemberIds.length > 0)) {
      fetchAssignments();
    } else if (userRole === "volunteer" && familyMemberIds.length === 0) {
      // If volunteer and no family members, explicitly set empty and not loading
      setAssignments([]);
      setIsLoading(false);
    }
  }, [supabase, selectedEvent, selectedSevaId, selectedTimeSlotId, userRole, profileId, familyMemberIds, timeSlots, toast]); // Added timeSlots to dependencies

  return { assignments, isLoading, error };
}
