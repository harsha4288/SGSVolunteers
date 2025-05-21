"use client";

import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";
import { useIsMobile } from "@/hooks/use-mobile";
import { TShirtHeader } from "./TShirtHeader";
import { NoVolunteersAlert } from "./NoVolunteersAlert";
import { TShirtConfirmationDialog } from "./TShirtConfirmationDialog";
import { Button } from "@/components/ui/button";
import { Check, Shirt, Plus, Minus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

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

interface TShirtSizeGridStableProps {
  supabase: SupabaseClient<Database>;
  isAdmin: boolean;
  eventId: number;
  tshirtSizes: TShirtSize[];
  volunteer: Volunteer | null;
  familyMembers: Volunteer[];
  searchResults: Volunteer[];
  profileId: string;
}

export function TShirtSizeGridStable({
  supabase,
  isAdmin,
  eventId,
  tshirtSizes,
  volunteer,
  familyMembers,
  searchResults,
  profileId
}: TShirtSizeGridStableProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // State
  const [loading, setLoading] = React.useState(false);
  const [preferences, setPreferences] = React.useState<Record<string, Record<string, boolean>>>({});
  const [allocations, setAllocations] = React.useState<Record<string, number>>({});
  const [issuances, setIssuances] = React.useState<Record<string, string[]>>({});
  const [preferenceCountsBySize, setPreferenceCountsBySize] = React.useState<Record<string, Record<string, number>>>({});
  const [issuanceCountsBySize, setIssuanceCountsBySize] = React.useState<Record<string, Record<string, number>>>({});
  const [saving, setSaving] = React.useState<Record<string, boolean>>({});
  const [confirmationOpen, setConfirmationOpen] = React.useState(false);
  const [pendingIssuance, setPendingIssuance] = React.useState<{
    volunteerId: string;
    size: string;
    quantity: number;
  } | null>(null);

  // Store the sizes in state to make them stable
  const [displaySizes, setDisplaySizes] = React.useState<TShirtSize[]>([]);

  // Initialize displaySizes once on mount
  React.useEffect(() => {
    if (tshirtSizes && tshirtSizes.length > 0) {
      setDisplaySizes(tshirtSizes);
    } else {
      // Default sizes if nothing else is available
      const defaultSizes = [
        { id: 1, event_id: eventId, size_name: 'XS', sort_order: 1 },
        { id: 2, event_id: eventId, size_name: 'S', sort_order: 2 },
        { id: 3, event_id: eventId, size_name: 'M', sort_order: 3 },
        { id: 4, event_id: eventId, size_name: 'L', sort_order: 4 },
        { id: 5, event_id: eventId, size_name: 'XL', sort_order: 5 },
        { id: 6, event_id: eventId, size_name: '2XL', sort_order: 6 },
        { id: 7, event_id: eventId, size_name: '3XL', sort_order: 7 },
      ];
      setDisplaySizes(defaultSizes);
    }
  }, []);

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
        });
        setAllocations(newAllocations);

        // Initialize issuances record for all volunteers
        const newIssuances: Record<string, string[]> = {};
        volunteerIds.forEach(id => {
          newIssuances[id] = [];
        });

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

        if (issuanceError) {
          console.error("Error fetching issuances:", issuanceError);
        } else if (issuanceData && issuanceData.length > 0) {
          // Process issuances
          issuanceData.forEach(issuance => {
            if (!newIssuances[issuance.volunteer_id]) {
              newIssuances[issuance.volunteer_id] = [];
            }

            // Get size directly from the issuance record
            const sizeName = issuance.size;
            if (sizeName) {
              // Get quantity (default to 1 for backward compatibility)
              const quantity = issuance.quantity || 1;

              // Add to issuances array (one entry per quantity)
              for (let i = 0; i < quantity; i++) {
                newIssuances[issuance.volunteer_id].push(sizeName);
              }

              // Decrement allocation by quantity
              if (newAllocations[issuance.volunteer_id] >= quantity) {
                newAllocations[issuance.volunteer_id] -= quantity;
              } else {
                newAllocations[issuance.volunteer_id] = 0;
              }
            }
          });
        }
        setIssuances(newIssuances);
        setAllocations(newAllocations);

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
        setIssuanceCountsBySize(tempIssuanceCountsBySize);

        // Initialize preferences for all volunteers
        const newPreferences: Record<string, Record<string, boolean>> = {};
        const newPrefCountsBySize: Record<string, Record<string, number>> = {};
        volunteerIds.forEach(id => {
          newPreferences[id] = {};
          newPrefCountsBySize[id] = {};
        });

        // Fetch real preferences from the database for all volunteers, regardless of role
        console.log("Fetching preferences for volunteers:", volunteerIds);

        const { data: prefsData, error: prefsError } = await supabase
          .from('volunteer_tshirt_preferences')
          .select(`
            id,
            volunteer_id,
            tshirt_size_id,
            quantity,
            tshirt_sizes (
              id,
              size_name
            )
          `)
          .in('volunteer_id', volunteerIds)
          .eq('event_id', eventId);

        console.log("Preferences data from database:", prefsData);

        if (prefsError) {
          console.error("Error fetching preferences:", prefsError);
        } else if (prefsData && prefsData.length > 0) {
          console.log("Loaded preferences from database:", prefsData);

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

            if (sizeName) {
              // Initialize count if it doesn't exist
              if (!newPrefCountsBySize[pref.volunteer_id][sizeName]) {
                newPrefCountsBySize[pref.volunteer_id][sizeName] = 0;
              }

              // Add this preference's quantity to the total
              newPrefCountsBySize[pref.volunteer_id][sizeName] += (pref.quantity || 1);
            }
          });

          // Log the processed preferences and counts
          console.log("Processed preferences:", newPreferences);
          console.log("Processed preference counts:", newPrefCountsBySize);
        }

        console.log("Setting initial preferences:", newPreferences);
        console.log("Setting initial preference counts:", newPrefCountsBySize);

        setPreferences(newPreferences);
        setPreferenceCountsBySize(newPrefCountsBySize);
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

    // We no longer need to load from localStorage
    // All data is now stored in the database
  }, [supabase, eventId, volunteersToDisplay, toast]);

  // Handler functions
  const handleTogglePreference = async (volunteerId: string, sizeId: string) => {
    // For volunteers, enforce allocation limit as a hard stop
    if (!isAdmin && allocations[volunteerId] <= 0 && !preferences[volunteerId]?.[sizeId]) {
      toast({
        title: "Allocation Limit Reached",
        description: "You have no remaining T-shirt allocation.",
        variant: "destructive",
      });
      return;
    }

    setSaving({ ...saving, [volunteerId]: true });

    try {
      // Update local state first for immediate feedback
      const newPreferences = JSON.parse(JSON.stringify(preferences)); // Deep clone
      // Make sure the volunteerId exists in the preferences object
      if (!newPreferences[volunteerId]) {
        newPreferences[volunteerId] = {};
      }

      // Always add a preference when clicking the + button
      const isAdding = true;
      newPreferences[volunteerId][sizeId] = true;

      // Count total preferences for this volunteer
      const totalPreferences = Object.values(newPreferences[volunteerId]).filter(Boolean).length;

      // For volunteers, enforce allocation limit as a hard stop
      // Find the volunteer object to get the requested quantity
      const volunteerObj = volunteersToDisplay.find(v => v.id === volunteerId);
      const maxAllocation = volunteerObj?.requested_tshirt_quantity || 1;

      if (!isAdmin && totalPreferences > maxAllocation && isAdding) {
        toast({
          title: "Allocation Limit Reached",
          description: `Cannot select more sizes than your allocation limit (${maxAllocation}).`,
          variant: "destructive",
        });
        return;
      }

      console.log("Setting preferences immediately:", newPreferences);
      setPreferences(newPreferences);

      // Find the size name for this size ID
      const sizeObj = displaySizes.find(s => s.id.toString() === sizeId);
      if (sizeObj) {
        // Update preference counts by size immediately for better UX
        const newCounts = JSON.parse(JSON.stringify(preferenceCountsBySize)); // Deep clone
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
        console.log("Setting preference counts immediately:", newCounts);
        setPreferenceCountsBySize(newCounts);

        // Different behavior based on role
        if (isAdmin) {
          // For admin role, issue or return T-shirts
          if (isAdding) {
            // Issue a T-shirt
            await handleIssueTShirt(volunteerId, sizeObj.size_name, 1);
          } else {
            // Return a T-shirt
            if (issuances[volunteerId]?.includes(sizeObj.size_name)) {
              await handleReturnTShirt(volunteerId, sizeObj.size_name);
            } else {
              toast({
                title: "No T-shirt to Return",
                description: `No ${sizeObj.size_name} T-shirts issued to this volunteer.`,
                variant: "default",
              });
            }
          }
        } else {
          // For volunteer role, update preferences in the database
          // With the new quantity field, we can now properly handle multiple T-shirts of the same size
          console.log("Adding preference for volunteer:", volunteerId, "size:", sizeId, "eventId:", eventId);

          try {
            // Convert sizeId to a number if it's a string
            const numericSizeId = parseInt(sizeId);

            // Get the size object
            const sizeObj = displaySizes.find(s => s.id.toString() === sizeId);
            if (!sizeObj) {
              throw new Error(`Size with ID ${sizeId} not found`);
            }

            // For volunteers, enforce allocation limit as a hard stop
            // Find the volunteer object to get the requested quantity
            const volunteerObj = volunteersToDisplay.find(v => v.id === volunteerId);
            const maxAllocation = volunteerObj?.requested_tshirt_quantity || 1;

            // Get all current preferences from the database
            const { data: allPrefs, error: allPrefsError } = await supabase
              .from('volunteer_tshirt_preferences')
              .select('id, tshirt_size_id, quantity')
              .eq('volunteer_id', volunteerId)
              .eq('event_id', eventId);

            if (allPrefsError) {
              console.error("Error fetching all preferences:", allPrefsError);
              throw allPrefsError;
            }

            // Calculate total quantity across all preferences
            let totalQuantity = 0;
            if (allPrefs) {
              allPrefs.forEach(pref => {
                totalQuantity += (pref.quantity || 1);
              });
            }

            // Check if we've reached the allocation limit
            if (!isAdmin && totalQuantity >= maxAllocation) {
              toast({
                title: "Allocation Limit Reached",
                description: `Cannot select more T-shirts than your allocation limit (${maxAllocation}).`,
                variant: "destructive",
              });
              return;
            }

            // Check if preference already exists for this size
            const existingPref = allPrefs?.find(p => p.tshirt_size_id === numericSizeId);

            if (existingPref) {
              // If preference exists, increment the quantity
              console.log("Updating existing preference with increased quantity");

              const newQuantity = (existingPref.quantity || 1) + 1;

              const { error } = await supabase
                .from('volunteer_tshirt_preferences')
                .update({
                  quantity: newQuantity,
                  updated_at: new Date().toISOString()
                })
                .eq('id', existingPref.id);

              if (error) {
                console.error("Error updating preference quantity:", error);
                throw error;
              }

              console.log(`Preference quantity updated to ${newQuantity}`);
            } else {
              // If preference doesn't exist, insert a new one
              console.log("Inserting new preference record");

              const { error } = await supabase
                .from('volunteer_tshirt_preferences')
                .insert({
                  volunteer_id: volunteerId,
                  event_id: eventId,
                  tshirt_size_id: numericSizeId,
                  quantity: 1,
                  preference_order: (allPrefs?.length || 0) + 1,
                  is_fulfilled: false
                });

              if (error) {
                console.error("Error inserting preference:", error);
                throw error;
              }

              console.log("Preference added successfully to database");
            }

            // Update the UI to reflect the database state
            // Fetch all preferences again to ensure UI is in sync with DB
            const { data: updatedPrefs, error: updatedError } = await supabase
              .from('volunteer_tshirt_preferences')
              .select(`
                id,
                volunteer_id,
                tshirt_size_id,
                quantity,
                tshirt_sizes (
                  id,
                  size_name
                )
              `)
              .eq('volunteer_id', volunteerId)
              .eq('event_id', eventId);

            if (updatedError) {
              console.error("Error fetching updated preferences:", updatedError);
            } else if (updatedPrefs) {
              // Update preferences state
              const newPreferences = { ...preferences };
              if (!newPreferences[volunteerId]) {
                newPreferences[volunteerId] = {};
              }

              // Reset this volunteer's preferences
              newPreferences[volunteerId] = {};

              // Update preference counts
              const newCounts = { ...preferenceCountsBySize };
              newCounts[volunteerId] = {};

              // Process the updated preferences
              updatedPrefs.forEach(pref => {
                // Set preference active
                newPreferences[volunteerId][pref.tshirt_size_id.toString()] = true;

                // Get size name
                const sizeName = pref.tshirt_sizes?.size_name;
                if (sizeName) {
                  // Initialize count if it doesn't exist
                  if (!newCounts[volunteerId][sizeName]) {
                    newCounts[volunteerId][sizeName] = 0;
                  }

                  // Add this preference's quantity to the total
                  newCounts[volunteerId][sizeName] += (pref.quantity || 1);
                }
              });

              // Update state
              setPreferences(newPreferences);
              setPreferenceCountsBySize(newCounts);

              toast({
                title: "Success",
                description: `T-shirt preference for size ${sizeObj.size_name} updated successfully.`,
              });
            }
          } catch (error) {
            console.error("Error handling preference:", error);
            throw error;
          }

          // We're not fetching the latest preferences here anymore
          // because it was overwriting our UI state
          console.log("Skipping fetch of latest preferences to avoid overwriting UI state");

          toast({
            title: "Success",
            description: isAdding
              ? `Size ${sizeObj.size_name} preference added successfully.`
              : `Size ${sizeObj.size_name} preference removed successfully.`,
          });
        }
      }
    } catch (error: any) {
      console.error("Error updating preferences:", error);

      // Get a more detailed error message
      const errorMessage = error?.message || error?.details || JSON.stringify(error) || "Unknown error";
      console.error("Detailed error:", errorMessage);

      toast({
        title: "Error",
        description: `Failed to update T-shirt preferences. ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setSaving({ ...saving, [volunteerId]: false });
    }
  };

  const handleIssueTShirt = async (volunteerId: string, size: string, quantity: number = 1) => {
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

  const handleReturnTShirt = async (volunteerId: string, size: string) => {
    if (!isAdmin) return;

    setSaving({ ...saving, [volunteerId]: true });

    try {
      // Check if volunteer has any T-shirts of this size
      const issuedCount = issuances[volunteerId]?.filter(s => s === size).length || 0;
      if (issuedCount <= 0) {
        throw new Error(`No ${size} T-shirts issued to this volunteer`);
      }

      // Find the size ID
      const sizeObj = displaySizes.find(s => s.size_name === size);
      if (!sizeObj) {
        throw new Error(`Size ${size} not found`);
      }

      // Check inventory
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('tshirt_inventory')
        .select('id, quantity, quantity_on_hand')
        .eq('tshirt_size_id', sizeObj.id)
        .single();

      if (inventoryError) {
        throw inventoryError;
      }

      // Update inventory (increment quantity)
      const { error: updateError } = await supabase
        .from('tshirt_inventory')
        .update({
          quantity: (inventoryData?.quantity || 0) + 1,
          quantity_on_hand: (inventoryData?.quantity_on_hand || 0) + 1
        })
        .eq('id', inventoryData.id);

      if (updateError) {
        throw updateError;
      }

      // Find the issuance to delete
      const { data: issuanceData, error: findError } = await supabase
        .from('tshirt_issuances')
        .select('id, tshirt_inventory_id')
        .eq('volunteer_id', volunteerId)
        .eq('size', size)
        .order('id', { ascending: false })
        .limit(1);

      if (findError) {
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
        throw new Error(`Failed to delete issuance: ${deleteError.message}`);
      }

      // Update local state
      // 1. Update issuances
      const newIssuances = { ...issuances };
      const index = newIssuances[volunteerId].findIndex(s => s === size);
      if (index !== -1) {
        newIssuances[volunteerId] = [
          ...newIssuances[volunteerId].slice(0, index),
          ...newIssuances[volunteerId].slice(index + 1)
        ];
      }
      setIssuances(newIssuances);

      // 2. Update issuance counts
      const newCounts = { ...issuanceCountsBySize };
      if (newCounts[volunteerId] && newCounts[volunteerId][size] > 0) {
        newCounts[volunteerId][size]--;
        if (newCounts[volunteerId][size] === 0) {
          delete newCounts[volunteerId][size];
        }
      }
      setIssuanceCountsBySize(newCounts);

      // 3. Update allocation
      const newAllocations = { ...allocations };
      newAllocations[volunteerId] = (newAllocations[volunteerId] || 0) + 1;
      setAllocations(newAllocations);

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
      setSaving({ ...saving, [volunteerId]: false });
    }
  };

  const processIssuance = async (volunteerId: string, size: string, quantity: number = 1) => {
    if (!isAdmin) return;

    setSaving({ ...saving, [volunteerId]: true });

    try {
      // Find the size ID
      const sizeObj = displaySizes.find(s => s.size_name === size);
      if (!sizeObj) {
        throw new Error(`Size ${size} not found`);
      }

      // Check inventory
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('tshirt_inventory')
        .select('id, quantity, quantity_on_hand')
        .eq('tshirt_size_id', sizeObj.id)
        .single();

      if (inventoryError) {
        throw inventoryError;
      }

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

      if (updateError) {
        throw updateError;
      }

      // Record issuance in the database
      const insertData = {
        volunteer_id: volunteerId,
        tshirt_inventory_id: inventoryData.id,
        issued_by_profile_id: profileId,
        size: size,
        quantity: quantity
      };

      const { error: insertError } = await supabase
        .from('tshirt_issuances')
        .insert(insertData);

      if (insertError) {
        throw new Error(`Failed to record issuance: ${insertError.message}`);
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
        }
      }

      // Update local state
      // 1. Update issuances
      const newIssuances = { ...issuances };
      if (!newIssuances[volunteerId]) {
        newIssuances[volunteerId] = [];
      }
      newIssuances[volunteerId] = [...newIssuances[volunteerId], size];
      setIssuances(newIssuances);

      // 2. Update issuance counts
      const newCounts = { ...issuanceCountsBySize };
      if (!newCounts[volunteerId]) {
        newCounts[volunteerId] = {};
      }
      if (!newCounts[volunteerId][size]) {
        newCounts[volunteerId][size] = 0;
      }
      newCounts[volunteerId][size]++;
      setIssuanceCountsBySize(newCounts);

      // 3. Update allocation
      const newAllocations = { ...allocations };
      newAllocations[volunteerId] = Math.max(0, (newAllocations[volunteerId] || 0) - quantity);
      setAllocations(newAllocations);

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
      setSaving({ ...saving, [volunteerId]: false });
    }
  };

  const handleConfirmIssuance = async () => {
    if (pendingIssuance) {
      await processIssuance(
        pendingIssuance.volunteerId,
        pendingIssuance.size,
        pendingIssuance.quantity
      );
    }
    setConfirmationOpen(false);
  };

  const handleRemovePreference = async (volunteerId: string, sizeId: string) => {
    setSaving({ ...saving, [volunteerId]: true });

    try {
      // Convert sizeId to a number if it's a string
      const numericSizeId = parseInt(sizeId);

      // Get the size object
      const sizeObj = displaySizes.find(s => s.id.toString() === sizeId);
      if (!sizeObj) {
        throw new Error(`Size with ID ${sizeId} not found`);
      }

      // Check if preference exists in database
      const { data: existingPref, error: existingError } = await supabase
        .from('volunteer_tshirt_preferences')
        .select('id, quantity')
        .eq('volunteer_id', volunteerId)
        .eq('event_id', eventId)
        .eq('tshirt_size_id', numericSizeId)
        .single();

      if (existingError && existingError.code !== 'PGRST116') {
        throw existingError;
      }

      // Handle preference if it exists
      if (existingPref) {
        const currentQuantity = existingPref.quantity || 1;

        if (currentQuantity > 1) {
          // If quantity > 1, decrement the quantity
          console.log(`Decrementing preference quantity for ${sizeObj.size_name} from ${currentQuantity} to ${currentQuantity - 1}`);

          const { error } = await supabase
            .from('volunteer_tshirt_preferences')
            .update({
              quantity: currentQuantity - 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingPref.id);

          if (error) {
            console.error("Error updating preference quantity:", error);
            throw error;
          }

          console.log(`Preference quantity updated to ${currentQuantity - 1}`);
        } else {
          // If quantity is 1, remove the preference
          console.log(`Removing preference for ${sizeObj.size_name} from database`);

          const { error } = await supabase
            .from('volunteer_tshirt_preferences')
            .delete()
            .eq('id', existingPref.id);

          if (error) {
            console.error("Error deleting preference:", error);
            throw error;
          }

          console.log("Preference removed from database successfully");
        }

        // Update the UI to reflect the database state
        // Fetch all preferences again to ensure UI is in sync with DB
        const { data: updatedPrefs, error: updatedError } = await supabase
          .from('volunteer_tshirt_preferences')
          .select(`
            id,
            volunteer_id,
            tshirt_size_id,
            quantity,
            tshirt_sizes (
              id,
              size_name
            )
          `)
          .eq('volunteer_id', volunteerId)
          .eq('event_id', eventId);

        if (updatedError) {
          console.error("Error fetching updated preferences:", updatedError);
        } else {
          // Update preferences state
          const newPreferences = { ...preferences };
          if (!newPreferences[volunteerId]) {
            newPreferences[volunteerId] = {};
          }

          // Reset this volunteer's preferences
          newPreferences[volunteerId] = {};

          // Update preference counts
          const newCounts = { ...preferenceCountsBySize };
          newCounts[volunteerId] = {};

          // Process the updated preferences
          if (updatedPrefs) {
            updatedPrefs.forEach(pref => {
              // Set preference active
              newPreferences[volunteerId][pref.tshirt_size_id.toString()] = true;

              // Get size name
              const sizeName = pref.tshirt_sizes?.size_name;
              if (sizeName) {
                // Initialize count if it doesn't exist
                if (!newCounts[volunteerId][sizeName]) {
                  newCounts[volunteerId][sizeName] = 0;
                }

                // Add this preference's quantity to the total
                newCounts[volunteerId][sizeName] += (pref.quantity || 1);
              }
            });
          }

          // Update state
          setPreferences(newPreferences);
          setPreferenceCountsBySize(newCounts);
        }

        toast({
          title: "Success",
          description: currentQuantity > 1
            ? `Preference quantity for size ${sizeObj.size_name} decreased.`
            : `Preference for size ${sizeObj.size_name} removed.`,
        });
      } else {
        console.log(`No preference found for ${sizeObj.size_name} in database`);

        toast({
          title: "No Preference Found",
          description: `No preference found for size ${sizeObj.size_name}.`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error removing preference:", error);
      toast({
        title: "Error",
        description: "Failed to remove T-shirt preference.",
        variant: "destructive",
      });
    } finally {
      setSaving({ ...saving, [volunteerId]: false });
    }
  };

  // Render T-shirt size cell
  const renderTShirtSizeCell = (volunteerId: string, size: TShirtSize) => {
    const issuedCount = issuances[volunteerId]?.filter(s => s === size.size_name).length || 0;
    const preferenceCount = preferenceCountsBySize[volunteerId]?.[size.size_name] || 0;
    const hasPreference = preferenceCount > 0 || preferences[volunteerId]?.[size.id.toString()];

    // Log for debugging
    if (hasPreference) {
      console.log(`Volunteer ${volunteerId} has preference for size ${size.size_name} (${size.id}): count=${preferenceCount}, active=${preferences[volunteerId]?.[size.id.toString()]}`);
    }

    // Make sure we show the correct count
    const displayCount = preferenceCount > 0 ? preferenceCount : (preferences[volunteerId]?.[size.id.toString()] ? 1 : 0);
    const showAsActive = displayCount > 0;

    return (
      <TableCell key={size.id} className="text-center border-b">
        <div className="flex justify-center items-center">
          {/* Main T-shirt button with count */}
          <div className="flex flex-col items-center justify-center">
            {/* Show count (issued for admin, preferences for volunteer) */}
            <div className={`text-sm font-medium ${
              (isAdmin && issuedCount > 0) || (!isAdmin && showAsActive)
                ? "text-green-600 dark:text-green-400"
                : "text-muted-foreground"
            }`}>
              {isAdmin ? issuedCount : displayCount}
            </div>

            {/* T-shirt icon button */}
            <Button
              variant={(isAdmin && issuedCount > 0) || (!isAdmin && showAsActive) ? "default" : "outline"}
              size="icon"
              className="h-8 w-8 rounded-full mt-1"
              disabled={saving[volunteerId]}
              onClick={() => {
                if (!isAdmin) {
                  // For volunteer, add first preference
                  if (!showAsActive) {
                    handleTogglePreference(volunteerId, size.id.toString());
                  }
                }
              }}
              title={
                isAdmin
                  ? `${issuedCount} size ${size.size_name} T-shirts issued`
                  : (showAsActive ? `${displayCount} size ${size.size_name} preferences` : "Add preference")
              }
            >
              <Shirt className="h-4 w-4" />
            </Button>
          </div>

          {/* Plus and Minus buttons - only show if there's already a preference/issuance */}
          {((isAdmin && issuedCount > 0) || (!isAdmin && showAsActive)) && (
            <div className="flex flex-col ml-2 space-y-2">
              {/* Plus button */}
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6 rounded-full"
                disabled={saving[volunteerId]}
                onClick={() => {
                  if (isAdmin) {
                    // For admin, issue a T-shirt
                    if (saving[volunteerId]) {
                      return;
                    }
                    handleIssueTShirt(volunteerId, size.size_name, 1);
                  } else {
                    // For volunteer, add preference
                    handleTogglePreference(volunteerId, size.id.toString());
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
                disabled={saving[volunteerId]}
                onClick={() => {
                  if (isAdmin) {
                    // For admin, handle T-shirt return
                    handleReturnTShirt(volunteerId, size.size_name);
                  } else {
                    // For volunteer, remove preference
                    handleRemovePreference(volunteerId, size.id.toString());
                  }
                }}
              >
                <Minus className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </TableCell>
    );
  };

  if (volunteersToDisplay.length === 0) {
    return <NoVolunteersAlert isAdmin={isAdmin} />;
  }

  return (
    <div className="overflow-x-auto">
      {/* Confirmation Dialog for exceeding allocation */}
      <TShirtConfirmationDialog
        open={confirmationOpen}
        onOpenChange={setConfirmationOpen}
        pendingIssuance={pendingIssuance}
        allocations={allocations}
        onConfirm={handleConfirmIssuance}
      />

      <TShirtHeader tshirtSizesCount={tshirtSizes.length} isAdmin={isAdmin} />

      <Table className="border-collapse">
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[180px] font-semibold">Volunteer</TableHead>
            <TableHead className="w-[60px] font-semibold text-center">Max</TableHead>
            <TableHead colSpan={displaySizes.length} className="text-center font-semibold bg-accent/10 border-b border-accent/20">
              {isAdmin ? "Issued" : "Preferences"}
            </TableHead>
          </TableRow>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[180px] font-semibold"></TableHead>
            <TableHead className="w-[60px] font-semibold text-center"></TableHead>
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
                <div className="flex flex-col">
                  <span>
                    {vol.first_name} {vol.last_name}
                    {volunteer && vol.id === volunteer.id && " (You)"}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {vol.email}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-center border-b">
                {vol.requested_tshirt_quantity !== undefined ? (
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    {vol.requested_tshirt_quantity || 1}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Loading...</span>
                )}
              </TableCell>



              {/* T-shirt Size Cells */}
              {displaySizes.map(size => renderTShirtSizeCell(vol.id, size))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );