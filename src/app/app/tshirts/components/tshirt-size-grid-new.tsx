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

    console.log(`Starting returnTShirt for volunteer ${volunteerId}, size ${size}`);
    setSaving(prev => ({ ...prev, [volunteerId]: true }));

    try {
      // Check if volunteer has any T-shirts of this size
      const issuedCount = issuances[volunteerId]?.filter(s => s === size).length || 0;
      console.log(`Volunteer has ${issuedCount} ${size} T-shirts issued`);

      if (issuedCount <= 0) {
        throw new Error(`No ${size} T-shirts issued to this volunteer`);
      }

      // Find the size ID
      console.log("Looking for size in tshirtSizes:", tshirtSizes);
      const sizeObj = tshirtSizes.find(s => s.size_name === size);
      if (!sizeObj) {
        console.error(`Size ${size} not found in tshirtSizes:`, tshirtSizes);
        throw new Error(`Size ${size} not found`);
      }

      console.log(`Found size object:`, sizeObj);

      // Check inventory - for now, let's remove the event_id filter to see if that's the issue
      console.log(`Fetching inventory for size ID ${sizeObj.id}...`);
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('tshirt_inventory')
        .select('id, quantity, quantity_on_hand')
        .eq('tshirt_size_id', sizeObj.id)
        .single();

      if (inventoryError) {
        console.error("Error fetching inventory:", inventoryError);
        throw inventoryError;
      }

      console.log("Found inventory data:", inventoryData);

      // Update inventory (increment quantity)
      console.log(`Updating inventory ID ${inventoryData.id}...`);
      const { error: updateError } = await supabase
        .from('tshirt_inventory')
        .update({
          quantity: (inventoryData?.quantity || 0) + 1,
          quantity_on_hand: (inventoryData?.quantity_on_hand || 0) + 1
        })
        .eq('id', inventoryData.id);

      if (updateError) {
        console.error("Error updating inventory:", updateError);
        throw updateError;
      }

      console.log("Inventory updated successfully");

      // Find the issuance to delete
      console.log(`Finding issuance to delete for volunteer ${volunteerId}, size ${size}...`);
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

      console.log("Found issuance data:", issuanceData);

      if (!issuanceData || issuanceData.length === 0) {
        throw new Error(`No issuance found to delete for volunteer ${volunteerId}`);
      }

      // Delete the issuance
      console.log(`Deleting issuance ID ${issuanceData[0].id}...`);
      const { error: deleteError } = await supabase
        .from('tshirt_issuances')
        .delete()
        .eq('id', issuanceData[0].id);

      if (deleteError) {
        console.error("Error deleting issuance:", deleteError);
        throw new Error(`Failed to delete issuance: ${deleteError.message}`);
      }

      console.log(`Deleted issuance from the database:`, issuanceData[0]);

      // Instead of updating the local state here, we'll refetch the data
      // This ensures the UI is always in sync with the database
      // and prevents any double counting issues

      // Fetch the latest issuances for this volunteer
      const { data: latestIssuances, error: fetchError } = await supabase
        .from('tshirt_issuances')
        .select('id, size')
        .eq('volunteer_id', volunteerId);

      if (fetchError) {
        console.error("Error fetching latest issuances:", fetchError);
      } else {
        // Update local state with the latest data from the database
        const newIssuances = { ...issuances };
        newIssuances[volunteerId] = latestIssuances.map(i => i.size);
        setIssuances(newIssuances);

        // Recalculate issuance counts
        const newCounts = { ...issuanceCountsBySize };
        newCounts[volunteerId] = {};

        // Count by size
        latestIssuances.forEach(issuance => {
          if (!newCounts[volunteerId][issuance.size]) {
            newCounts[volunteerId][issuance.size] = 0;
          }
          newCounts[volunteerId][issuance.size]++;
        });

        setIssuanceCountsBySize(newCounts);
      }

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

    console.log(`Starting processIssuance for volunteer ${volunteerId}, size ${size}, quantity ${quantity}`);
    setSaving(prev => ({ ...prev, [volunteerId]: true }));

    try {
      // Find the size ID
      console.log("Looking for size in tshirtSizes:", tshirtSizes);
      const sizeObj = tshirtSizes.find(s => s.size_name === size);
      if (!sizeObj) {
        console.error(`Size ${size} not found in tshirtSizes:`, tshirtSizes);
        throw new Error(`Size ${size} not found`);
      }

      console.log(`Found size object:`, sizeObj);

      // Check if tshirt_inventory table exists and has data
      console.log("Checking tshirt_inventory table...");
      const { data: tableCheck, error: tableError } = await supabase
        .from('tshirt_inventory')
        .select('id')
        .limit(1);

      if (tableError) {
        console.error("Error checking tshirt_inventory table:", tableError);
        throw new Error(`Error checking tshirt_inventory table: ${tableError.message}`);
      }

      console.log("tshirt_inventory table check result:", tableCheck);

      // For debugging, let's check what inventory records exist for this size
      console.log(`Checking inventory for size ID ${sizeObj.id}...`);
      const { data: allInventory, error: allInventoryError } = await supabase
        .from('tshirt_inventory')
        .select('*')
        .eq('tshirt_size_id', sizeObj.id);

      if (allInventoryError) {
        console.error("Error checking all inventory:", allInventoryError);
      } else {
        console.log(`Found ${allInventory?.length || 0} inventory records for size ID ${sizeObj.id}:`, allInventory);
      }

      // Check inventory - for now, let's remove the event_id filter to see if that's the issue
      console.log(`Fetching inventory for size ID ${sizeObj.id}...`);
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('tshirt_inventory')
        .select('id, quantity, quantity_on_hand')
        .eq('tshirt_size_id', sizeObj.id)
        .single();

      if (inventoryError) {
        console.error("Error fetching inventory:", inventoryError);
        throw inventoryError;
      }

      console.log("Found inventory data:", inventoryData);

      if (!inventoryData || inventoryData.quantity < quantity) {
        throw new Error(`Only ${inventoryData?.quantity || 0} T-shirts available for size ${size}, but tried to issue ${quantity}`);
      }

      // Update inventory
      console.log(`Updating inventory ID ${inventoryData.id}...`);
      const { error: updateError } = await supabase
        .from('tshirt_inventory')
        .update({
          quantity: inventoryData.quantity - quantity,
          quantity_on_hand: inventoryData.quantity_on_hand - quantity
        })
        .eq('id', inventoryData.id);

      if (updateError) {
        console.error("Error updating inventory:", updateError);
        throw updateError;
      }

      console.log("Inventory updated successfully");

      // Check if tshirt_issuances table exists
      console.log("Checking tshirt_issuances table...");
      const { data: issuanceCheck, error: issuanceTableError } = await supabase
        .from('tshirt_issuances')
        .select('id')
        .limit(1);

      if (issuanceTableError) {
        console.error("Error checking tshirt_issuances table:", issuanceTableError);
        throw new Error(`Error checking tshirt_issuances table: ${issuanceTableError.message}`);
      }

      console.log("tshirt_issuances table check result:", issuanceCheck);

      // Skip table structure check since the RPC function might not exist
      console.log("Skipping table structure check...");

      // Record issuance in the database
      console.log(`Recording ${quantity} issuances...`);

      try {
        // Create the insert data object
        const insertData = {
          volunteer_id: volunteerId,
          tshirt_inventory_id: inventoryData.id,
          issued_by_profile_id: profileId,
          size: size
        };

        console.log("Insert data:", insertData);

        // Insert just one record for simplicity
        const { error: insertError } = await supabase
          .from('tshirt_issuances')
          .insert(insertData);

        if (insertError) {
          console.error("Error recording issuance:", insertError);
          throw new Error(`Failed to record issuance: ${insertError.message}`);
        }

        console.log(`Issuance recorded successfully`);
      } catch (e) {
        console.error("Unexpected error during insert:", e);
        throw new Error(`Unexpected error during insert: ${e.message}`);
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

      // Instead of updating the local state here, we'll refetch the data
      // This ensures the UI is always in sync with the database
      // and prevents any double counting issues

      // Fetch the latest issuances for this volunteer
      const { data: latestIssuances, error: fetchError } = await supabase
        .from('tshirt_issuances')
        .select('id, size')
        .eq('volunteer_id', volunteerId);

      if (fetchError) {
        console.error("Error fetching latest issuances:", fetchError);
      } else {
        // Update local state with the latest data from the database
        const newIssuances = { ...issuances };
        newIssuances[volunteerId] = latestIssuances.map(i => i.size);
        setIssuances(newIssuances);

        // Recalculate issuance counts
        const newCounts = { ...issuanceCountsBySize };
        newCounts[volunteerId] = {};

        // Count by size
        latestIssuances.forEach(issuance => {
          if (!newCounts[volunteerId][issuance.size]) {
            newCounts[volunteerId][issuance.size] = 0;
          }
          newCounts[volunteerId][issuance.size]++;
        });

        setIssuanceCountsBySize(newCounts);
      }

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

  // State for T-shirt inventory
  const [tshirtInventory, setTshirtInventory] = React.useState<any[]>([]);

  // Fetch T-shirt inventory
  React.useEffect(() => {
    const fetchInventory = async () => {
      console.log("Fetching inventory for event ID:", eventId);

      try {
        // First, let's check if the tshirt_inventory table exists
        const { data: tableInfo, error: tableError } = await supabase
          .from('tshirt_inventory')
          .select('id')
          .limit(1);

        if (tableError) {
          console.error("Error checking tshirt_inventory table:", tableError);
          return;
        }

        console.log("tshirt_inventory table exists, found data:", tableInfo);

        // Now fetch the actual inventory data
        const { data, error } = await supabase
          .from('tshirt_inventory')
          .select(`
            id,
            tshirt_size_id,
            quantity_initial,
            quantity,
            tshirt_sizes (
              id,
              size_name,
              sort_order
            )
          `);

        console.log("Inventory query executed, checking for errors...");

        if (error) {
          console.error("Error fetching inventory:", error);
          return;
        }

        console.log("Fetched inventory data:", data);

        if (!data || data.length === 0) {
          console.log("No inventory data found");
          return;
        }

        // Log each inventory item to check for null tshirt_sizes
        data.forEach((item, index) => {
          console.log(`Inventory item ${index}:`, {
            id: item.id,
            tshirt_size_id: item.tshirt_size_id,
            quantity_initial: item.quantity_initial,
            tshirt_sizes: item.tshirt_sizes
          });
        });

        setTshirtInventory(data);
      } catch (err) {
        console.error("Unexpected error in fetchInventory:", err);
      }
    };

    fetchInventory();
  }, [supabase, eventId]);

  // For debugging
  React.useEffect(() => {
    console.log("Current tshirtInventory state:", tshirtInventory);
  }, [tshirtInventory]);

  // Filter sizes to only show those with quantity_initial > 0
  const displaySizes = React.useMemo(() => {
    console.log("Running displaySizes useMemo with inventory:", tshirtInventory);

    // For now, let's just use all available sizes to debug the issue
    // We'll add the filtering back once we confirm the basic rendering works
    if (tshirtSizes.length > 0) {
      console.log("Using provided tshirtSizes:", tshirtSizes);
      return tshirtSizes;
    }

    // Default sizes if nothing else is available
    const defaultSizes = [
      { id: 1, size_name: 'XS', sort_order: 1 },
      { id: 2, size_name: 'S', sort_order: 2 },
      { id: 3, size_name: 'M', sort_order: 3 },
      { id: 4, size_name: 'L', sort_order: 4 },
      { id: 5, size_name: 'XL', sort_order: 5 },
      { id: 6, size_name: '2XL', sort_order: 6 },
      { id: 7, size_name: '3XL', sort_order: 7 },
    ];

    console.log("Using default sizes:", defaultSizes);
    return defaultSizes;
  }, [tshirtSizes, tshirtInventory]);

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
            <TableHead className="w-[60px] font-semibold text-center">Max</TableHead>
            <TableHead className="w-[120px] font-semibold text-center">Preferences</TableHead>
            <TableHead className="w-[120px] font-semibold text-center">Issued</TableHead>
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
                  <span className="text-muted-foreground text-sm">-</span>
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
                  <span className="text-muted-foreground text-sm">-</span>
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