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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Check, X, Minus, AlertCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";
import type { Assignment, TimeSlot } from "./assignments-dashboard";
import { useTheme } from "@/components/providers/theme-provider";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { isToday, isPast, parseISO } from "date-fns";

// Local debounce implementation
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timeout: ReturnType<typeof setTimeout>;
  const debounced = (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
  debounced.cancel = () => clearTimeout(timeout);
  return debounced as T & { cancel: () => void };
}

interface AssignmentsTableProps {
  assignments: Assignment[];
  timeSlots: TimeSlot[];
  userRole: "admin" | "team_lead" | "volunteer";
  profileId: string;
  supabase: SupabaseClient<Database>;
  isLoading: boolean;
  selectedEvent: string;
}

export function AssignmentsTable({
  assignments,
  timeSlots,
  userRole,
  profileId,
  supabase,
  isLoading,
  selectedEvent,
}: AssignmentsTableProps) {
  const { toast } = useToast();
  const { resolvedTheme } = useTheme();
  const isMobile = useIsMobile();
  const [checkInLoading, setCheckInLoading] = React.useState<Record<string, boolean>>({});
  const [volunteerAssignments, setVolunteerAssignments] = React.useState<Record<string, Assignment[]>>({});
  const [search, setSearch] = React.useState("");
  const [filteredAssignments, setFilteredAssignments] = React.useState<Assignment[]>(assignments);
  const [filterSlot, setFilterSlot] = React.useState<string>("");
  const [filterTask, setFilterTask] = React.useState<string>("");
  const [page, setPage] = React.useState(0);
  const PAGE_SIZE = 30;

  // Debounced search/filter
  React.useEffect(() => {
    const debounced = debounce(() => {
      let data = assignments;
      if (search) {
        data = data.filter(a => `${a.volunteer.first_name} ${a.volunteer.last_name}`.toLowerCase().includes(search.toLowerCase()));
      }
      if (filterSlot) {
        data = data.filter(a => a.time_slot.slot_name === filterSlot);
      }
      if (filterTask) {
        data = data.filter(a => a.seva_category?.category_name === filterTask);
      }
      setFilteredAssignments(data);
      setPage(0);
    }, 200);
    debounced();
    return () => debounced.cancel && debounced.cancel();
  }, [search, filterSlot, filterTask, assignments]);

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
      const { data: existingCheckIns, error: checkError } = await supabase
        .from("volunteer_check_ins")
        .select("id")
        .eq("volunteer_id", assignment.volunteer_id)
        .eq("event_id", Number(selectedEvent));
      if (checkError) throw new Error(checkError.message);
      if (existingCheckIns && existingCheckIns.length > 0) {
        const { error: updateError } = await supabase
          .from("volunteer_check_ins")
          .update({ check_in_time: status === "checked_in" ? new Date().toISOString() : "", recorded_by_profile_id: profileId })
          .eq("id", existingCheckIns[0].id);
        if (updateError) throw new Error(updateError.message);
      } else {
        const { error: insertError } = await supabase
          .from("volunteer_check_ins")
          .insert([{ volunteer_id: assignment.volunteer_id, event_id: Number(selectedEvent), recorded_by_profile_id: profileId, check_in_time: status === "checked_in" ? new Date().toISOString() : "", location: assignment.seva_category.category_name }]);
        if (insertError) throw new Error(insertError.message);
      }
      toast({ title: status === "checked_in" ? "Checked In" : "Marked as Absent", description: `${assignment.volunteer.first_name} ${assignment.volunteer.last_name} has been ${status === "checked_in" ? "checked in" : "marked as absent"}.` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update check-in status", variant: "destructive" });
    } finally {
      setCheckInLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Helper function to determine time slot status (today, past, future)
  // For demonstration purposes, we'll treat specific slots as "today"
  const getTimeSlotStatus = (timeSlot: Assignment["time_slot"]) => {
    try {
      // For demonstration purposes, check if this is one of the slots we want to show as "today"
      // This is just for UI demonstration - in production, use the actual date logic
      if (timeSlot.slot_name && ["8th PM", "9th AM"].includes(timeSlot.slot_name)) {
        return "today";
      }

      const startDate = parseISO(timeSlot.start_time);

      if (isToday(startDate)) {
        return "today";
      } else if (isPast(startDate)) {
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

    // Get task initials
    const taskInitials = assignment.seva_category?.category_name?.split(" ").map(w => w[0]).join("") || "";

    // Determine time slot status (today, past, future)
    const timeSlotStatus = getTimeSlotStatus(assignment.time_slot);

    // For any future or today slot without recorded attendance, show the clock icon
    const isPendingAttendance = (timeSlotStatus === "today" || timeSlotStatus === "future") && !assignment.check_in_status;

    // Volunteer: show task initials and status
    if (userRole === "volunteer") {
      return (
        <div className="inline-flex flex-col items-center">
          <Badge variant="outline" className="text-xs font-bold uppercase px-1 py-0">{taskInitials}</Badge>
          {assignment.check_in_status === "checked_in" ? (
            <Check className="h-3 w-3 text-green-500 mt-0.5" aria-label="Checked in" />
          ) : assignment.check_in_status === "absent" ? (
            <X className="h-3 w-3 text-red-500 mt-0.5" aria-label="Absent" />
          ) : isPendingAttendance ? (
            <Clock className="h-4 w-4 text-amber-500 mt-0.5" aria-label="Pending" />
          ) : (
            // For future slots and past slots without attendance, don't show any status indicator
            null
          )}
        </div>
      );
    }

    // Team Lead/Admin: show task initials and attendance controls based on time slot status
    return (
      <div className="inline-flex flex-col items-center">
        <Badge variant="outline" className="text-xs font-bold uppercase px-1 py-0">{taskInitials}</Badge>

        {/* Show different controls based on time slot status */}
        {assignment.check_in_status === "checked_in" ? (
          // If marked present
          <Check className="h-4 w-4 text-green-500 mt-0.5" aria-label="Present" />
        ) : assignment.check_in_status === "absent" ? (
          // If marked absent
          <X className="h-4 w-4 text-red-500 mt-0.5" aria-label="Absent" />
        ) : timeSlotStatus === "past" ? (
          // Past time slots without recorded attendance: don't show any indicator
          null
        ) : timeSlotStatus === "today" ? (
          // Current day with pending attendance: show clock icon and controls
          <div className="flex flex-col items-center gap-0.5 mt-0.5">
            <Clock className="h-4 w-4 text-amber-500" aria-label="Pending" />
            <div className="flex gap-0.5">
              <Button
                variant="outline"
                size="icon"
                className="h-5 w-5 p-0.5"
                aria-label="Present"
                onClick={() => handleCheckInStatus(assignment, "checked_in")}
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-5 w-5 p-0.5"
                aria-label="Absent"
                onClick={() => handleCheckInStatus(assignment, "absent")}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          // Future time slots with pending attendance: show clock icon
          <Clock className="h-4 w-4 text-amber-500 mt-0.5" aria-label="Pending" />
        )}
      </div>
    );
  };

  // Admin: add task assignment controls (placeholder for now)
  const renderAdminControls = (_assignment: Assignment) => userRole === "admin" ? (
    <Button variant="ghost" size="icon" className="h-6 w-6 p-0" aria-label="Edit Assignment">
      <span className="text-xs">✏️</span>
    </Button>
  ) : null;

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
        <div className="flex flex-wrap gap-1 mb-3 items-center justify-between bg-background rounded-sm p-2 sticky top-0 z-40 w-full border-b shadow-sm">
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 min-w-[80px] max-w-[120px] h-8 text-xs" aria-label="Search" />
          <select value={filterSlot} onChange={e => setFilterSlot(e.target.value)} aria-label="Filter by time slot" className="rounded-sm border px-1 py-0.5 text-xs h-8">
            <option value="">All Times</option>
            {visibleTimeSlots.map(slot => <option key={slot.id} value={slot.slot_name}>{slot.slot_name}</option>)}
          </select>
          <select value={filterTask} onChange={e => setFilterTask(e.target.value)} aria-label="Filter by task" className="rounded-sm border px-1 py-0.5 text-xs h-8">
            <option value="">All Tasks</option>
            {[...new Set(assignments.map(a => a.seva_category?.category_name).filter(Boolean))].map(name => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto w-full pt-2">
          <table className="w-full text-xs border-collapse border">
            {/* Header row with time slots */}
            <thead className="sticky top-0 z-30 shadow-md">
              <tr className="border-b border-t">
                <th className="py-1 px-2 text-left font-medium bg-muted/80 border-r min-w-[80px] max-w-[80px] sticky left-0 z-20">Volunteer</th>
                {visibleTimeSlots.map(slot => (
                  <th key={slot.id} className="py-1 px-1 text-center font-medium bg-muted/80 border-r min-w-[60px]">
                    {slot.slot_name}
                  </th>
                ))}
                {userRole === "admin" && <th className="py-1 px-1 text-center font-medium bg-muted/80 min-w-[50px] border-r">Actions</th>}
              </tr>
            </thead>

            <tbody>
              {pagedVolunteerNames.map((volunteerName, index) => (
                <tr key={volunteerName} className={`${index % 2 === 0 ? "bg-background" : "bg-muted/10"} border-b`}>
                  <td className="py-1 px-2 text-left border-r min-w-[80px] max-w-[80px] sticky left-0 z-10 bg-inherit">
                    <span className="block truncate font-medium">{shortenName(volunteerName)}</span>
                  </td>

                  {visibleTimeSlots.map(slot => {
                    const assignment = volunteerAssignments[volunteerName].find(a => a.time_slot_id === slot.id);
                    return (
                      <td key={slot.id} className="py-0.5 px-0.5 text-center border-r min-w-[60px]">
                        {assignment ? renderAssignmentCell(assignment, slot.id) : <Minus className="h-4 w-4 text-muted-foreground inline-block" />}
                      </td>
                    );
                  })}

                  {userRole === "admin" && (
                    <td className="py-0.5 px-0.5 text-center min-w-[50px] border-r">
                      {volunteerAssignments[volunteerName][0] && renderAdminControls(volunteerAssignments[volunteerName][0])}
                    </td>
                  )}
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
      <div className="flex flex-wrap gap-2 mb-3 items-center justify-between bg-background rounded-sm p-2 sticky top-0 z-40 w-full border-b shadow-sm">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Assignments</h2>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <Input placeholder="Search volunteers..." value={search} onChange={e => setSearch(e.target.value)} className="w-48 h-9" aria-label="Search" />
          <select value={filterSlot} onChange={e => setFilterSlot(e.target.value)} aria-label="Filter by time slot" className="rounded-md border px-2 py-1 h-9">
            <option value="">All Times</option>
            {visibleTimeSlots.map(slot => <option key={slot.id} value={slot.slot_name}>{slot.slot_name}</option>)}
          </select>
          <select value={filterTask} onChange={e => setFilterTask(e.target.value)} aria-label="Filter by task" className="rounded-md border px-2 py-1 h-9">
            <option value="">All Tasks</option>
            {[...new Set(assignments.map(a => a.seva_category?.category_name).filter(Boolean))].map(name => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto w-full border rounded-sm pt-2">
        <table className="w-full text-sm border-collapse border">
          {/* Fixed header row */}
          <thead className="sticky top-0 z-30 shadow-md">
            <tr className="border-b border-t">
              <th className="py-2 px-3 text-left font-medium bg-muted/80 border-r min-w-[180px] max-w-[180px] sticky left-0 z-20">Volunteer</th>
              {visibleTimeSlots.map(slot => (
                <th key={slot.id} className="py-2 px-2 text-center font-medium bg-muted/80 border-r min-w-[80px]">
                  {slot.slot_name}
                </th>
              ))}
              {userRole === "admin" && <th className="py-2 px-2 text-center font-medium bg-muted/80 min-w-[60px] border-r">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {pagedVolunteerNames.map((volunteerName, index) => (
              <tr key={volunteerName} className={`${index % 2 === 0 ? "bg-background" : "bg-muted/10"} border-b`}>
                <td className="py-1.5 px-3 text-left border-r min-w-[180px] max-w-[180px] sticky left-0 z-10 bg-inherit">
                  <span className="block truncate font-medium">{volunteerName}</span>
                </td>

                {visibleTimeSlots.map(slot => {
                  const assignment = volunteerAssignments[volunteerName].find(a => a.time_slot_id === slot.id);
                  return (
                    <td key={slot.id} className="py-1 px-1 text-center border-r min-w-[80px]">
                      {assignment ? renderAssignmentCell(assignment, slot.id) : <Minus className="h-5 w-5 text-muted-foreground inline-block" />}
                    </td>
                  );
                })}

                {userRole === "admin" && (
                  <td className="py-1 px-1 text-center min-w-[60px] border-r">
                    {volunteerAssignments[volunteerName][0] && renderAdminControls(volunteerAssignments[volunteerName][0])}
                  </td>
                )}
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
