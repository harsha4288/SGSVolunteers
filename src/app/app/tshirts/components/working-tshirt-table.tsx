"use client";

import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Shirt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";
import type { Volunteer } from "../types";

interface WorkingTShirtTableProps {
  supabase: SupabaseClient<Database>;
  eventId: number;
  volunteers: Volunteer[];
  isAdmin: boolean;
  currentVolunteerId?: string;
  currentProfileId?: string;
}

interface TShirtData {
  [volunteerId: string]: {
    [size: string]: number;
  };
}

export function WorkingTShirtTable({
  supabase,
  eventId,
  volunteers,
  isAdmin,
  currentVolunteerId,
  currentProfileId,
}: WorkingTShirtTableProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState<Record<string, boolean>>({});
  const [sizes, setSizes] = React.useState<string[]>([]);
  const [preferences, setPreferences] = React.useState<TShirtData>({});
  const [issuances, setIssuances] = React.useState<TShirtData>({});


  // Load T-shirt sizes
  React.useEffect(() => {
    const loadSizes = async () => {
      try {
        const { data: sizesData, error: sizesError } = await supabase
          .from('tshirt_inventory')
          .select('size_cd')
          .eq('event_id', eventId)
          .order('size_cd');

        if (sizesError) throw sizesError;
        setSizes(sizesData?.map((s: any) => s.size_cd) || []);
      } catch (error) {
        console.error("Error loading sizes:", error);
        toast({
          title: "Error",
          description: "Failed to load T-shirt sizes.",
          variant: "destructive",
        });
      }
    };

    loadSizes();
  }, [supabase, eventId, toast]);

  // Extract loadTShirtData function for reuse
  const loadTShirtData = React.useCallback(async () => {
    if (volunteers.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const volunteerIds = volunteers.map(v => v.id);

      const { data: tshirtData, error: tshirtError } = await supabase
        .from('volunteer_tshirts')
        .select('*')
        .in('volunteer_id', volunteerIds)
        .eq('event_id', eventId);

      if (tshirtError) throw tshirtError;

      // Separate preferences and issuances
      const prefs: TShirtData = {};
      const issues: TShirtData = {};

      tshirtData?.forEach((record: any) => {
        const target = record.status === 'preferred' ? prefs : issues;
        if (!target[record.volunteer_id]) {
          target[record.volunteer_id] = {};
        }
        target[record.volunteer_id][record.size] = (target[record.volunteer_id][record.size] || 0) + record.quantity;
      });
      setPreferences(prefs);
      setIssuances(issues);
    } catch (error) {
      console.error("Error loading T-shirt data:", error);
      toast({
        title: "Error",
        description: "Failed to load T-shirt data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [supabase, eventId, volunteers, toast]);

  // Load T-shirt data when volunteers change
  React.useEffect(() => {
    loadTShirtData();
  }, [loadTShirtData]);

  const getCount = (volunteerId: string, size: string): number => {
    const data = isAdmin ? issuances : preferences;
    return data[volunteerId]?.[size] || 0;
  };

  const getTotalCount = (volunteerId: string): number => {
    const data = isAdmin ? issuances : preferences;
    const volunteerData = data[volunteerId] || {};
    return Object.values(volunteerData).reduce((sum, count) => sum + count, 0);
  };

  const canAddMore = (volunteerId: string): boolean => {
    const volunteer = volunteers.find(v => v.id === volunteerId);
    const allocation = volunteer?.requested_tshirt_quantity || 0;
    const currentTotal = getTotalCount(volunteerId);
    return currentTotal < allocation;
  };



  const handleAdd = async (volunteerId: string, size: string) => {

    // Validation for volunteers (hard stop)
    if (!isAdmin && !canAddMore(volunteerId)) {
      toast({
        title: "Allocation Limit Reached",
        description: "You have no remaining T-shirt allocation.",
        variant: "destructive",
      });
      return;
    }

    // Warning for admins (but allow)
    if (isAdmin && !canAddMore(volunteerId)) {
      toast({
        title: "Allocation Exceeded",
        description: "This volunteer has exceeded their allocation limit.",
        variant: "default",
      });
    }

    setSaving(prev => ({ ...prev, [volunteerId]: true }));

    try {
      if (isAdmin && currentProfileId) {
        // Issue T-shirt
        const { error } = await (supabase as any).rpc('issue_tshirt', {
          p_volunteer_id: volunteerId,
          p_event_id: eventId,
          p_size_cd: size,
          p_quantity: 1,
          p_issued_by_profile_id: currentProfileId,
        });
        if (error) throw error;

        // Update local state immediately for smooth UI
        setIssuances(prev => ({
          ...prev,
          [volunteerId]: {
            ...prev[volunteerId],
            [size]: (prev[volunteerId]?.[size] || 0) + 1,
          },
        }));
      } else {
        // Add preference
        const { error } = await (supabase as any).rpc('add_tshirt_preference', {
          p_volunteer_id: volunteerId,
          p_event_id: eventId,
          p_size_cd: size,
          p_quantity: 1,
        });
        if (error) throw error;

        // Update local state immediately for smooth UI
        setPreferences(prev => ({
          ...prev,
          [volunteerId]: {
            ...prev[volunteerId],
            [size]: (prev[volunteerId]?.[size] || 0) + 1,
          },
        }));
      }

      toast({
        title: "Success",
        description: `T-shirt ${isAdmin ? 'issued' : 'preference added'} successfully.`,
      });
    } catch (error: any) {
      console.error("Error adding T-shirt:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add T-shirt.",
        variant: "destructive",
      });
    } finally {
      setSaving(prev => ({ ...prev, [volunteerId]: false }));
    }
  };

  const handleRemove = async (volunteerId: string, size: string) => {
    const currentCount = getCount(volunteerId, size);
    if (currentCount === 0) return;

    setSaving(prev => ({ ...prev, [volunteerId]: true }));

    try {
      if (isAdmin) {
        // Return T-shirt
        const { error } = await (supabase as any).rpc('return_tshirt', {
          p_volunteer_id: volunteerId,
          p_event_id: eventId,
          p_size_cd: size,
          p_quantity: 1,
        });
        if (error) throw error;

        // Update local state immediately for smooth UI
        setIssuances(prev => {
          const newState = { ...prev };
          if (newState[volunteerId]) {
            const newCount = (newState[volunteerId][size] || 0) - 1;
            if (newCount <= 0) {
              delete newState[volunteerId][size];
            } else {
              newState[volunteerId][size] = newCount;
            }
          }
          return newState;
        });
      } else {
        // Remove preference
        const { error } = await (supabase as any).rpc('remove_tshirt_preference', {
          p_volunteer_id: volunteerId,
          p_event_id: eventId,
          p_size_cd: size,
          p_quantity: 1,
        });
        if (error) throw error;

        // Update local state immediately for smooth UI
        setPreferences(prev => {
          const newState = { ...prev };
          if (newState[volunteerId]) {
            const newCount = (newState[volunteerId][size] || 0) - 1;
            if (newCount <= 0) {
              delete newState[volunteerId][size];
            } else {
              newState[volunteerId][size] = newCount;
            }
          }
          return newState;
        });
      }

      toast({
        title: "Success",
        description: `T-shirt ${isAdmin ? 'returned' : 'preference removed'} successfully.`,
      });
    } catch (error: any) {
      console.error("Error removing T-shirt:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove T-shirt.",
        variant: "destructive",
      });
    } finally {
      setSaving(prev => ({ ...prev, [volunteerId]: false }));
    }
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Shirt className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Loading T-shirt data...</p>
        </div>
      </div>
    );
  }



  return (
    <div className="rounded-md border">

      <Table className="border-collapse">
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[180px] font-semibold">Volunteer</TableHead>
            <TableHead className="w-[60px] font-semibold text-center">Max</TableHead>
            <TableHead colSpan={sizes.length} className="text-center font-semibold bg-accent/10 border-b border-accent/20">
              {isAdmin ? "Issued" : "Preferences"}
            </TableHead>
          </TableRow>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[180px] font-semibold"></TableHead>
            <TableHead className="w-[60px] font-semibold text-center"></TableHead>
            {sizes.map((size) => (
              <TableHead key={size} className="text-center font-semibold">
                <span className="text-sm">{size}</span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {volunteers.map((volunteer) => {
            const isSaving = saving[volunteer.id];

            return (
              <TableRow key={volunteer.id} className="hover:bg-muted/30">
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span className={volunteer.id === currentVolunteerId ? "font-bold text-primary" : ""}>
                      {volunteer.first_name} {volunteer.last_name}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      {volunteer.email}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="text-center border-b">
                  {volunteer.requested_tshirt_quantity || 0}
                </TableCell>

                {sizes.map((size) => {
                  const count = getCount(volunteer.id, size);
                  const showControls = count > 0;

                  return (
                    <TableCell key={size} className="text-center border-b p-2">
                      {showControls ? (
                        // Show +/- controls when items exist or T-shirt is activated
                        <div className="flex items-center justify-center gap-1 bg-muted/30 rounded-md px-1 py-0.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-destructive hover:text-destructive hover:bg-destructive/20 rounded-sm"
                            disabled={isSaving || count === 0}
                            onClick={() => handleRemove(volunteer.id, size)}
                            title="Remove one"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>

                          <span className="text-sm font-semibold min-w-[1.2rem] text-center px-1 text-foreground">
                            {count}
                          </span>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-primary hover:text-primary hover:bg-primary/20 rounded-sm"
                            disabled={isSaving}
                            onClick={() => handleAdd(volunteer.id, size)}
                            title="Add one"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        // Show T-shirt icon when no items and not activated
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-accent/20 text-muted-foreground hover:text-primary transition-colors"
                          disabled={isSaving}
                          onClick={() => handleAdd(volunteer.id, size)}
                          title={`Add ${size} T-shirt ${isAdmin ? 'issuance' : 'preference'}`}
                        >
                          <Shirt className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
