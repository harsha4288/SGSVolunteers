"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X, Minus, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";
import type { Assignment, TimeSlot } from "./assignments-dashboard";
import { getTaskIconConfig } from "@/lib/task-icons";
import { useTheme } from "next-themes";
import { SevaCategoryIcon } from "@/components/shared/seva-category-icon";
import {
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  DataTableColGroup,
  DataTableCol,
  DataTableBadge, // Import the new DataTableBadge
} from "@/components/ui/data-table";

import { parseISO } from "date-fns";
import { useDateOverride } from "@/components/providers/date-override-provider";
import { useAssignments } from "../hooks/use-assignments"; // Import the new hook

interface AssignmentsTableProps {
  timeSlots: TimeSlot[];
  userRole: "admin" | "team_lead" | "volunteer";
  profileId: string;
  supabase: SupabaseClient<Database>;
  selectedEvent: string;
  selectedSevaId?: number | null; // New prop for filtering by Seva/task
  selectedTimeSlotId?: number | null; // New prop for filtering by TimeSlot
}

export function AssignmentsTable({
  timeSlots,
  userRole,
  profileId,
  supabase,
  selectedEvent,
  selectedSevaId,
  selectedTimeSlotId,
}: AssignmentsTableProps) {
  const { toast } = useToast();
  const { theme } = useTheme();
  const [checkInLoading, setCheckInLoading] = React.useState<Record<string, boolean>>({});

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

  // Filter assignments based on selectedSevaId and selectedTimeSlotId
  // This filtering is now handled within the useAssignments hook,
  // but we keep this useMemo for consistency if additional client-side filtering is needed.
  const filteredAssignments = React.useMemo(() => {
    let currentAssignments = assignments; // Use assignments from the hook

    if (selectedSevaId) {
      currentAssignments = currentAssignments.filter(
        (a) => a.seva_category_id === selectedSevaId
      );
    }

    if (selectedTimeSlotId) {
      currentAssignments = currentAssignments.filter(
        (a) => a.time_slot_id === selectedTimeSlotId
      );
    }
    return currentAssignments;
  }, [assignments, selectedSevaId, selectedTimeSlotId]);

  // Group assignments by volunteer (for table/list)
  const volunteerAssignments = React.useMemo(() => {
    const grouped: Record<string, Assignment[]> = {};
    filteredAssignments.forEach((a) => {
      const name = `${a.volunteer.first_name} ${a.volunteer.last_name}`;
      if (!grouped[name]) grouped[name] = [];
      grouped[name].push(a);
    });
    return grouped;
  }, [filteredAssignments]);

  // Determine visible time slots based on selection
  const visibleTimeSlots = React.useMemo(() => {
    let slots = timeSlots.filter(
      (slot) =>
        !slot.slot_name.toLowerCase().includes("full") &&
        slot.slot_name.toLowerCase() !== "all days"
    );

    if (selectedTimeSlotId) {
      slots = slots.filter((slot) => slot.id === selectedTimeSlotId);
    }
    return slots;
  }, [timeSlots, selectedTimeSlotId]);

  // Attendance controls (Team Lead/Admin)
  const handleCheckInStatus = async (assignment: Assignment, status: "checked_in" | "absent") => {
    if (userRole === "volunteer") {
      toast({ title: "Permission Denied", description: "You don't have permission to change check-in status.", variant: "destructive" });
      return;
    }
    const loadingKey = `${assignment.volunteer_id}-${assignment.time_slot_id}`;
    setCheckInLoading(prev => ({ ...prev, [loadingKey]: true }));
    try {
      // Get current timestamp with timezone
      const now = new Date();

      // Then update the database
      // Check for existing check-in for this specific volunteer, event, and time slot
      const { data: existingCheckIns, error: checkError } = await supabase
        .from("volunteer_check_ins")
        .select("id")
        .eq("volunteer_id", assignment.volunteer_id)
        .eq("event_id", Number(selectedEvent))
        .eq("time_slot_id", assignment.time_slot_id);

      if (checkError) throw new Error(checkError.message);

      // Create a common payload with shared properties
      const commonPayload = {
        recorded_by_profile_id: profileId,
        updated_at: now.toISOString(),
        location: assignment.seva_category?.category_name || "",
        time_slot_id: assignment.time_slot_id // Include time slot ID for specific tracking
      };

      // Add status-specific properties
      const updatePayload = status === "checked_in"
        ? { ...commonPayload, check_in_time: now.toISOString() }
        : { ...commonPayload, check_in_time: now.toISOString(), check_out_time: now.toISOString() };

      if (existingCheckIns && existingCheckIns.length > 0) {
        // Update existing check-in
        const { error: updateError } = await supabase
          .from("volunteer_check_ins")
          .update(updatePayload)
          .eq("id", existingCheckIns[0].id);

        if (updateError) throw new Error(updateError.message);
      } else {
        // Create new check-in record
        const { error: insertError } = await supabase
          .from("volunteer_check_ins")
          .insert([{
            volunteer_id: assignment.volunteer_id,
            event_id: Number(selectedEvent),
            ...updatePayload,
            created_at: now.toISOString()
          }]);

        if (insertError) throw new Error(insertError.message);
      }

      toast({
        title: status === "checked_in" ? "Checked In" : "Marked as Absent",
        description: `${assignment.volunteer.first_name} ${assignment.volunteer.last_name} has been ${status === "checked_in" ? "checked in" : "marked as absent"}.`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update check-in status",
        variant: "destructive"
      });
    } finally {
      setCheckInLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Undo attendance (Team Lead/Admin) - revert to pending state
  const handleUndoAttendance = async (assignment: Assignment) => {
    if (userRole === "volunteer") {
      toast({ title: "Permission Denied", description: "You don't have permission to change check-in status.", variant: "destructive" });
      return;
    }
    const loadingKey = `${assignment.volunteer_id}-${assignment.time_slot_id}`;
    setCheckInLoading(prev => ({ ...prev, [loadingKey]: true }));
    try {
      // Delete the check-in record from database to revert to original state
      const { error: deleteError } = await supabase
        .from("volunteer_check_ins")
        .delete()
        .eq("volunteer_id", assignment.volunteer_id)
        .eq("event_id", Number(selectedEvent))
        .eq("time_slot_id", assignment.time_slot_id);

      if (deleteError) throw new Error(deleteError.message);

      toast({
        title: "Attendance Reverted",
        description: `${assignment.volunteer.first_name} ${assignment.volunteer.last_name}'s attendance has been reverted to pending.`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to revert attendance",
        variant: "destructive"
      });
    } finally {
      setCheckInLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Get the current date (real or overridden)
  const { getCurrentDate, overrideDate } = useDateOverride();

  // Force re-render when override date changes
  const [, forceUpdate] = React.useState({});
  React.useEffect(() => {
    // This will trigger a re-render when the override date changes
    forceUpdate({});
  }, [overrideDate]);

  // Helper function to determine time slot status (today, past, future)
  const getTimeSlotStatus = (timeSlot: Assignment["time_slot"]) => {
    try {
      const startDate = parseISO(timeSlot.start_time);
      const currentDate = getCurrentDate(); // This will use the override date if set

      // Check if the slot date is the same as our current/overridden date
      if (startDate.getFullYear() === currentDate.getFullYear() &&
        startDate.getMonth() === currentDate.getMonth() &&
        startDate.getDate() === currentDate.getDate()) {
        return "today";
      } else if (startDate < currentDate) {
        return "past";
      } else {
        return "future";
      }
    } catch (error) {
      console.error("Error parsing date:", error);
      return "unknown";
    }
  };

  // Render assignment cell (role-based)
  const renderAssignmentCell = (assignment: Assignment, slotId: number) => {
    // If no assignment for this slot, show a minus sign
    if (!assignment || assignment.time_slot_id !== slotId) {
      return <Minus className="h-4 w-4 text-muted-foreground inline-block" aria-label="Not assigned" />;
    }

    const loadingKey = `${assignment.volunteer_id}-${assignment.time_slot_id}`;
    const isLoadingCheckIn = checkInLoading[loadingKey];
    if (isLoadingCheckIn) return <Loader2 className="h-4 w-4 animate-spin text-primary inline-block" />;

    // Get task icon configuration
    const taskName = assignment.seva_category?.category_name || "";
    const taskConfig = getTaskIconConfig(taskName);

    // Determine time slot status (today, past, future)
    const timeSlotStatus = getTimeSlotStatus(assignment.time_slot);

    // Volunteer: show task icon and status
    if (userRole === "volunteer") {
      return (
        <div className="inline-flex flex-col items-center gap-1"> {/* Removed py-1, cell padding will handle */}
          <div className="flex items-center gap-1" title={taskName}>
            <SevaCategoryIcon categoryName={taskName} className="min-w-0" />
          </div>

          {/* Show check-in status for past or today's slots */}
          {(timeSlotStatus === "past" || timeSlotStatus === "today") && assignment.check_in_status === "checked_in" ? (
            <DataTableBadge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-transparent">
              <Check className="h-3.5 w-3.5" aria-label="Present" />
            </DataTableBadge>
          ) : (timeSlotStatus === "past" || timeSlotStatus === "today") && assignment.check_in_status === "absent" ? (
            <DataTableBadge variant="outline" className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-transparent">
              <X className="h-3.5 w-3.5" aria-label="Absent" />
            </DataTableBadge>
          ) : timeSlotStatus === "past" ? (
            <DataTableBadge variant="outline" className="bg-red-50 dark:bg-red-900/20 text-red-500 border-transparent">
              <Clock className="h-3.5 w-3.5" aria-label="Not recorded" />
            </DataTableBadge>
          ) : timeSlotStatus === "today" ? (
            <DataTableBadge variant="outline" className="bg-amber-50 dark:bg-amber-900/20 text-amber-500 border-transparent">
              <Clock className="h-3.5 w-3.5" aria-label="Pending" />
            </DataTableBadge>
          ) : (
            <DataTableBadge variant="outline" className="bg-gray-50 dark:bg-gray-800/50 text-gray-400 border-transparent">
              <Clock className="h-3.5 w-3.5" aria-label="Upcoming" />
            </DataTableBadge>
          )}
        </div>
      );
    }

    // Team Lead/Admin: show task icon and attendance controls based on time slot status
    return (
      <div className="inline-flex flex-col items-center gap-1"> {/* Removed py-1, cell padding will handle */}
        <div className="flex items-center gap-1" title={taskName}>
          <SevaCategoryIcon categoryName={taskName} className="min-w-0" />
        </div>

        {/* Show different controls based on time slot status and attendance */}
        {(timeSlotStatus === "past" || timeSlotStatus === "today") && assignment.check_in_status === "checked_in" ? (
          // If marked present - clickable green check to toggle back to pending
          <Button
            variant="ghost"
            size="icon" // Keep size="icon" for button dimensions
            className="h-6 w-6 rounded-full bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-800/50"
            aria-label="Present (click to undo)"
            onClick={() => handleUndoAttendance(assignment)}
          >
            {/* Using DataTableBadge inside button for consistent icon presentation, though button itself provides bg */}
            <DataTableBadge variant="outline" className="bg-transparent text-green-600 dark:text-green-400 border-transparent p-0">
              <Check className="h-3.5 w-3.5" />
            </DataTableBadge>
          </Button>
        ) : (timeSlotStatus === "past" || timeSlotStatus === "today") && assignment.check_in_status === "absent" ? (
          // If marked absent - clickable red X to toggle back to pending
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-full bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-800/50"
            aria-label="Absent (click to undo)"
            onClick={() => handleUndoAttendance(assignment)}
          >
            <DataTableBadge variant="outline" className="bg-transparent text-red-600 dark:text-red-400 border-transparent p-0">
              <X className="h-3.5 w-3.5" />
            </DataTableBadge>
          </Button>
        ) : timeSlotStatus === "past" || timeSlotStatus === "today" ? (
          // Past/Today time slots without recorded attendance - just show check/x buttons for Admin/TL
          <div className="flex gap-1 justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-800/50"
              aria-label="Present"
              onClick={() => handleCheckInStatus(assignment, "checked_in")}
            >
              <DataTableBadge variant="outline" className="bg-transparent text-green-600 dark:text-green-400 border-transparent p-0">
                <Check className="h-3.5 w-3.5" />
              </DataTableBadge>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-800/50"
              aria-label="Absent"
              onClick={() => handleCheckInStatus(assignment, "absent")}
            >
              <DataTableBadge variant="outline" className="bg-transparent text-red-600 dark:text-red-400 border-transparent p-0">
                <X className="h-3.5 w-3.5" />
              </DataTableBadge>
            </Button>
          </div>
        ) : (
          // Future time slots - gray clock
            <DataTableBadge variant="outline" className="bg-gray-50 dark:bg-gray-800/50 text-gray-400 border-transparent">
              <Clock className="h-3.5 w-3.5" aria-label="Upcoming" />
            </DataTableBadge>
        )}
      </div>
    );
  };

  // Helper function to shorten names for mobile view (no longer needed with DataTable)
  // const shortenName = (fullName: string, maxLength: number = 12) => {
  //   const nameParts = fullName.split(' ');
  //   if (nameParts.length < 2) return fullName;

  //   const firstName = nameParts[0];
  //   const lastInitial = nameParts[nameParts.length - 1][0] + '.';

  //   const shortened = `${firstName} ${lastInitial}`;

  //   // If still too long, truncate with ellipsis
  //   if (shortened.length > maxLength) {
  //     return firstName.substring(0, maxLength - 2) + '…';
  //   }

  //   return shortened;
  // };

  // Prepare volunteer names for display
  const volunteerNames = Object.keys(volunteerAssignments);

  return (
    <DataTable
      maxHeight="calc(100vh - 300px)"
      frozenColumns={[0]}
      columnWidths={["90px", ...visibleTimeSlots.map(() => "84px")]} // Changed from 100px
      density="compact"
    >
      <DataTableColGroup><DataTableCol />{/* Volunteer Name */}
        {visibleTimeSlots.map((slot) => (<DataTableCol key={slot.id} />))}
      </DataTableColGroup>

      <DataTableHeader>
        <DataTableRow hover={false}>{/*NO WHITESPACE*/}<DataTableHead align="left" className="px-3" colIndex={0} vAlign="middle">Volunteer</DataTableHead>{/*NO WHITESPACE*/}
          {visibleTimeSlots.map((slot, index) => (
            <DataTableHead key={slot.id} align="center" colIndex={index + 1} vAlign="middle">{slot.slot_name}</DataTableHead>
          ))}{/*NO WHITESPACE*/}
        </DataTableRow>
      </DataTableHeader>

      <DataTableBody>
        {volunteerNames.map((volunteerName) => (
          <DataTableRow key={volunteerName}>{/*NO WHITESPACE*/}<DataTableCell
              className="font-medium px-3" // Keep px-3 for wider first column cell
              colIndex={0}
              vAlign="middle"
              overflowHandling="tooltip"
              tooltipContent={volunteerName}
            ><div className="flex flex-col">
                <span className="text-sm">{volunteerName}</span>
                <span className="text-xs text-muted-foreground">{volunteerAssignments[volunteerName][0]?.volunteer.email}</span>
              </div></DataTableCell>{/*NO WHITESPACE*/}
            {visibleTimeSlots.map((slot, index) => {
              const assignment = volunteerAssignments[volunteerName].find(
                (a) => a.time_slot_id === slot.id
              );
              return (
                <DataTableCell
                  key={slot.id}
                  align="center"
                  colIndex={index + 1}
                  vAlign="middle"
                >{assignment ? renderAssignmentCell(assignment, slot.id) : <Minus className="h-5 w-5 text-muted-foreground inline-block" />}</DataTableCell>
              );
            })}{/*NO WHITESPACE*/}
          </DataTableRow>
        ))}
      </DataTableBody>
    </DataTable>
  );
}
