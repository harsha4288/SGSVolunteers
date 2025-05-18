"use client";

import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Check, X, AlertCircle, RefreshCw, Shirt } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";
import { useIsMobile } from "@/hooks/use-mobile";

interface TShirtSize {
  id: number;
  event_id: number;
  size_name: string;
  sort_order: number;
}

interface Volunteer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  requested_tshirt_quantity?: number;
  profile_id?: string;
}

interface TShirtSizeGridProps {
  supabase: SupabaseClient<Database>;
  isAdmin: boolean;
  eventId: number;
  tshirtSizes: TShirtSize[];
  volunteer: Volunteer | null;
  familyMembers: Volunteer[];
  searchResults: Volunteer[];
  profileId: string;
}

export function TShirtSizeGrid({
  supabase,
  isAdmin,
  eventId,
  tshirtSizes,
  volunteer,
  familyMembers,
  searchResults,
  profileId
}: TShirtSizeGridProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [loading, setLoading] = React.useState(false);
  const [preferences, setPreferences] = React.useState<Record<string, Record<string, boolean>>>({});
  const [allocations, setAllocations] = React.useState<Record<string, number>>({});
  const [issuances, setIssuances] = React.useState<Record<string, string[]>>({});
  const [saving, setSaving] = React.useState<Record<string, boolean>>({});

  // Determine which volunteers to display based on role
  const volunteersToDisplay = React.useMemo(() => {
    if (isAdmin) {
      // For admin, show search results if available
      return searchResults.length > 0 ? searchResults : [];
    } else {
      // For volunteer, always show the volunteer and family members if available
      const volunteers = [];
      if (volunteer) volunteers.push(volunteer);
      if (familyMembers && familyMembers.length > 0) volunteers.push(...familyMembers);
      return volunteers;
    }
  }, [isAdmin, volunteer, familyMembers, searchResults]);

  // Fetch volunteer allocations, preferences, and issuances
  React.useEffect(() => {
    if (volunteersToDisplay.length === 0) return;

    const fetchVolunteerData = async () => {
      setLoading(true);
      try {
        const volunteerIds = volunteersToDisplay.map(v => v.id);

        // Calculate allocations directly from volunteers data
        const newAllocations: Record<string, number> = {};
        volunteersToDisplay.forEach(vol => {
          // Default to 1 if requested_tshirt_quantity is not set
          newAllocations[vol.id] = vol.requested_tshirt_quantity || 1;
        });

        // Initialize issuances record for all volunteers
        const newIssuances: Record<string, string[]> = {};
        volunteerIds.forEach(id => {
          newIssuances[id] = [];
        });

        try {
          // Fetch issuances to adjust allocations
          // First check if the table exists and has the expected columns
          try {
            const { data: issuanceData, error: issuanceError } = await supabase
              .from('tshirt_issuances')
              .select('volunteer_id, size, tshirt_inventory_id')
              .in('volunteer_id', volunteerIds)
              .eq('event_id', eventId);

            if (issuanceError) {
              console.error("Error fetching issuances:", issuanceError);
              // Continue with default allocations and empty issuances
            } else if (issuanceData) {
              // Process issuances
              issuanceData.forEach(issuance => {
                if (!newIssuances[issuance.volunteer_id]) {
                  newIssuances[issuance.volunteer_id] = [];
                }
                newIssuances[issuance.volunteer_id].push(issuance.size);

                // Reduce allocation for each issued T-shirt
                if (newAllocations[issuance.volunteer_id] > 0) {
                  newAllocations[issuance.volunteer_id]--;
                }
              });
            }
          } catch (err) {
            console.error("Error with tshirt_issuances table:", err);
            // Continue with default allocations and empty issuances
          }
        } catch (error) {
          console.error("Error processing issuances:", error);
          // Continue with default allocations and empty issuances
        }

        // Set issuances regardless of whether there was an error
        setIssuances(newIssuances);
        setAllocations(newAllocations);

        // Initialize preferences for all volunteers
        const newPreferences: Record<string, Record<string, boolean>> = {};
        volunteerIds.forEach(id => {
          newPreferences[id] = {};
        });

        try {
          // Fetch preferences
          const { data: prefsData, error: prefsError } = await supabase
            .from('volunteer_tshirt_preferences')
            .select('*')
            .in('volunteer_id', volunteerIds)
            .eq('event_id', eventId);

          if (prefsError) {
            console.error("Error fetching preferences:", prefsError);
            // Continue with empty preferences
          } else if (prefsData) {
            prefsData.forEach(pref => {
              if (!newPreferences[pref.volunteer_id]) {
                newPreferences[pref.volunteer_id] = {};
              }
              newPreferences[pref.volunteer_id][pref.tshirt_size_id] = true;
            });
          }
        } catch (error) {
          console.error("Error processing preferences:", error);
          // Continue with empty preferences
        }

        // Set preferences regardless of whether there was an error
        setPreferences(newPreferences);
      } catch (error) {
        console.error("Error fetching volunteer data:", error);
        toast({
          title: "Error",
          description: "Failed to load volunteer T-shirt data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVolunteerData();
  }, [supabase, eventId, volunteersToDisplay, toast]);

  // Toggle preference for a volunteer and size
  const togglePreference = async (volunteerId: string, sizeId: string) => {
    if (allocations[volunteerId] <= 0 && !preferences[volunteerId]?.[sizeId]) {
      toast({
        title: "Allocation Limit Reached",
        description: "This volunteer has no remaining T-shirt allocation.",
        variant: "destructive",
      });
      return;
    }

    setSaving(prev => ({ ...prev, [volunteerId]: true }));

    try {
      // Update local state first for immediate feedback
      const newPreferences = { ...preferences };
      if (!newPreferences[volunteerId]) {
        newPreferences[volunteerId] = {};
      }

      // Toggle the preference
      newPreferences[volunteerId][sizeId] = !newPreferences[volunteerId][sizeId];

      // Count total preferences for this volunteer
      const totalPreferences = Object.values(newPreferences[volunteerId]).filter(Boolean).length;

      // Check if adding would exceed allocation
      if (totalPreferences > allocations[volunteerId] && newPreferences[volunteerId][sizeId]) {
        toast({
          title: "Allocation Limit Reached",
          description: "Cannot select more sizes than the allocation limit.",
          variant: "destructive",
        });
        return;
      }

      setPreferences(newPreferences);

      // Check if preference already exists
      const { data: existingPref, error: existingError } = await supabase
        .from('volunteer_tshirt_preferences')
        .select('id')
        .eq('volunteer_id', volunteerId)
        .eq('event_id', eventId)
        .eq('tshirt_size_id', sizeId)
        .single();

      if (existingError && existingError.code !== 'PGRST116') {
        throw existingError;
      }

      if (newPreferences[volunteerId][sizeId]) {
        // Add preference if it doesn't exist
        if (!existingPref) {
          const { error } = await supabase
            .from('volunteer_tshirt_preferences')
            .insert({
              volunteer_id: volunteerId,
              event_id: eventId,
              tshirt_size_id: sizeId,
              preference_order: totalPreferences,
              is_fulfilled: false
            });

          if (error) throw error;
        }
      } else {
        // Remove preference if it exists
        if (existingPref) {
          const { error } = await supabase
            .from('volunteer_tshirt_preferences')
            .delete()
            .eq('id', existingPref.id);

          if (error) throw error;
        }
      }

      toast({
        title: "Success",
        description: "T-shirt preferences updated successfully.",
      });
    } catch (error) {
      console.error("Error updating preferences:", error);
      toast({
        title: "Error",
        description: "Failed to update T-shirt preferences.",
        variant: "destructive",
      });
    } finally {
      setSaving(prev => ({ ...prev, [volunteerId]: false }));
    }
  };

  // Issue a T-shirt to a volunteer
  const issueTShirt = async (volunteerId: string, size: string) => {
    if (!isAdmin) return;

    setSaving(prev => ({ ...prev, [volunteerId]: true }));

    try {
      // Check if volunteer has remaining allocation
      if (allocations[volunteerId] <= 0) {
        throw new Error("Volunteer has no remaining T-shirt allocation");
      }

      // Find the size ID
      const sizeObj = tshirtSizes.find(s => s.size_name === size);
      if (!sizeObj) throw new Error(`Size ${size} not found`);

      // Check inventory
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('tshirt_inventory')
        .select('id, quantity')
        .eq('event_id', eventId)
        .eq('tshirt_size_id', sizeObj.id)
        .single();

      if (inventoryError) throw inventoryError;

      if (!inventoryData || inventoryData.quantity <= 0) {
        throw new Error(`No T-shirts available for size ${size}`);
      }

      // Update inventory
      const { error: updateError } = await supabase
        .from('tshirt_inventory')
        .update({
          quantity: inventoryData.quantity - 1,
          quantity_on_hand: inventoryData.quantity_on_hand - 1
        })
        .eq('id', inventoryData.id);

      if (updateError) throw updateError;

      // Record issuance
      try {
        const { error: issuanceError } = await supabase
          .from('tshirt_issuances')
          .insert({
            volunteer_id: volunteerId,
            event_id: eventId,
            tshirt_inventory_id: inventoryData.id,
            issued_by_profile_id: profileId,
            size: size,
            issued_at: new Date().toISOString()
          });

        if (issuanceError) throw issuanceError;
      } catch (err) {
        console.error("Error inserting into tshirt_issuances:", err);
        // Continue with the process, but log the error
        toast({
          title: "Warning",
          description: "T-shirt issued but record may not be complete. Please notify administrator.",
          variant: "default",
        });
      }

      // Update preference if it exists
      const { data: prefData, error: prefError } = await supabase
        .from('volunteer_tshirt_preferences')
        .select('id')
        .eq('volunteer_id', volunteerId)
        .eq('event_id', eventId)
        .eq('tshirt_size_id', sizeObj.id)
        .eq('is_fulfilled', false)
        .single();

      if (!prefError && prefData) {
        const { error: updatePrefError } = await supabase
          .from('volunteer_tshirt_preferences')
          .update({ is_fulfilled: true })
          .eq('id', prefData.id);

        if (updatePrefError) {
          console.error("Error updating preference:", updatePrefError);
          // Continue even if this fails
        }
      }

      // Update local state
      setIssuances(prev => {
        const newIssuances = { ...prev };
        if (!newIssuances[volunteerId]) {
          newIssuances[volunteerId] = [];
        }
        newIssuances[volunteerId].push(size);
        return newIssuances;
      });

      // Update allocation
      setAllocations(prev => ({
        ...prev,
        [volunteerId]: Math.max(0, (prev[volunteerId] || 0) - 1)
      }));

      toast({
        title: "Success",
        description: `T-shirt (size ${size}) issued successfully.`,
      });
    } catch (error: any) {
      console.error("Error issuing T-shirt:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to issue T-shirt.",
        variant: "destructive",
      });
    } finally {
      setSaving(prev => ({ ...prev, [volunteerId]: false }));
    }
  };

  if (volunteersToDisplay.length === 0) {
    return (
      <Alert className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Volunteers Found</AlertTitle>
        <AlertDescription>
          {isAdmin ? (
            "Use the search box above to find volunteers."
          ) : (
            <>
              No volunteer record found for you or your family members.
              <div className="mt-2">
                If you believe this is an error, please contact the event administrators.
              </div>
            </>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="mb-4 p-3 bg-accent/10 rounded-md border border-accent/20">
        <h3 className="text-lg font-medium flex items-center">
          <Shirt className="mr-2 h-5 w-5 text-accent" />
          T-Shirt Size Grid (New Layout)
        </h3>
      </div>
      <Table className="border-collapse">
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[200px] font-semibold">Volunteer</TableHead>
            <TableHead className="w-[100px] font-semibold text-center">Allocation</TableHead>
            {tshirtSizes.map(size => (
              <TableHead key={size.id} className="text-center font-semibold">
                {size.size_name}
              </TableHead>
            ))}
            {isAdmin && <TableHead className="w-[150px] font-semibold">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {volunteersToDisplay.map(vol => (
            <TableRow key={vol.id} className="hover:bg-muted/30">
              <TableCell className="font-medium border-b">
                {vol.first_name} {vol.last_name}
                {volunteer && vol.id === volunteer.id && " (You)"}
              </TableCell>
              <TableCell className="text-center border-b">
                {allocations[vol.id] !== undefined ? (
                  <span className={allocations[vol.id] > 0 ? "text-green-600 dark:text-green-400 font-medium" : "text-muted-foreground"}>
                    {issuances[vol.id]?.length || 0} / {(issuances[vol.id]?.length || 0) + allocations[vol.id]}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Loading...</span>
                )}
              </TableCell>

              {tshirtSizes.map(size => (
                <TableCell key={size.id} className="text-center border-b">
                  {/* Show issued T-shirts */}
                  {issuances[vol.id]?.includes(size.size_name) ? (
                    <div className="flex justify-center">
                      <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-1">
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                  ) : (
                    /* Show preference checkbox if allocation available */
                    <div className="flex justify-center">
                      <Button
                        variant={preferences[vol.id]?.[size.id] ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        disabled={saving[vol.id] || (allocations[vol.id] <= 0 && !preferences[vol.id]?.[size.id])}
                        onClick={() => togglePreference(vol.id, size.id)}
                        title={preferences[vol.id]?.[size.id] ? "Remove preference" : "Set as preference"}
                      >
                        {preferences[vol.id]?.[size.id] ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Shirt className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  )}
                </TableCell>
              ))}

              {isAdmin && (
                <TableCell className="border-b">
                  {allocations[vol.id] > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {/* Show issue buttons for preferred sizes */}
                      {Object.entries(preferences[vol.id] || {})
                        .filter(([_, isActive]) => isActive)
                        .map(([sizeId]) => {
                          const size = tshirtSizes.find(s => s.id.toString() === sizeId);
                          if (!size) return null;

                          return (
                            <Button
                              key={sizeId}
                              variant="outline"
                              size="sm"
                              className="bg-accent/10 hover:bg-accent/20"
                              disabled={saving[vol.id]}
                              onClick={() => issueTShirt(vol.id, size.size_name)}
                              title={`Issue size ${size.size_name} T-shirt to ${vol.first_name}`}
                            >
                              {saving[vol.id] ? (
                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <Shirt className="h-3 w-3 mr-1" />
                              )}
                              Issue {size.size_name}
                            </Button>
                          );
                        })}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">No allocation remaining</span>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );