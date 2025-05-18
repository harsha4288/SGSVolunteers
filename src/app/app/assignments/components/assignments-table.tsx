"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X, Minus, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";
import type { Assignment, TimeSlot } from "./assignments-dashboard";
import { getTaskIconConfig } from "@/lib/task-icons";
import { useTheme } from "next-themes";
import { useIsMobile } from "@/hooks/use-mobile";

import { parseISO } from "date-fns";
import { useDateOverride } from "@/components/providers/date-override-provider";



interface AssignmentsTableProps {
  assignments: Assignment[];
  timeSlots: TimeSlot[];
  userRole: "admin" | "team_lead" | "volunteer";
  profileId: string;
  supabase: SupabaseClient<Database>;
  selectedEvent: string;
}

export function AssignmentsTable({
  assignments,
  timeSlots,
  userRole,
  profileId,
  supabase,
  selectedEvent,
}: AssignmentsTableProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { theme } = useTheme();
  const [checkInLoading, setCheckInLoading] = React.useState<Record<string, boolean>>({});
  const [volunteerAssignments, setVolunteerAssignments] = React.useState<Record<string, Assignment[]>>({});
  const [filteredAssignments, setFilteredAssignments] = React.useState<Assignment[]>(assignments);
  const [page, setPage] = React.useState(0);
  const PAGE_SIZE = 30;

  // Set filtered assignments directly from props
  React.useEffect(() => {
    setFilteredAssignments(assignments);
    setPage(0);
  }, [assignments]);

  // Group assignments by volunteer (for table/list)
  React.useEffect(() => {
    const grouped: Record<string, Assignment[]> = {};
    filteredAssignments.forEach(a => {
      const name = `${a.volunteer.first_name} ${a.volunteer.last_name}`;
      if (!grouped[name]) grouped[name] = [];
      grouped[name].push(a);
    });
    setVolunteerAssignments(grouped);
  }, [filteredAssignments]);

  // Only show visible slots (no "Full" or "All Days")
  const visibleTimeSlots = timeSlots.filter(
    slot =>
      !slot.slot_name.toLowerCase().includes("full") &&
      slot.slot_name.toLowerCase() !== "all days"
  );

  // For lazy loading
  const pagedVolunteerNames = Object.keys(volunteerAssignments).slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

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

      // First, update the assignment's check-in status in the local state
      // This provides immediate UI feedback
      const updatedAssignments = filteredAssignments.map(a => {
        if (a.id === assignment.id) {
          return { ...a, check_in_status: status };
        }
        return a;
      });
      setFilteredAssignments(updatedAssignments);

      // Then update the database
      const { data: existingCheckIns, error: checkError } = await supabase
        .from("volunteer_check_ins")
        .select("id")
        .eq("volunteer_id", assignment.volunteer_id)
        .eq("event_id", Number(selectedEvent));

      if (checkError) throw new Error(checkError.message);

      // Create a common payload with shared properties
      const commonPayload = {
        recorded_by_profile_id: profileId,
        updated_at: now.toISOString(),
        location: assignment.seva_category?.category_name || ""
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
      // Revert the local state change if there was an error
      toast({
        title: "Error",
        description: error.message || "Failed to update check-in status",
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
  const renderAssignmentCell = (assignment: Assignment, slotId: number, isDesktop = false) => {
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
    const TaskIcon = taskConfig.icon;

    // Use appropriate colors based on theme
    const isDark = theme === 'dark';
    const iconColor = isDark ? taskConfig.darkColor : taskConfig.color;
    const bgColor = isDark ? taskConfig.darkBgColor : taskConfig.bgColor;

    // Determine time slot status (today, past, future)
    const timeSlotStatus = getTimeSlotStatus(assignment.time_slot);

    // Volunteer: show task icon and status
    if (userRole === "volunteer") {
      return (
        <div className="inline-flex flex-col items-center gap-1 py-1">
          <div className="flex items-center gap-1" title={taskName}>
            <div
              className="rounded-full p-1"
              style={{ backgroundColor: bgColor }}
            >
              <TaskIcon className="h-3 w-3" style={{ color: iconColor }} aria-label={taskName} />
            </div>
            {isDesktop ? (
              <span className="text-xs font-semibold max-w-[100px] truncate">{taskName}</span>
            ) : (
              <span className="text-xs font-semibold">{taskConfig.label}</span>
            )}
          </div>

          {/* Only show check-in status for past or today's slots */}
          {(timeSlotStatus === "past" || timeSlotStatus === "today") && assignment.check_in_status === "checked_in" ? (
            // Checked in - green check
            <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-0.5">
              <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" aria-label="Checked in" />
            </div>
          ) : (timeSlotStatus === "past" || timeSlotStatus === "today") && assignment.check_in_status === "absent" ? (
            // Absent - red X
            <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-0.5">
              <X className="h-3.5 w-3.5 text-red-600 dark:text-red-400" aria-label="Absent" />
            </div>
          ) : timeSlotStatus === "past" ? (
            // Past slot with no attendance - red clock
            <div className="bg-red-50 dark:bg-red-900/20 rounded-full p-0.5">
              <Clock className="h-3.5 w-3.5 text-red-500" aria-label="Not recorded" />
            </div>
          ) : timeSlotStatus === "today" ? (
            // Today's slot with no attendance - orange clock
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-full p-0.5">
              <Clock className="h-3.5 w-3.5 text-amber-500" aria-label="Pending" />
            </div>
          ) : (
            // Future slot - gray clock
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-full p-0.5">
              <Clock className="h-3.5 w-3.5 text-gray-400" aria-label="Upcoming" />
            </div>
          )}
        </div>
      );
    }

    // Team Lead/Admin: show task icon and attendance controls based on time slot status
    return (
      <div className="inline-flex flex-col items-center gap-1 py-1">
        <div className="flex items-center gap-1" title={taskName}>
          <div
            className="rounded-full p-1"
            style={{ backgroundColor: bgColor }}
          >
            <TaskIcon className="h-3 w-3" style={{ color: iconColor }} aria-label={taskName} />
          </div>
          {isDesktop ? (
            <span className="text-xs font-semibold max-w-[100px] truncate">{taskName}</span>
          ) : (
            <span className="text-xs font-semibold">{taskConfig.label}</span>
          )}
        </div>

        {/* Show different controls based on time slot status and attendance */}
        {(timeSlotStatus === "past" || timeSlotStatus === "today") && assignment.check_in_status === "checked_in" ? (
          // If marked present - green check
          <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-0.5">
            <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" aria-label="Present" />
          </div>
        ) : (timeSlotStatus === "past" || timeSlotStatus === "today") && assignment.check_in_status === "absent" ? (
          // If marked absent - red X
          <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-0.5">
            <X className="h-3.5 w-3.5 text-red-600 dark:text-red-400" aria-label="Absent" />
          </div>
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
              <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-800/50"
              aria-label="Absent"
              onClick={() => handleCheckInStatus(assignment, "absent")}
            >
              <X className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
            </Button>
          </div>
        ) : (
          // Future time slots - gray clock
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-full p-0.5">
            <Clock className="h-3.5 w-3.5 text-gray-400" aria-label="Upcoming" />
          </div>
        )}
      </div>
    );
  };

  // Admin controls removed as they're redundant with cell actions

  // Helper function to shorten names for mobile view
  const shortenName = (fullName: string, maxLength: number = 12) => {
    const nameParts = fullName.split(' ');
    if (nameParts.length < 2) return fullName;

    const firstName = nameParts[0];
    const lastInitial = nameParts[nameParts.length - 1][0] + '.';

    const shortened = `${firstName} ${lastInitial}`;

    // If still too long, truncate with ellipsis
    if (shortened.length > maxLength) {
      return firstName.substring(0, maxLength - 2) + '…';
    }

    return shortened;
  };

  // Responsive rendering
  if (isMobile) {
    // Mobile: Excel-like table view with fixed header row for time slots
    return (
      <div className="w-full max-w-full px-0">
        <div className="overflow-x-auto overflow-y-visible w-full pt-2">
          <table className="w-full text-xs border-collapse border">
            {/* Header row with time slots */}
            <thead className="sticky top-0 z-40 shadow-md">
              <tr className="border-b border-t">
                <th className="py-1 px-2 text-left font-medium border-r min-w-[80px] max-w-[80px] sticky-header sticky-header-light sticky-header-dark">Volunteer</th>
                {visibleTimeSlots.map(slot => (
                  <th key={slot.id} className="py-1 px-1 text-center font-medium bg-muted/80 border-r min-w-[60px]">
                    {slot.slot_name}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {pagedVolunteerNames.map((volunteerName, index) => (
                <tr key={volunteerName} className={`${index % 2 === 0 ? "bg-background row-even" : "bg-muted/10 row-odd"} border-b`}>
                  <td
                    className="py-1 px-2 text-left border-r min-w-[80px] max-w-[80px] sticky left-0 z-30 sticky-column"
                    style={{
                      backgroundColor: theme === 'dark'
                        ? (index % 2 === 0 ? 'hsl(240, 10%, 3.9%)' : 'hsla(240, 3.7%, 15.9%, 0.1)')
                        : (index % 2 === 0 ? 'white' : 'hsla(240, 4.8%, 95.9%, 0.1)')
                    }}
                  >
                    <span className="block truncate">{shortenName(volunteerName)}</span>
                  </td>

                  {visibleTimeSlots.map(slot => {
                    const assignment = volunteerAssignments[volunteerName].find(a => a.time_slot_id === slot.id);
                    return (
                      <td key={slot.id} className="py-0.5 px-0.5 text-center border-r min-w-[60px]">
                        {assignment ? renderAssignmentCell(assignment, slot.id, false) : <Minus className="h-4 w-4 text-muted-foreground inline-block" />}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination for lazy loading */}
        {Object.keys(volunteerAssignments).length > PAGE_SIZE && (
          <div className="flex justify-center gap-2 mt-2">
            <Button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} size="sm" variant="outline">Prev</Button>
            <Button onClick={() => setPage(p => (page + 1) * PAGE_SIZE < Object.keys(volunteerAssignments).length ? p + 1 : p)} disabled={(page + 1) * PAGE_SIZE >= Object.keys(volunteerAssignments).length} size="sm" variant="outline">Next</Button>
          </div>
        )}
      </div>
    );
  }

  // Desktop: Excel-like table view, maximize width and condense filters
  return (
    <div className="w-full max-w-full">
      <div className="overflow-x-auto overflow-y-visible w-full border rounded-sm pt-2">
        <table className="w-full text-sm border-collapse border">
          {/* Fixed header row */}
          <thead className="sticky top-0 z-40 shadow-md">
            <tr className="border-b border-t">
              <th className="py-2 px-3 text-left font-medium border-r min-w-[180px] max-w-[180px] sticky-header sticky-header-light sticky-header-dark">Volunteer</th>
              {visibleTimeSlots.map(slot => (
                <th key={slot.id} className="py-2 px-2 text-center font-medium bg-muted/80 border-r min-w-[80px]">
                  {slot.slot_name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedVolunteerNames.map((volunteerName, index) => (
              <tr key={volunteerName} className={`${index % 2 === 0 ? "bg-background row-even" : "bg-muted/10 row-odd"} border-b`}>
                <td
                  className="py-1.5 px-3 text-left border-r min-w-[180px] max-w-[180px] sticky left-0 z-30 sticky-column"
                  style={{
                    backgroundColor: theme === 'dark'
                      ? (index % 2 === 0 ? 'hsl(240, 10%, 3.9%)' : 'hsla(240, 3.7%, 15.9%, 0.1)')
                      : (index % 2 === 0 ? 'white' : 'hsla(240, 4.8%, 95.9%, 0.1)')
                  }}
                >
                  <span className="block truncate">{volunteerName}</span>
                </td>

                {visibleTimeSlots.map(slot => {
                  const assignment = volunteerAssignments[volunteerName].find(a => a.time_slot_id === slot.id);
                  return (
                    <td key={slot.id} className="py-1 px-1 text-center border-r min-w-[120px]">
                      {assignment ? renderAssignmentCell(assignment, slot.id, true) : <Minus className="h-5 w-5 text-muted-foreground inline-block" />}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination for lazy loading */}
      {Object.keys(volunteerAssignments).length > PAGE_SIZE && (
        <div className="flex justify-center gap-2 mt-2">
          <Button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} variant="outline">Prev</Button>
          <Button onClick={() => setPage(p => (page + 1) * PAGE_SIZE < Object.keys(volunteerAssignments).length ? p + 1 : p)} disabled={(page + 1) * PAGE_SIZE >= Object.keys(volunteerAssignments).length} variant="outline">Next</Button>
        </div>
      )}
    </div>
  );
}
