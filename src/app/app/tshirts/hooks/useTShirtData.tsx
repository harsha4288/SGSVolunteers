"use client";

import * as React from "react";
import { useToast } from "@/hooks/use-toast";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";

interface Volunteer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  requested_tshirt_quantity?: number;
  profile_id?: string;
}

interface TShirtSize {
  id: number;
  event_id: number;
  size_name: string;
  sort_order: number;
}

interface UseTShirtDataProps {
  supabase: SupabaseClient<Database>;
  eventId: number;
  volunteer: Volunteer | null;
  familyMembers: Volunteer[];
  searchResults: Volunteer[];
  isAdmin: boolean;
}

interface TShirtDataState {
  loading: boolean;
  preferences: Record<string, Record<string, boolean>>;
  allocations: Record<string, number>;
  issuances: Record<string, string[]>;
  preferenceCountsBySize: Record<string, Record<string, number>>;
  issuanceCountsBySize: Record<string, Record<string, number>>;
  saving: Record<string, boolean>;
  volunteersToDisplay: Volunteer[];
}

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
      setState(prev => ({ ...prev, loading: true }));
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

          // Set issuance counts by size
          setState(prev => ({
            ...prev,
            issuanceCountsBySize: tempIssuanceCountsBySize
          }));
        } catch (error) {
          console.error("Error processing issuances:", error);
          // Continue with default allocations and empty issuances
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
              tshirt_sizes (
                id,
                size_name
              )
            `)
            .in('volunteer_id', volunteerIds)
            .eq('event_id', eventId);

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

              if (sizeName) {
                // Increment count for this size
                if (!newPrefCountsBySize[pref.volunteer_id][sizeName]) {
                  newPrefCountsBySize[pref.volunteer_id][sizeName] = 0;
                }
                newPrefCountsBySize[pref.volunteer_id][sizeName]++;
              }
            });
          }
        } catch (error) {
          console.error("Error processing preferences:", error);
          // Continue with empty preferences
        }

        // Set preferences regardless of whether there was an error
        setState(prev => ({
          ...prev,
          preferences: newPreferences,
          preferenceCountsBySize: newPrefCountsBySize
        }));

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

        setState(prev => ({
          ...prev,
          issuanceCountsBySize: tempIssuanceCounts,
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

  return {
    ...state,
    volunteersToDisplay,
    setSaving,
    setState
  };
}
