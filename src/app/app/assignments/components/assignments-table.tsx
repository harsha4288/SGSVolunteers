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
  const [checkInLoading, setCheckInLoading] = React.useState<Record<string, boolean>>({});
  const [volunteerAssignments, setVolunteerAssignments] = React.useState<Record<string, Assignment[]>>({});

  // Group assignments by volunteer
  React.useEffect(() => {
    const groupedAssignments: Record<string, Assignment[]> = {};

    assignments.forEach(assignment => {
      const volunteerName = `${assignment.volunteer.first_name} ${assignment.volunteer.last_name}`;

      if (!groupedAssignments[volunteerName]) {
        groupedAssignments[volunteerName] = [];
      }

      groupedAssignments[volunteerName].push(assignment);
    });

    setVolunteerAssignments(groupedAssignments);
  }, [assignments]);

  // Function to handle check-in/check-out
  const handleCheckInStatus = async (assignment: Assignment, status: "checked_in" | "absent") => {
    if (userRole === "volunteer") {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to change check-in status.",
        variant: "destructive",
      });
      return;
    }

    const loadingKey = `${assignment.volunteer_id}-${assignment.time_slot_id}`;
    setCheckInLoading(prev => ({ ...prev, [loadingKey]: true }));

    try {
      // Check if there's already a check-in record
      const { data: existingCheckIns, error: checkError } = await supabase
        .from("volunteer_check_ins")
        .select("id")
        .eq("volunteer_id", assignment.volunteer_id)
        .eq("event_id", Number(selectedEvent));

      if (checkError) throw new Error(checkError.message);

      if (existingCheckIns && existingCheckIns.length > 0) {
        // Update existing check-in
        const { error: updateError } = await supabase
          .from("volunteer_check_ins")
          .update({
            check_in_time: status === "checked_in" ? new Date().toISOString() : "",
            recorded_by_profile_id: profileId,
          })
          .eq("id", existingCheckIns[0].id);

        if (updateError) throw new Error(updateError.message);
      } else {
        // Create new check-in record
        const { error: insertError } = await supabase
          .from("volunteer_check_ins")
          .insert([
            {
              volunteer_id: assignment.volunteer_id,
              event_id: Number(selectedEvent),
              recorded_by_profile_id: profileId,
              check_in_time: status === "checked_in" ? new Date().toISOString() : "",
              location: assignment.seva_category.category_name,
            },
          ]);

        if (insertError) throw new Error(insertError.message);
      }

      // Update local state
      const updatedAssignments = assignments.map(a => {
        if (a.id === assignment.id) {
          return { ...a, check_in_status: status };
        }
        return a;
      });

      // Update the assignments state
      // This would typically be handled by the parent component
      // For now, we'll just show a toast
      toast({
        title: status === "checked_in" ? "Checked In" : "Marked as Absent",
        description: `${assignment.volunteer.first_name} ${assignment.volunteer.last_name} has been ${status === "checked_in" ? "checked in" : "marked as absent"}.`,
      });

    } catch (error: any) {
      console.error("Error updating check-in status:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update check-in status",
        variant: "destructive",
      });
    } finally {
      setCheckInLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Function to render check-in status cell
  const renderCheckInStatus = (assignment: Assignment, timeSlotId: number) => {
    // Find the assignment for this volunteer and time slot
    const matchingAssignment = assignment.time_slot_id === timeSlotId ? assignment : null;

    if (!matchingAssignment) {
      return <div className="flex justify-center"><Minus className="h-5 w-5 text-muted-foreground" /></div>;
    }

    const loadingKey = `${matchingAssignment.volunteer_id}-${matchingAssignment.time_slot_id}`;
    const isLoadingCheckIn = checkInLoading[loadingKey];

    // If loading, show spinner
    if (isLoadingCheckIn) {
      return <div className="flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
    }

    // If volunteer role, just show the assignment
    if (userRole === "volunteer") {
      return (
        <div className="flex flex-col items-center">
          <div className="font-medium">{matchingAssignment.seva_category.category_name}</div>
          <div className="text-xs text-muted-foreground">{matchingAssignment.time_slot.slot_name}</div>
        </div>
      );
    }

    // For admin and team lead, show check-in controls
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="font-medium">{matchingAssignment.seva_category.category_name}</div>
        <div className="text-xs text-muted-foreground mb-1">{matchingAssignment.time_slot.slot_name}</div>
        <div className="flex gap-1">
          <Button
            variant={matchingAssignment.check_in_status === "checked_in" ? "default" : "outline"}
            size="sm"
            className="h-7 px-2"
            onClick={() => handleCheckInStatus(matchingAssignment, "checked_in")}
          >
            <Check className="h-4 w-4 mr-1" />
            Present
          </Button>
          <Button
            variant={matchingAssignment.check_in_status === "absent" ? "destructive" : "outline"}
            size="sm"
            className="h-7 px-2"
            onClick={() => handleCheckInStatus(matchingAssignment, "absent")}
          >
            <X className="h-4 w-4 mr-1" />
            Absent
          </Button>
        </div>
      </div>
    );
  };

  if (isLoading && assignments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading assignments...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (assignments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No assignments found</h3>
            <p className="text-muted-foreground mt-1">
              {selectedEvent ? "Try changing your filters or adding new assignments." : "Please select an event to view assignments."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Assignments</CardTitle>
        {isLoading && assignments.length > 0 && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Updating...
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Volunteer</TableHead>
                {timeSlots.map((slot) => (
                  <TableHead key={slot.id} className="text-center">
                    {slot.slot_name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(volunteerAssignments).map(([volunteerName, volunteerAssignmentList]) => (
                <TableRow key={volunteerName}>
                  <TableCell className="font-medium">{volunteerName}</TableCell>
                  {timeSlots.map((slot) => (
                    <TableCell key={slot.id} className="text-center">
                      {renderCheckInStatus(
                        volunteerAssignmentList.find(a => a.time_slot_id === slot.id) || volunteerAssignmentList[0],
                        slot.id
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
