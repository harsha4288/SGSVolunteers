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
  const dataLoadedRef = React.useRef(false);


  // Load T-shirt sizes
  React.useEffect(() => {
    const loadSizes = async () => {
      try {
        const { data: sizesData, error: sizesError } = await supabase
          .from('tshirt_inventory')
          .select('size_cd')
          .eq('event_id', eventId)
          .order('sort_order');

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
  const loadTShirtData = React.useCallback(async (volunteersToLoad = volunteers) => {
    if (volunteersToLoad.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const volunteerIds = volunteersToLoad.map(v => v.id);

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
  }, [supabase, eventId, toast]);

  // Load T-shirt data only once when component mounts
  React.useEffect(() => {
    if (!dataLoadedRef.current && volunteers.length > 0) {
      dataLoadedRef.current = true;
      loadTShirtData(volunteers);
    }
  }, [loadTShirtData]); // Removed volunteers from dependencies to prevent reloading

  const getCount = (volunteerId: string, size: string): number => {
    const data = isAdmin ? issuances : preferences;
    const count = data[volunteerId]?.[size] || 0;
    // Only log during user interactions, not during normal renders
    if (saving[volunteerId]) {
      console.log(`[DEBUG] getCount called during save: volunteerId=${volunteerId}, size=${size}, count=${count}, isAdmin=${isAdmin}`);
    }
    return count;
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

  const getPreferencesDisplay = (volunteerId: string): string => {
    const volunteerPrefs = preferences[volunteerId] || {};
    const prefEntries = Object.entries(volunteerPrefs)
      .filter(([_, count]) => count > 0)
      .map(([size, count]) => `${size}[${count}]`);
    return prefEntries.length > 0 ? prefEntries.join(' ') : '-';
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

    // Warning for admins with confirmation dialog
    if (isAdmin && !canAddMore(volunteerId)) {
      const volunteer = volunteers.find(v => v.id === volunteerId);
      const volunteerName = volunteer ? `${volunteer.first_name} ${volunteer.last_name}` : 'this volunteer';
      const allocation = volunteer?.requested_tshirt_quantity || 0;
      const currentTotal = getTotalCount(volunteerId);

      const confirmed = window.confirm(
        `⚠️ ALLOCATION LIMIT EXCEEDED\n\n` +
        `Volunteer: ${volunteerName}\n` +
        `Allocation Limit: ${allocation}\n` +
        `Current Total: ${currentTotal}\n` +
        `Attempting to add: ${size} T-shirt\n\n` +
        `This will exceed the volunteer's allocation limit.\n\n` +
        `Do you want to proceed anyway?`
      );

      if (!confirmed) {
        return; // Admin chose not to override
      }
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
    // Prevent double clicks by checking if already saving
    if (saving[volunteerId]) {
      console.log(`[DEBUG] handleRemove blocked - already saving for ${volunteerId}`);
      return;
    }

    const currentCount = getCount(volunteerId, size);
    console.log(`[DEBUG] handleRemove called: volunteerId=${volunteerId}, size=${size}, currentCount=${currentCount}`);

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
          // Ensure volunteer object exists
          if (!newState[volunteerId]) {
            newState[volunteerId] = {};
          }

          // Use the captured currentCount instead of reading from state again
          const newCount = Math.max(0, currentCount - 1);

          console.log(`[DEBUG] Issuances update: volunteerId=${volunteerId}, size=${size}, capturedCount=${currentCount}, newCount=${newCount}`);

          // If count becomes 0, remove the property to match requirement
          if (newCount === 0) {
            delete newState[volunteerId][size];
            console.log(`[DEBUG] Deleted issuance property for ${volunteerId}[${size}]`);
          } else {
            newState[volunteerId][size] = newCount;
            console.log(`[DEBUG] Updated issuance for ${volunteerId}[${size}] = ${newCount}`);
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
          // Ensure volunteer object exists
          if (!newState[volunteerId]) {
            newState[volunteerId] = {};
          }

          // Use the captured currentCount instead of reading from state again
          const newCount = Math.max(0, currentCount - 1);

          console.log(`[DEBUG] Preferences update: volunteerId=${volunteerId}, size=${size}, capturedCount=${currentCount}, newCount=${newCount}`);

          // If count becomes 0, remove the property to match requirement
          if (newCount === 0) {
            delete newState[volunteerId][size];
            console.log(`[DEBUG] Deleted preference property for ${volunteerId}[${size}]`);
          } else {
            newState[volunteerId][size] = newCount;
            console.log(`[DEBUG] Updated preference for ${volunteerId}[${size}] = ${newCount}`);
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
            {isAdmin && (
              <TableHead className="w-[120px] font-semibold text-center">Preferences</TableHead>
            )}
            <TableHead colSpan={sizes.length} className="text-center font-semibold bg-accent/10 border-b border-accent/20">
              {isAdmin ? "Issued" : "Preferences"}
            </TableHead>
          </TableRow>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[180px] font-semibold"></TableHead>
            <TableHead className="w-[60px] font-semibold text-center"></TableHead>
            {isAdmin && (
              <TableHead className="w-[120px] font-semibold text-center"></TableHead>
            )}
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

                {isAdmin && (
                  <TableCell className="text-center border-b">
                    <span className="text-xs text-muted-foreground">
                      {getPreferencesDisplay(volunteer.id)}
                    </span>
                  </TableCell>
                )}

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
