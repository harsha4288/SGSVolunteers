"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { createUnifiedTShirtService } from "../services/unified-tshirt-service";
import type { TShirtInventory, Volunteer } from "../types";

interface UnifiedTShirtState {
  volunteers: Volunteer[];
  sizes: TShirtInventory[];
  preferences: Record<string, Record<string, number>>; // volunteerId -> sizeCode -> quantity
  issuances: Record<string, Record<string, number>>; // volunteerId -> sizeCode -> quantity
  allocations: Record<string, number>; // volunteerId -> allocation count
  loading: boolean;
  saving: Record<string, boolean>; // volunteerId -> saving state
}

interface UseUnifiedTShirtDataProps {
  eventId: number;
  volunteersToDisplay: Volunteer[];
  isAdmin: boolean;
  currentVolunteerId?: string;
}

/**
 * Unified hook for managing T-shirt data (preferences and issuances)
 * This replaces the separate hooks and provides a single interface
 */
export function useUnifiedTShirtData({
  eventId,
  volunteersToDisplay,
  isAdmin,
  currentVolunteerId: _currentVolunteerId,
}: UseUnifiedTShirtDataProps) {
  const [state, setState] = React.useState<UnifiedTShirtState>({
    volunteers: [],
    sizes: [],
    preferences: {},
    issuances: {},
    allocations: {},
    loading: true,
    saving: {},
  });

  const { toast } = useToast();
  const [supabase] = React.useState(() => createClient());
  const [tshirtService] = React.useState(() =>
    createUnifiedTShirtService({ supabase, eventId, isAdmin })
  );

  // Load initial data
  React.useEffect(() => {
    const loadData = async () => {
      setState(prev => ({ ...prev, loading: true }));

      try {
        // Load sizes using client-side service
        const sizes = await tshirtService.fetchTShirtSizes();

        // Load volunteers and their allocations
        const volunteerIds = volunteersToDisplay.map(v => v.id);
        const allocations: Record<string, number> = {};
        volunteersToDisplay.forEach(v => {
          allocations[v.id] = v.requested_tshirt_quantity || 0;
        });

        // Load T-shirt data (preferences and issuances) using client-side service
        const { preferences, issuances } = await tshirtService.fetchTShirtData(volunteerIds);

        setState(prev => ({
          ...prev,
          volunteers: volunteersToDisplay,
          sizes,
          preferences,
          issuances,
          allocations,
          loading: false,
        }));
      } catch (error) {
        console.error("Error loading T-shirt data:", error);
        toast({
          title: "Error",
          description: "Failed to load T-shirt data.",
          variant: "destructive",
        });
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    if (volunteersToDisplay.length > 0) {
      console.log("useUnifiedTShirtData: Starting data load...");
      loadData();
    } else {
      console.log("useUnifiedTShirtData: No volunteers to display, setting loading to false");
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [eventId, volunteersToDisplay, tshirtService, toast]);

  // Helper functions
  const setSaving = (volunteerId: string, isSaving: boolean) => {
    setState(prev => ({
      ...prev,
      saving: { ...prev.saving, [volunteerId]: isSaving }
    }));
  };

  const refreshData = async () => {
    const volunteerIds = state.volunteers.map(v => v.id);
    const { preferences, issuances } = await tshirtService.fetchTShirtData(volunteerIds);
    setState(prev => ({ ...prev, preferences, issuances }));
  };

  // Action handlers
  const handleAddPreference = async (volunteerId: string, sizeCode: string, quantity: number = 1) => {
    try {
      await tshirtService.addPreference(volunteerId, sizeCode, quantity, toast, setSaving);
      await refreshData();
    } catch (error) {
      // Error already handled in service
    }
  };

  const handleRemovePreference = async (volunteerId: string, sizeCode: string, quantity: number = 1) => {
    try {
      await tshirtService.removePreference(volunteerId, sizeCode, quantity, toast, setSaving);
      await refreshData();
    } catch (error) {
      // Error already handled in service
    }
  };

  const handleIssueTShirt = async (
    volunteerId: string,
    sizeCode: string,
    issuedByProfileId: string,
    quantity: number = 1
  ) => {
    try {
      await tshirtService.issueTShirt(volunteerId, sizeCode, issuedByProfileId, quantity, toast, setSaving);
      await refreshData();
    } catch (error) {
      // Error already handled in service
    }
  };

  const handleReturnTShirt = async (volunteerId: string, sizeCode: string, quantity: number = 1) => {
    try {
      await tshirtService.returnTShirt(volunteerId, sizeCode, quantity, toast, setSaving);
      await refreshData();
    } catch (error) {
      // Error already handled in service
    }
  };

  // Computed values
  const getPreferenceCount = (volunteerId: string, sizeCode: string): number => {
    return state.preferences[volunteerId]?.[sizeCode] || 0;
  };

  const getIssuanceCount = (volunteerId: string, sizeCode: string): number => {
    return state.issuances[volunteerId]?.[sizeCode] || 0;
  };

  const getTotalPreferences = (volunteerId: string): number => {
    const prefs = state.preferences[volunteerId] || {};
    return Object.values(prefs).reduce((sum, count) => sum + count, 0);
  };

  const getTotalIssuances = (volunteerId: string): number => {
    const issues = state.issuances[volunteerId] || {};
    return Object.values(issues).reduce((sum, count) => sum + count, 0);
  };

  const getRemainingAllocation = (volunteerId: string): number => {
    const allocated = state.allocations[volunteerId] || 0;
    const used = isAdmin ? getTotalIssuances(volunteerId) : getTotalPreferences(volunteerId);
    return Math.max(0, allocated - used);
  };

  const canAddMore = (volunteerId: string): boolean => {
    return getRemainingAllocation(volunteerId) > 0;
  };

  // Display sizes (only show sizes with inventory > 0)
  const displaySizes = state.sizes.filter(size => size.quantity > 0);

  return {
    // State
    ...state,
    displaySizes,

    // Actions
    handleAddPreference,
    handleRemovePreference,
    handleIssueTShirt,
    handleReturnTShirt,
    refreshData,

    // Computed values
    getPreferenceCount,
    getIssuanceCount,
    getTotalPreferences,
    getTotalIssuances,
    getRemainingAllocation,
    canAddMore,

    // Service (for advanced usage)
    tshirtService,
  };
}

export type UnifiedTShirtData = ReturnType<typeof useUnifiedTShirtData>;
