"use client";

import * as React from "react";
import { useToast } from "@/hooks/use-toast";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";
import type { 
  Volunteer, 
  TShirtDataState 
} from "../types";
import { 
  getVolunteersToDisplay, 
  calculateAllocations, 
  initializeIssuances, 
  calculateCountsBySize 
} from "../utils/helpers";

interface UseTShirtDataProps {
  supabase: SupabaseClient<Database>;
  eventId: number;
  volunteer: Volunteer | null;
  familyMembers: Volunteer[];
  searchResults: Volunteer[];
  isAdmin: boolean;
}

/**
 * Hook to manage T-shirt data for volunteers
 */
export function useTShirtData({
  supabase,
  eventId,
  volunteer,
  familyMembers,
  searchResults,
  isAdmin,
}: UseTShirtDataProps) {
  const { toast } = useToast();
  const [state, setState] = React.useState<TShirtDataState>({
    loading: false,
    preferences: {},
    allocations: {},
    issuances: {},
    preferenceCountsBySize: {},
    issuanceCountsBySize: {},
    saving: {},
    volunteersToDisplay: [],
  });

  // Determine which volunteers to display based on role
  const volunteersToDisplay = React.useMemo(
    () => getVolunteersToDisplay(isAdmin, volunteer, familyMembers, searchResults),
    [isAdmin, volunteer, familyMembers, searchResults]
  );

  // Fetch volunteer allocations, preferences, and issuances
  React.useEffect(() => {
    if (volunteersToDisplay.length === 0) return;

    const fetchVolunteerData = async () => {
      setState(prev => ({ ...prev, loading: true }));
      try {
        const volunteerIds = volunteersToDisplay.map(v => v.id);

        // Calculate allocations from volunteer data
        const newAllocations = calculateAllocations(volunteersToDisplay);
        
        // Initialize issuances record for all volunteers
        const newIssuances = initializeIssuances(volunteerIds);

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
          const tempIssuanceCountsBySize = calculateCountsBySize(volunteerIds, newIssuances);

          // Set issuance counts by size
          setState(prev => ({
            ...prev,
            issuanceCountsBySize: tempIssuanceCountsBySize
          }));
        } catch (error) {
          console.error("Error processing issuances:", error);
        }

        // Set issuances regardless of whether there was an error
        setState(prev => ({
          ...prev,
          issuances: newIssuances,
          allocations: newAllocations
        }));

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
              quantity,
              tshirt_sizes (
                id,
                size_name
              )
            `)
            .in('volunteer_id', volunteerIds)
            .eq('event_id', eventId);

          if (prefsError) {
            console.error("Error fetching preferences:", prefsError);
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

              if (sizeName) {
                // Initialize count if it doesn't exist
                if (!newPrefCountsBySize[pref.volunteer_id][sizeName]) {
                  newPrefCountsBySize[pref.volunteer_id][sizeName] = 0;
                }

                // Add this preference's quantity to the total
                newPrefCountsBySize[pref.volunteer_id][sizeName] += (pref.quantity || 1);
              }
            });
          }
        } catch (error) {
          console.error("Error processing preferences:", error);
        }

        // Set preferences regardless of whether there was an error
        setState(prev => ({
          ...prev,
          preferences: newPreferences,
          preferenceCountsBySize: newPrefCountsBySize,
          volunteersToDisplay
        }));
      } catch (error) {
        console.error("Error fetching volunteer data:", error);
        toast({
          title: "Error",
          description: "Failed to load volunteer T-shirt data.",
          variant: "destructive",
        });
      } finally {
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    fetchVolunteerData();
  }, [supabase, eventId, volunteersToDisplay, toast]);

  const setSaving = (volunteerId: string, isSaving: boolean) => {
    setState(prev => ({
      ...prev,
      saving: { ...prev.saving, [volunteerId]: isSaving }
    }));
  };

  const setPreferences = (newPreferences: Record<string, Record<string, boolean>>) => {
    setState(prev => ({
      ...prev,
      preferences: newPreferences
    }));
  };

  const setPreferenceCountsBySize = (newCounts: Record<string, Record<string, number>>) => {
    setState(prev => ({
      ...prev,
      preferenceCountsBySize: newCounts
    }));
  };

  const setIssuances = (newIssuances: Record<string, string[]>) => {
    setState(prev => ({
      ...prev,
      issuances: newIssuances
    }));
  };

  const setIssuanceCountsBySize = (newCounts: Record<string, Record<string, number>>) => {
    setState(prev => ({
      ...prev,
      issuanceCountsBySize: newCounts
    }));
  };

  const setAllocations = (newAllocations: Record<string, number>) => {
    setState(prev => ({
      ...prev,
      allocations: newAllocations
    }));
  };

  return {
    ...state,
    volunteersToDisplay,
    setSaving,
    setPreferences,
    setPreferenceCountsBySize,
    setIssuances,
    setIssuanceCountsBySize,
    setAllocations
  };
}
