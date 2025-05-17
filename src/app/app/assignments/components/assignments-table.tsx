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
import { Loader2, Check, X, Minus, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";
import type { Assignment, TimeSlot } from "./assignments-dashboard";
import { useTheme } from "@/components/providers/theme-provider";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";

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

  // Render assignment cell (role-based)
  const renderAssignmentCell = (assignment: Assignment, slotId: number) => {
    if (!assignment || assignment.time_slot_id !== slotId) return <div className="flex justify-center"><Minus className="h-5 w-5 text-muted-foreground" /></div>;
    const loadingKey = `${assignment.volunteer_id}-${assignment.time_slot_id}`;
    const isLoadingCheckIn = checkInLoading[loadingKey];
    if (isLoadingCheckIn) return <div className="flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
    // Volunteer: show task initials and status
    if (userRole === "volunteer") {
      return (
        <div className="flex flex-col items-center">
          <Badge variant="outline" className="mb-1 text-xs font-bold uppercase">{assignment.seva_category?.category_name?.split(" ").map(w => w[0]).join("")}</Badge>
          <Check className="h-4 w-4 text-green-400" aria-label="Checked in" />
        </div>
      );
    }
    // Team Lead/Admin: show task initials and attendance controls
    return (
      <div className="flex flex-col items-center gap-1">
        <Badge variant="outline" className="mb-1 text-xs font-bold uppercase">{assignment.seva_category?.category_name?.split(" ").map(w => w[0]).join("")}</Badge>
        <div className="flex gap-1">
          <Button variant={assignment.check_in_status === "checked_in" ? "default" : "outline"} size="icon" aria-label="Present" onClick={() => handleCheckInStatus(assignment, "checked_in")}> <Check className="h-4 w-4" /> </Button>
          <Button variant={assignment.check_in_status === "absent" ? "destructive" : "outline"} size="icon" aria-label="Absent" onClick={() => handleCheckInStatus(assignment, "absent")}> <X className="h-4 w-4" /> </Button>
        </div>
      </div>
    );
  };

  // Admin: add task assignment controls (placeholder for now)
  const renderAdminControls = (assignment: Assignment) => userRole === "admin" ? (
    <Button variant="ghost" size="icon" aria-label="Edit Assignment"><span className="sr-only">Edit</span>✏️</Button>
  ) : null;

  // Responsive rendering
  if (isMobile) {
    // Mobile: Card/List view, maximize width and condense filters
    return (
      <div className="w-full max-w-full px-1">
        <div className="flex flex-wrap gap-2 mb-2 items-center justify-between bg-background/80 rounded-lg p-2 sticky top-0 z-10 w-full">
          <Input placeholder="Search volunteers..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 min-w-[120px] max-w-[180px]" aria-label="Search" />
          <select value={filterSlot} onChange={e => setFilterSlot(e.target.value)} aria-label="Filter by time slot" className="rounded-md border px-2 py-1">
            <option value="">All Times</option>
            {visibleTimeSlots.map(slot => <option key={slot.id} value={slot.slot_name}>{slot.slot_name}</option>)}
          </select>
          <select value={filterTask} onChange={e => setFilterTask(e.target.value)} aria-label="Filter by task" className="rounded-md border px-2 py-1">
            <option value="">All Tasks</option>
            {[...new Set(assignments.map(a => a.seva_category?.category_name).filter(Boolean))].map(name => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-3 w-full min-h-[70vh]">
          {pagedVolunteerNames.map(volunteerName => (
            <Card key={volunteerName} className="p-2 w-full max-w-full shadow-md">
              <div className="font-bold text-base mb-1 truncate">{volunteerName}</div>
              <div className="flex flex-row gap-2 overflow-x-auto w-full">
                {visibleTimeSlots.map(slot => {
                  const assignment = volunteerAssignments[volunteerName].find(a => a.time_slot_id === slot.id);
                  return (
                    <div key={slot.id} className="flex flex-col items-center min-w-[64px]">
                      <div className="text-xs font-semibold mb-1">{slot.slot_name}</div>
                      {assignment ? renderAssignmentCell(assignment, slot.id) : <Minus className="h-5 w-5 text-muted-foreground" />}
                      {userRole === "admin" && assignment && renderAdminControls(assignment)}
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
        {/* Pagination for lazy loading */}
        {Object.keys(volunteerAssignments).length > PAGE_SIZE && (
          <div className="flex justify-center gap-2 mt-2">
            <Button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Prev</Button>
            <Button onClick={() => setPage(p => (page + 1) * PAGE_SIZE < Object.keys(volunteerAssignments).length ? p + 1 : p)} disabled={(page + 1) * PAGE_SIZE >= Object.keys(volunteerAssignments).length}>Next</Button>
          </div>
        )}
      </div>
    );
  }

  // Desktop: Table view, maximize width and condense filters
  return (
    <Card className="w-full max-w-[98vw] mx-auto min-h-[80vh]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl">Assignments</CardTitle>
        <div className="flex gap-2 items-center flex-wrap">
          <Input placeholder="Search volunteers..." value={search} onChange={e => setSearch(e.target.value)} className="w-48" aria-label="Search" />
          <select value={filterSlot} onChange={e => setFilterSlot(e.target.value)} aria-label="Filter by time slot" className="rounded-md border px-2 py-1">
            <option value="">All Times</option>
            {visibleTimeSlots.map(slot => <option key={slot.id} value={slot.slot_name}>{slot.slot_name}</option>)}
          </select>
          <select value={filterTask} onChange={e => setFilterTask(e.target.value)} aria-label="Filter by task" className="rounded-md border px-2 py-1">
            <option value="">All Tasks</option>
            {[...new Set(assignments.map(a => a.seva_category?.category_name).filter(Boolean))].map(name => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>
      </CardHeader>
      <CardContent className="p-2">
        <div className="rounded-md border overflow-x-auto w-full min-h-[70vh]">
          <Table className="w-full text-sm">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Volunteer</TableHead>
                {visibleTimeSlots.map(slot => (
                  <TableHead key={slot.id} className="text-center">{slot.slot_name}</TableHead>
                ))}
                {userRole === "admin" && <TableHead className="text-center">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedVolunteerNames.map(volunteerName => (
                <TableRow key={volunteerName}>
                  <TableCell className="font-medium truncate max-w-[180px]">{volunteerName}</TableCell>
                  {visibleTimeSlots.map(slot => {
                    const assignment = volunteerAssignments[volunteerName].find(a => a.time_slot_id === slot.id);
                    return (
                      <TableCell key={slot.id} className="text-center">
                        {assignment ? renderAssignmentCell(assignment, slot.id) : <Minus className="h-5 w-5 text-muted-foreground" />}
                      </TableCell>
                    );
                  })}
                  {userRole === "admin" && <TableCell className="text-center">{volunteerAssignments[volunteerName][0] && renderAdminControls(volunteerAssignments[volunteerName][0])}</TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {/* Pagination for lazy loading */}
        {Object.keys(volunteerAssignments).length > PAGE_SIZE && (
          <div className="flex justify-center gap-2 mt-2">
            <Button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Prev</Button>
            <Button onClick={() => setPage(p => (page + 1) * PAGE_SIZE < Object.keys(volunteerAssignments).length ? p + 1 : p)} disabled={(page + 1) * PAGE_SIZE >= Object.keys(volunteerAssignments).length}>Next</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
