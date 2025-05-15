
'use client'; // Needs to be client component for state and interactions

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck, Users, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { VolunteerCommitment, Volunteer, TimeSlot, SevaCategory, SupabaseEvent, Database, UpdateVolunteerCommitment } from "@/lib/types/supabase";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from 'date-fns';
import type { SupabaseClient } from "@supabase/supabase-js";

// This would typically be dynamic or passed as a prop
const CURRENT_EVENT_ID = 1; // Placeholder: This should be determined dynamically

type CommitmentWithDetails = VolunteerCommitment & {
  volunteers: Pick<Volunteer, 'id' | 'first_name' | 'last_name'> | null;
  time_slots: Pick<TimeSlot, 'id' | 'slot_name' | 'description' | 'start_time' | 'end_time'> | null;
  seva_categories: Pick<SevaCategory, 'id' | 'category_name'> | null;
};

export default function CheckInPage() {
  const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(null);
  const { toast } = useToast();
  const [commitments, setCommitments] = useState<CommitmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentEvent, setCurrentEvent] = useState<SupabaseEvent | null>(null);

  const [localCheckInStatus, setLocalCheckInStatus] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const supabaseInstance = createClient();
    setSupabase(supabaseInstance);
  }, []);


  useEffect(() => {
    if (!supabase) return;
    async function fetchEventDetails() {
        const { data, error: eventError } = await supabase
            .from('events')
            .select('event_name')
            .eq('id', CURRENT_EVENT_ID)
            .single();
        if (eventError) console.error('Error fetching event details for check-in:', eventError.message);
        else setCurrentEvent(data as SupabaseEvent);
    }
    fetchEventDetails();
  }, [supabase]);


  useEffect(() => {
    if (!supabase) return;

    async function fetchAssignedVolunteers() {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('volunteer_commitments')
        .select(`
          *,
          volunteers (id, first_name, last_name),
          time_slots (id, slot_name, description, start_time, end_time),
          seva_categories (id, category_name)
        `)
        .eq('event_id', CURRENT_EVENT_ID)
        .eq('commitment_type', 'ASSIGNED_TASK')
        .order('time_slots(start_time)', { ascending: true })
        .order('volunteers(last_name)', { ascending: true });

      if (fetchError) {
        console.error("Error fetching commitments:", fetchError);
        setError(fetchError.message);
        setCommitments([]);
      } else {
        setCommitments(data as CommitmentWithDetails[] || []);
        const initialStatus: Record<number, boolean> = {};
        (data as CommitmentWithDetails[] || []).forEach(c => {
          initialStatus[c.id] = !!c.checked_in_at;
        });
        setLocalCheckInStatus(initialStatus);
      }
      setLoading(false);
    }

    fetchAssignedVolunteers();
  }, [supabase]);

  const handleCheckInToggle = async (commitmentId: number) => {
    if (!supabase) {
      toast({ title: "Error", description: "Supabase client not initialized.", variant: "destructive" });
      return;
    }
    const commitment = commitments.find(c => c.id === commitmentId);
    if (!commitment) return;

    const currentlyCheckedIn = !!localCheckInStatus[commitmentId];
    const newCheckedInState = !currentlyCheckedIn;

    setLocalCheckInStatus(prev => ({ ...prev, [commitmentId]: newCheckedInState }));

    const updatePayload: Partial<UpdateVolunteerCommitment> = {
      checked_in_at: newCheckedInState ? new Date().toISOString() : null,
    };

    const { error: updateError } = await supabase
      .from('volunteer_commitments')
      .update(updatePayload)
      .eq('id', commitmentId);

    if (updateError) {
      console.error(`Error updating check-in status for commitment ${commitmentId}:`, updateError);
      toast({
        title: "Update Failed",
        description: `Could not update check-in for ${commitment.volunteers?.first_name}. Reverting.`,
        variant: "destructive",
      });
      setLocalCheckInStatus(prev => ({ ...prev, [commitmentId]: currentlyCheckedIn }));
    } else {
      toast({
        title: "Check-in Updated",
        description: `${commitment.volunteers?.first_name} ${commitment.volunteers?.last_name} marked as ${newCheckedInState ? 'Checked In' : 'Not Checked In'}.`,
      });
      setCommitments(prevCommitments =>
        prevCommitments.map(c =>
          c.id === commitmentId ? { ...c, checked_in_at: updatePayload.checked_in_at } : c
        )
      );
    }
  };

  const formatTime = (dateTimeString: string | null | undefined) => {
    if (!dateTimeString) return 'N/A';
    try {
      return format(new Date(dateTimeString), "MMM d, h:mm a");
    } catch (e) {
      return dateTimeString;
    }
  };


  if (loading || !supabase) {
    return <div className="container mx-auto py-8 px-4 text-center">Loading check-in data...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center">
            <ClipboardCheck className="mr-2 h-6 w-6 text-accent" />
            Volunteer Check-in {currentEvent ? `for ${currentEvent.event_name}` : ''}
          </CardTitle>
          <CardDescription>
            Team leaders: Mark attendance for assigned volunteers. This system assumes Wi-Fi connectivity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 border rounded-md bg-muted/30">
            <h3 className="text-lg font-medium mb-2 flex items-center"><Users className="mr-2 h-5 w-5"/>Assigned Volunteers</h3>
            <p className="text-sm text-muted-foreground mb-1">
              This list shows volunteers with assigned tasks for the current event.
            </p>
            <p className="text-sm text-muted-foreground">
              Select the checkbox to mark a volunteer as checked-in for their specific task and time slot.
            </p>
          </div>

          <ScrollArea className="h-[500px] w-full rounded-md border p-4">
            <div className="space-y-4">
              {commitments.length > 0 ? (
                commitments.map(commitment => (
                  <div key={commitment.id} className="flex items-center justify-between p-3 rounded-md border bg-card hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-medium">{commitment.volunteers?.first_name} {commitment.volunteers?.last_name}</p>
                      <p className="text-sm text-muted-foreground">Task: {commitment.seva_categories?.category_name || "N/A"}</p>
                      <p className="text-xs text-muted-foreground">Slot: {commitment.time_slots?.description || commitment.time_slots?.slot_name}</p>
                       <p className="text-xs text-muted-foreground">
                        Time: {formatTime(commitment.time_slots?.start_time)} - {formatTime(commitment.time_slots?.end_time)}
                       </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`checkin-${commitment.id}`}
                        checked={!!localCheckInStatus[commitment.id]}
                        onCheckedChange={() => handleCheckInToggle(commitment.id)}
                        aria-label={`Mark ${commitment.volunteers?.first_name} for task ${commitment.seva_categories?.category_name} as checked in`}
                        disabled={!supabase}
                      />
                      <Label htmlFor={`checkin-${commitment.id}`} className="cursor-pointer">
                        {localCheckInStatus[commitment.id] ? "Checked In" : "Check In"}
                      </Label>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-10">No assigned volunteers found for this event, or data is loading.</p>
              )}
            </div>
          </ScrollArea>
           <p className="text-xs text-muted-foreground mt-4">
              Note: Check-in status is saved automatically when toggled.
              This data will be crucial for post-event analysis and future planning.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}

