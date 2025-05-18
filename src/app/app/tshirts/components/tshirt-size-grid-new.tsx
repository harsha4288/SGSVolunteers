"use client";

import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Check, X, AlertCircle, RefreshCw, Shirt, Plus, Minus } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

interface TShirtSizeGridNewProps {
  supabase: SupabaseClient<Database>;
  isAdmin: boolean;
  eventId: number;
  tshirtSizes: TShirtSize[];
  volunteer: Volunteer | null;
  familyMembers: Volunteer[];
  searchResults: Volunteer[];
  profileId: string;
}

export function TShirtSizeGridNew({
  supabase,
  isAdmin,
  eventId,
  tshirtSizes,
  volunteer,
  familyMembers,
  searchResults,
  profileId
}: TShirtSizeGridNewProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [loading, setLoading] = React.useState(false);
  const [preferences, setPreferences] = React.useState<Record<string, Record<string, boolean>>>({});
  const [allocations, setAllocations] = React.useState<Record<string, number>>({});
  const [issuances, setIssuances] = React.useState<Record<string, string[]>>({});
  const [preferenceCountsBySize, setPreferenceCountsBySize] = React.useState<Record<string, Record<string, number>>>({});
  const [issuanceCountsBySize, setIssuanceCountsBySize] = React.useState<Record<string, Record<string, number>>>({});
  const [saving, setSaving] = React.useState<Record<string, boolean>>({});

  // Confirmation dialog state
  const [confirmationOpen, setConfirmationOpen] = React.useState(false);
  const [pendingIssuance, setPendingIssuance] = React.useState<{
    volunteerId: string;
    size: string;
    quantity: number;
  } | null>(null);

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
          // Use requested_tshirt_quantity from the Volunteers table
          // Default to 1 if requested_tshirt_quantity is not set
          const requestedQuantity = vol.requested_tshirt_quantity !== undefined ?
            parseInt(vol.requested_tshirt_quantity as any) : 1;

          newAllocations[vol.id] = isNaN(requestedQuantity) ? 1 : requestedQuantity;

          console.log(`Volunteer ${vol.first_name} ${vol.last_name} has requested quantity:`,
            vol.requested_tshirt_quantity, 'parsed as:', newAllocations[vol.id]);
        });

        // Initialize issuances record for all volunteers
        const newIssuances: Record<string, string[]> = {};
        volunteerIds.forEach(id => {
          newIssuances[id] = [];
        });

        try {
          // Fetch real issuances from the database
          const { data: issuanceData, error: issuanceError } = await supabase
            .from('tshirt_issuances')
            .select(`
              id,
              volunteer_id,
              size,
              tshirt_inventory_id
            `)
            .in('volunteer_id', volunteerIds);

          console.log("Fetched issuances:", issuanceData);

          if (issuanceError) {
            console.error("Error fetching issuances:", issuanceError);
            // Continue with empty issuances
          } else if (issuanceData && issuanceData.length > 0) {
            // Process issuances
            issuanceData.forEach(issuance => {
              if (!newIssuances[issuance.volunteer_id]) {
                newIssuances[issuance.volunteer_id] = [];
              }

              // Get size directly from the issuance record
              const sizeName = issuance.size;
              if (sizeName) {
                // Add to issuances array
                newIssuances[issuance.volunteer_id].push(sizeName);

                // Decrement allocation
                if (newAllocations[issuance.volunteer_id] > 0) {
                  newAllocations[issuance.volunteer_id]--;
                }
              }
            });
          }

          // Calculate issuance counts by size
          const tempIssuanceCountsBySize: Record<string, Record<string, number>> = {};
          volunteerIds.forEach(id => {
            tempIssuanceCountsBySize[id] = {};
            if (newIssuances[id]) {
              newIssuances[id].forEach(size => {
                if (!tempIssuanceCountsBySize[id][size]) {
                  tempIssuanceCountsBySize[id][size] = 0;
                }
                tempIssuanceCountsBySize[id][size]++;
              });
            }
          });

          console.log("Processed issuances:", newIssuances);
          console.log("Processed issuance counts by size:", tempIssuanceCountsBySize);

          // Set issuance counts by size
          setIssuanceCountsBySize(tempIssuanceCountsBySize);
        } catch (error) {
          console.error("Error processing issuances:", error);
          // Continue with default allocations and empty issuances
        }

        // Set issuances regardless of whether there was an error
        setIssuances(newIssuances);
        setAllocations(newAllocations);

        // Initialize preferences for all volunteers
        const newPreferences: Record<string, Record<string, boolean>> = {};
        const newPrefCountsBySize: Record<string, Record<string, number>> = {};
        volunteerIds.forEach(id => {
          newPreferences[id] = {};
          newPrefCountsBySize[id] = {};
        });

        try {
          // Fetch real preferences from the database
          const { data: prefsData, error: prefsError } = await supabase
            .from('volunteer_tshirt_preferences')
            .select(`
              id,
              volunteer_id,
              tshirt_size_id,
              tshirt_sizes (
                id,
                size_name
              )
            `)
            .in('volunteer_id', volunteerIds)
            .eq('event_id', eventId);

          console.log("Fetched preferences:", prefsData);

          if (prefsError) {
            console.error("Error fetching preferences:", prefsError);
            // Continue with empty preferences
          } else if (prefsData && prefsData.length > 0) {
            // Process preferences and count by size
            prefsData.forEach(pref => {
              if (!newPreferences[pref.volunteer_id]) {
                newPreferences[pref.volunteer_id] = {};
                newPrefCountsBySize[pref.volunteer_id] = {};
              }

              // Set preference active
              newPreferences[pref.volunteer_id][pref.tshirt_size_id.toString()] = true;

              // Get size name from the joined tshirt_sizes table
              const sizeName = pref.tshirt_sizes?.size_name;
              console.log(`Preference for volunteer ${pref.volunteer_id}, size ID ${pref.tshirt_size_id}, size name: ${sizeName}`);

              if (sizeName) {
                // Increment count for this size
                if (!newPrefCountsBySize[pref.volunteer_id][sizeName]) {
                  newPrefCountsBySize[pref.volunteer_id][sizeName] = 0;
                }
                newPrefCountsBySize[pref.volunteer_id][sizeName]++;
              }
            });

            console.log("Processed preference counts by size:", newPrefCountsBySize);
          } else {
            console.log("No preferences found for volunteers:", volunteerIds);
          }
        } catch (error) {
          console.error("Error processing preferences:", error);
          // Continue with empty preferences
        }

        // Set preferences regardless of whether there was an error
        setPreferences(newPreferences);
        setPreferenceCountsBySize(newPrefCountsBySize);

        // Calculate issuance counts by size
        const tempIssuanceCounts: Record<string, Record<string, number>> = {};
        volunteerIds.forEach(id => {
          tempIssuanceCounts[id] = {};
          if (newIssuances[id]) {
            newIssuances[id].forEach(size => {
              if (!tempIssuanceCounts[id][size]) {
                tempIssuanceCounts[id][size] = 0;
              }
              tempIssuanceCounts[id][size]++;
            });
          }
        });

        setIssuanceCountsBySize(tempIssuanceCounts);
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
    // For volunteers, enforce allocation limit as a hard stop
    if (!isAdmin && allocations[volunteerId] <= 0 && !preferences[volunteerId]?.[sizeId]) {
      toast({
        title: "Allocation Limit Reached",
        description: "You have no remaining T-shirt allocation.",
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
      const isAdding = !newPreferences[volunteerId][sizeId];
      newPreferences[volunteerId][sizeId] = isAdding;

      // Count total preferences for this volunteer
      const totalPreferences = Object.values(newPreferences[volunteerId]).filter(Boolean).length;

      // For volunteers, enforce allocation limit as a hard stop
      if (!isAdmin && totalPreferences > allocations[volunteerId] && isAdding) {
        toast({
          title: "Allocation Limit Reached",
          description: "Cannot select more sizes than your allocation limit.",
          variant: "destructive",
        });
        return;
      }

      setPreferences(newPreferences);

      // Find the size name for this size ID
      const sizeObj = displaySizes.find(s => s.id.toString() === sizeId);
      if (sizeObj) {
        console.log(`Toggle preference for volunteer ${volunteerId}, size ${sizeObj.size_name}, isAdding: ${isAdding}`);

        // Update preference counts by size
        setPreferenceCountsBySize(prev => {
          const newCounts = { ...prev };
          if (!newCounts[volunteerId]) {
            newCounts[volunteerId] = {};
          }

          if (isAdding) {
            // Adding a preference
            if (!newCounts[volunteerId][sizeObj.size_name]) {
              newCounts[volunteerId][sizeObj.size_name] = 0;
            }
            newCounts[volunteerId][sizeObj.size_name]++;
          } else {
            // Removing a preference
            if (newCounts[volunteerId][sizeObj.size_name] > 0) {
              newCounts[volunteerId][sizeObj.size_name]--;
            }
            if (newCounts[volunteerId][sizeObj.size_name] === 0) {
              delete newCounts[volunteerId][sizeObj.size_name];
            }
          }

          console.log("Updated preference counts:", newCounts);
          return newCounts;
        });
      } else {
        console.error(`Size with ID ${sizeId} not found in displaySizes:`, displaySizes);
      }

      // Different behavior based on role
      if (isAdmin) {
        // For admin role, issue or return T-shirts
        if (isAdding) {
          // Issue a T-shirt
          await issueTShirt(volunteerId, sizeObj?.size_name || '', 1);
        } else {
          // Return a T-shirt (not implemented yet)
          console.log("T-shirt return not implemented yet");
          toast({
            title: "Not Implemented",
            description: "Returning T-shirts is not implemented yet.",
            variant: "default",
          });
        }
      } else {
        // For volunteer role, update preferences in the database
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
      }
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

  // Issue T-shirts to a volunteer
  const issueTShirt = async (volunteerId: string, size: string, quantity: number = 1) => {
    if (!isAdmin) return;

    // Check if volunteer has remaining allocation
    if (allocations[volunteerId] < quantity) {
      // For admin, show confirmation dialog instead of hard error
      setPendingIssuance({ volunteerId, size, quantity });
      setConfirmationOpen(true);
      return;
    }

    // If within allocation limits, process directly
    await processIssuance(volunteerId, size, quantity);
  };

  // Return a T-shirt (decrement issuance count)
  const returnTShirt = async (volunteerId: string, size: string) => {
    if (!isAdmin) return;

    setSaving(prev => ({ ...prev, [volunteerId]: true }));

    try {
      // Check if volunteer has any T-shirts of this size
      const issuedCount = issuances[volunteerId]?.filter(s => s === size).length || 0;
      if (issuedCount <= 0) {
        throw new Error(`No ${size} T-shirts issued to this volunteer`);
      }

      // Find the size ID
      const sizeObj = tshirtSizes.find(s => s.size_name === size);
      if (!sizeObj) throw new Error(`Size ${size} not found`);

      // Check inventory
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('tshirt_inventory')
        .select('id, quantity, quantity_on_hand')
        .eq('event_id', eventId)
        .eq('tshirt_size_id', sizeObj.id)
        .single();

      if (inventoryError) throw inventoryError;

      // Update inventory (increment quantity)
      const { error: updateError } = await supabase
        .from('tshirt_inventory')
        .update({
          quantity: (inventoryData?.quantity || 0) + 1,
          quantity_on_hand: (inventoryData?.quantity_on_hand || 0) + 1
        })
        .eq('id', inventoryData.id);

      if (updateError) throw updateError;

      // Find the issuance to delete
      const { data: issuanceData, error: findError } = await supabase
        .from('tshirt_issuances')
        .select('id, tshirt_inventory_id')
        .eq('volunteer_id', volunteerId)
        .eq('size', size)
        .order('id', { ascending: false })
        .limit(1);

      if (findError) {
        console.error("Error finding issuance to delete:", findError);
        throw new Error(`Failed to find issuance to delete: ${findError.message}`);
      }

      if (!issuanceData || issuanceData.length === 0) {
        throw new Error(`No issuance found to delete for volunteer ${volunteerId}`);
      }

      // Delete the issuance
      const { error: deleteError } = await supabase
        .from('tshirt_issuances')
        .delete()
        .eq('id', issuanceData[0].id);

      if (deleteError) {
        console.error("Error deleting issuance:", deleteError);
        throw new Error(`Failed to delete issuance: ${deleteError.message}`);
      }

      console.log(`Deleted issuance from the database:`, issuanceData[0]);

      // Update local state
      setIssuances(prev => {
        const newIssuances = { ...prev };
        if (!newIssuances[volunteerId]) {
          return prev; // No issuances to remove
        }

        // Find the index of the first occurrence of this size
        const index = newIssuances[volunteerId].findIndex(s => s === size);
        if (index !== -1) {
          // Remove one occurrence
          newIssuances[volunteerId].splice(index, 1);
        }

        return newIssuances;
      });

      // Update issuance counts by size
      setIssuanceCountsBySize(prev => {
        const newCounts = { ...prev };
        if (!newCounts[volunteerId] || !newCounts[volunteerId][size]) {
          return prev; // No issuances to remove
        }

        // Decrement count
        newCounts[volunteerId][size]--;

        // Remove the size entry if count is zero
        if (newCounts[volunteerId][size] <= 0) {
          delete newCounts[volunteerId][size];
        }

        return newCounts;
      });

      // Update allocation (increment)
      setAllocations(prev => ({
        ...prev,
        [volunteerId]: (prev[volunteerId] || 0) + 1
      }));

      toast({
        title: "Success",
        description: `T-shirt (size ${size}) returned successfully.`,
      });
    } catch (error: any) {
      console.error("Error returning T-shirt:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to return T-shirt.",
        variant: "destructive",
      });
    } finally {
      setSaving(prev => ({ ...prev, [volunteerId]: false }));
    }
  };

  // Process T-shirt issuance after confirmation
  const processIssuance = async (volunteerId: string, size: string, quantity: number = 1) => {
    if (!isAdmin) return;

    setSaving(prev => ({ ...prev, [volunteerId]: true }));

    try {
      // Find the size ID
      const sizeObj = tshirtSizes.find(s => s.size_name === size);
      if (!sizeObj) throw new Error(`Size ${size} not found`);

      // Check inventory
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('tshirt_inventory')
        .select('id, quantity, quantity_on_hand')
        .eq('event_id', eventId)
        .eq('tshirt_size_id', sizeObj.id)
        .single();

      if (inventoryError) throw inventoryError;

      if (!inventoryData || inventoryData.quantity < quantity) {
        throw new Error(`Only ${inventoryData?.quantity || 0} T-shirts available for size ${size}, but tried to issue ${quantity}`);
      }

      // Update inventory
      const { error: updateError } = await supabase
        .from('tshirt_inventory')
        .update({
          quantity: inventoryData.quantity - quantity,
          quantity_on_hand: inventoryData.quantity_on_hand - quantity
        })
        .eq('id', inventoryData.id);

      if (updateError) throw updateError;

      // Record issuance in the database
      for (let i = 0; i < quantity; i++) {
        const { error: insertError } = await supabase
          .from('tshirt_issuances')
          .insert({
            volunteer_id: volunteerId,
            tshirt_inventory_id: inventoryData.id,
            issued_by_profile_id: profileId,
            size: size
          });

        if (insertError) {
          console.error("Error recording issuance:", insertError);
          throw new Error(`Failed to record issuance: ${insertError.message}`);
        }
      }

      console.log(`Recorded ${quantity} tshirt_issuances in the database`);

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

        // Add the size multiple times based on quantity
        for (let i = 0; i < quantity; i++) {
          newIssuances[volunteerId].push(size);
        }

        return newIssuances;
      });

      // Update issuance counts by size
      setIssuanceCountsBySize(prev => {
        const newCounts = { ...prev };
        if (!newCounts[volunteerId]) {
          newCounts[volunteerId] = {};
        }
        if (!newCounts[volunteerId][size]) {
          newCounts[volunteerId][size] = 0;
        }
        newCounts[volunteerId][size] += quantity;
        return newCounts;
      });

      // Update allocation
      setAllocations(prev => ({
        ...prev,
        [volunteerId]: Math.max(0, (prev[volunteerId] || 0) - quantity)
      }));

      toast({
        title: "Success",
        description: quantity === 1
          ? `T-shirt (size ${size}) issued successfully.`
          : `${quantity} T-shirts (size ${size}) issued successfully.`,
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

  // Log the received tshirtSizes
  console.log("TShirtSizeGridNew received tshirtSizes:", tshirtSizes);

  // Create a default set of T-shirt sizes if none are available
  const displaySizes = tshirtSizes.length > 0 ? tshirtSizes : [
    { id: 1, size_name: 'XS', sort_order: 1 },
    { id: 2, size_name: 'S', sort_order: 2 },
    { id: 3, size_name: 'M', sort_order: 3 },
    { id: 4, size_name: 'L', sort_order: 4 },
    { id: 5, size_name: 'XL', sort_order: 5 },
    { id: 6, size_name: '2XL', sort_order: 6 },
    { id: 7, size_name: '3XL', sort_order: 7 },
  ];

  return (
    <div className="overflow-x-auto">
      {/* Confirmation Dialog for exceeding allocation */}
      <AlertDialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exceed Allocation?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingIssuance && (
                <>
                  This volunteer has only {allocations[pendingIssuance.volunteerId]} remaining T-shirt allocation,
                  but you're trying to issue {pendingIssuance.quantity} {pendingIssuance.size} T-shirt(s).
                  <br /><br />
                  Do you want to proceed anyway?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingIssuance) {
                  processIssuance(
                    pendingIssuance.volunteerId,
                    pendingIssuance.size,
                    pendingIssuance.quantity
                  );
                }
              }}
            >
              Yes, Issue Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="mb-4 p-3 bg-accent/10 rounded-md border border-accent/20">
        <h3 className="text-lg font-medium flex items-center">
          <Shirt className="mr-2 h-5 w-5 text-accent" />
          T-Shirt Size Grid (New Implementation)
        </h3>
        {tshirtSizes.length === 0 && (
          <div className="mt-2 text-sm text-muted-foreground">
            No T-shirt sizes found. Using default sizes.
          </div>
        )}
      </div>
      <Table className="border-collapse">
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[180px] font-semibold">Volunteer</TableHead>
            <TableHead className="w-[100px] font-semibold text-center">Allocation Count</TableHead>
            <TableHead className="w-[150px] font-semibold text-center">Preferences by Size</TableHead>
            <TableHead className="w-[150px] font-semibold text-center">Issued by Size</TableHead>
            {displaySizes.map(size => (
              <TableHead key={size.id} className="text-center font-semibold">
                {size.size_name}
              </TableHead>
            ))}

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
                    {vol.requested_tshirt_quantity || 1}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Loading...</span>
                )}
              </TableCell>

              {/* Preference Count Cell */}
              <TableCell className="text-center border-b">
                {preferenceCountsBySize[vol.id] && Object.keys(preferenceCountsBySize[vol.id]).length > 0 ? (
                  <div className="flex flex-wrap justify-center gap-1">
                    {Object.entries(preferenceCountsBySize[vol.id]).map(([size, count]) => (
                      <span key={size} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        {size} [{count}]
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">No preferences</span>
                )}
              </TableCell>

              {/* Issue Count Cell */}
              <TableCell className="text-center border-b">
                {issuanceCountsBySize[vol.id] && Object.keys(issuanceCountsBySize[vol.id]).length > 0 ? (
                  <div className="flex flex-wrap justify-center gap-1">
                    {Object.entries(issuanceCountsBySize[vol.id]).map(([size, count]) => (
                      <span key={size} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        {size} [{count}]
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">None issued</span>
                )}
              </TableCell>

              {displaySizes.map(size => (
                <TableCell key={size.id} className="text-center border-b">
                  {/* T-shirt cell with counter controls - 2 column layout */}
                  <div className="flex justify-center items-center">
                    <div className="grid grid-cols-2 gap-2">
                      {/* Column 1: Count and T-shirt icon */}
                      <div className="flex flex-col items-center justify-center">
                        {/* For admin, show issued count */}
                        {isAdmin && (
                          <div className={`text-xs font-medium ${
                            issuances[vol.id]?.filter(s => s === size.size_name).length > 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-muted-foreground"
                          }`}>
                            {issuances[vol.id]?.filter(s => s === size.size_name).length || 0}
                          </div>
                        )}

                        {/* For volunteer, show preference count */}
                        {!isAdmin && (
                          <div className={`text-xs font-medium ${
                            preferences[vol.id]?.[size.id.toString()]
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-muted-foreground"
                          }`}>
                            {preferenceCountsBySize[vol.id]?.[size.size_name] || 0}
                          </div>
                        )}

                        <Button
                          variant={
                            isAdmin
                              ? (issuances[vol.id]?.includes(size.size_name) ? "default" : "outline")
                              : (preferences[vol.id]?.[size.id.toString()] ? "default" : "outline")
                          }
                          size="icon"
                          className="h-8 w-8 rounded-full mt-1"
                          disabled={saving[vol.id]}
                          onClick={() => {
                            // For both admin and volunteer, just toggle the state
                            // Don't issue or add preference here to avoid double counting
                            // when used with the plus button

                            // Just show the current status
                            if (isAdmin) {
                              const count = issuances[vol.id]?.filter(s => s === size.size_name).length || 0;
                              toast({
                                title: "T-shirt Status",
                                description: `${count} ${size.size_name} T-shirts issued to ${vol.first_name} ${vol.last_name}`,
                              });
                            } else {
                              const hasPreference = preferences[vol.id]?.[size.id.toString()];
                              toast({
                                title: "Preference Status",
                                description: hasPreference
                                  ? `You have a preference for size ${size.size_name}`
                                  : `No preference set for size ${size.size_name}`,
                              });
                            }
                          }}
                          title={
                            isAdmin
                              ? `Issue size ${size.size_name} T-shirt to ${vol.first_name}`
                              : (preferences[vol.id]?.[size.id.toString()] ? "Remove preference" : "Set as preference")
                          }
                        >
                          {isAdmin && issuances[vol.id]?.includes(size.size_name) ? (
                            <Check className="h-4 w-4" />
                          ) : !isAdmin && preferences[vol.id]?.[size.id.toString()] ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Shirt className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>

                      {/* Column 2: Plus and Minus buttons */}
                      <div className="flex flex-col items-center justify-center space-y-2">
                        {/* Plus button */}
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 rounded-full"
                          disabled={saving[vol.id]}
                          onClick={() => {
                            console.log("Plus button clicked");
                            if (isAdmin) {
                              // For admin, issue a T-shirt
                              // Check if we're already in the process of saving
                              if (saving[vol.id]) {
                                console.log("Already saving, ignoring click");
                                return;
                              }
                              console.log("Calling issueTShirt");
                              issueTShirt(vol.id, size.size_name, 1);
                            } else {
                              // For volunteer, add preference
                              if (!preferences[vol.id]?.[size.id.toString()]) {
                                console.log("Calling togglePreference");
                                togglePreference(vol.id, size.id.toString());
                              } else {
                                // Increment preference count (not implemented yet)
                                toast({
                                  title: "Not Implemented",
                                  description: "Incrementing preference count is not implemented yet.",
                                  variant: "default",
                                });
                              }
                            }
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>

                        {/* Minus button */}
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 rounded-full"
                          disabled={saving[vol.id]}
                          onClick={() => {
                            if (isAdmin) {
                              // For admin, handle T-shirt return
                              const count = issuances[vol.id]?.filter(s => s === size.size_name).length || 0;
                              if (count > 0) {
                                // Implement T-shirt return
                                returnTShirt(vol.id, size.size_name);
                              }
                            } else {
                              // For volunteer, remove preference
                              if (preferences[vol.id]?.[size.id.toString()]) {
                                togglePreference(vol.id, size.id.toString());
                              }
                            }
                          }}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </TableCell>
              ))}


            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );