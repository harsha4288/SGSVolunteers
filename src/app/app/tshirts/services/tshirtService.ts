"use client";

import { useToast } from "@/hooks/use-toast";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";

interface TShirtSize {
  id: number;
  event_id: number;
  size_name: string;
  sort_order: number;
}

interface TShirtServiceProps {
  supabase: SupabaseClient<Database>;
  eventId: number;
  profileId: string;
  isAdmin: boolean;
}

export function createTShirtService({
  supabase,
  eventId,
  profileId,
  isAdmin,
}: TShirtServiceProps) {
  const togglePreference = async (
    volunteerId: string,
    sizeId: string,
    preferences: Record<string, Record<string, boolean>>,
    allocations: Record<string, number>,
    displaySizes: TShirtSize[],
    setPreferences: (prefs: Record<string, Record<string, boolean>>) => void,
    setPreferenceCountsBySize: (counts: Record<string, Record<string, number>>) => void,
    setSaving: (volunteerId: string, isSaving: boolean) => void,
    toast: ReturnType<typeof useToast>["toast"],
    issueTShirt: (volunteerId: string, size: string, quantity: number) => Promise<void>
  ) => {
    // For volunteers, enforce allocation limit as a hard stop
    if (!isAdmin && allocations[volunteerId] <= 0 && !preferences[volunteerId]?.[sizeId]) {
      toast({
        title: "Allocation Limit Reached",
        description: "You have no remaining T-shirt allocation.",
        variant: "destructive",
      });
      return;
    }

    setSaving(volunteerId, true);

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

        // Update preference counts by size immediately for better UX
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

        // Fetch the latest preferences to ensure UI is up-to-date
        try {
          const { data: latestPrefs, error: fetchError } = await supabase
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
            .eq('volunteer_id', volunteerId)
            .eq('event_id', eventId);

          if (fetchError) {
            console.error("Error fetching latest preferences:", fetchError);
          } else {
            // Update preferences state with the latest data
            const updatedPreferences = { ...preferences };
            updatedPreferences[volunteerId] = {};

            // Create new preference counts object
            const updatedCounts = {};
            updatedCounts[volunteerId] = {};

            // Process the latest preferences
            latestPrefs.forEach(pref => {
              // Set preference active
              updatedPreferences[volunteerId][pref.tshirt_size_id.toString()] = true;

              // Get size name from the joined tshirt_sizes table
              const sizeName = pref.tshirt_sizes?.size_name;

              if (sizeName) {
                // Increment count for this size
                if (!updatedCounts[volunteerId][sizeName]) {
                  updatedCounts[volunteerId][sizeName] = 0;
                }
                updatedCounts[volunteerId][sizeName]++;
              }
            });

            // Update state with the latest data
            setPreferences(updatedPreferences);
            setPreferenceCountsBySize(updatedCounts);
          }
        } catch (error) {
          console.error("Error updating preference data:", error);
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
      setSaving(volunteerId, false);
    }
  };

  return {
    togglePreference,
  };
}
