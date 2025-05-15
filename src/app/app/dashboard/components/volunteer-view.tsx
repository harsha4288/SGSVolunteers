"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CalendarDays, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export interface VolunteerViewProps {
  profileId: string;
  currentEventId: number | null;
}

export function VolunteerView({ profileId, currentEventId }: VolunteerViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [volunteerInfo, setVolunteerInfo] = useState<any | null>(null);
  const [eventInfo, setEventInfo] = useState<any | null>(null);

  useEffect(() => {
    async function fetchVolunteerData() {
      if (!currentEventId) {
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();

        // Fetch volunteer info
        const { data: volunteerData, error: volunteerError } = await supabase
          .from("volunteers")
          .select("*")
          .eq("profile_id", profileId)
          .single();

        if (volunteerError && volunteerError.code !== "PGRST116") {
          throw new Error(volunteerError.message);
        }

        setVolunteerInfo(volunteerData || null);

        // Fetch event info
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select("*")
          .eq("id", currentEventId)
          .single();

        if (eventError) {
          throw new Error(eventError.message);
        }

        setEventInfo(eventData);

        // If volunteer exists, fetch their tasks
        if (volunteerData) {
          const { data: tasksData, error: tasksError } = await supabase
            .from("volunteer_commitments")
            .select(`
              id,
              volunteer_id,
              time_slot_id,
              commitment_type,
              seva_category_id,
              task_notes,
              time_slot:time_slot_id (
                slot_name,
                start_time,
                end_time
              ),
              seva_category:seva_category_id (
                category_name
              )
            `)
            .eq("volunteer_id", volunteerData.id)
            .eq("commitment_type", "ASSIGNED_TASK");

          if (tasksError) {
            throw new Error(tasksError.message);
          }

          const tasks = tasksData || [];

          // Fetch check-in status for these tasks
          if (tasks.length > 0) {
            const { data: checkIns, error: checkInsError } = await supabase
              .from("volunteer_check_ins")
              .select("*")
              .eq("volunteer_id", volunteerData.id)
              .eq("event_id", currentEventId)
              .not("check_in_time", "is", null);

            if (checkInsError) {
              throw new Error(checkInsError.message);
            }

            // If the volunteer has checked in for this event, mark all tasks as checked in
            const isCheckedIn = checkIns && checkIns.length > 0;

            // Update tasks with check-in status
            tasks.forEach(task => {
              task.is_checked_in = isCheckedIn;
            });
          }

          setTasks(tasks);
        }
      } catch (err) {
        console.error("Error fetching volunteer data:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchVolunteerData();
  }, [profileId, currentEventId]);

  if (loading) {
    return <VolunteerViewSkeleton />;
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

  if (!currentEventId) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Event Selected</AlertTitle>
        <AlertDescription>There is no current event selected or available.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Event Information */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            {eventInfo?.event_name || "Current Event"}
          </CardTitle>
          <CardDescription>
            {eventInfo?.start_date && eventInfo?.end_date ? (
              `${new Date(eventInfo.start_date).toLocaleDateString()} - ${new Date(eventInfo.end_date).toLocaleDateString()}`
            ) : "Event dates not available"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>{eventInfo?.description || "No event description available."}</p>
        </CardContent>
      </Card>

      {/* My Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            My Tasks
          </CardTitle>
          <CardDescription>
            Tasks assigned to you for this event
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tasks.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {tasks.map(task => (
                <Card key={task.id} className="shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">
                        {task.seva_category?.category_name || "Unassigned Task"}
                      </CardTitle>
                      {task.is_checked_in ? (
                        <Badge variant="default" className="bg-green-500">Checked In</Badge>
                      ) : (
                        <Badge variant="outline" className="border-amber-500 text-amber-500">
                          <Clock className="mr-1 h-3 w-3" />
                          Upcoming
                        </Badge>
                      )}
                    </div>
                    <CardDescription>
                      {task.time_slot?.slot_name || "No time slot"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <p className="text-sm mb-3">
                      {task.time_slot ? (
                        <>
                          {new Date(task.time_slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                          {new Date(task.time_slot.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </>
                      ) : "Time not specified"}
                    </p>
                    {task.task_notes && (
                      <p className="text-sm text-muted-foreground">{task.task_notes}</p>
                    )}
                    <div className="flex justify-end mt-4 gap-2">
                      <Button variant="outline" size="sm">View Details</Button>
                      <Button size="sm">Confirm</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No tasks assigned yet.</p>
              {volunteerInfo ? (
                <p className="mt-2">Check back later or contact your team leader.</p>
              ) : (
                <div className="mt-4">
                  <p className="mb-2">You are not registered as a volunteer for this event.</p>
                  <Button>Register as Volunteer</Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function VolunteerViewSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
