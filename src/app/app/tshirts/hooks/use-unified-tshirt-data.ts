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
  eventSettings: { default_tshirt_allocation: number } | null; // Added eventSettings prop
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
  eventSettings, // Destructure eventSettings
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
    createUnifiedTShirtService({ supabase, eventId })
  );

  // Load initial data - use ref to prevent unnecessary reloads
  const volunteersRef = React.useRef<string>('');
  const loadDataRef = React.useRef(false);

  React.useEffect(() => {
    const volunteerKey = volunteersToDisplay.map(v => v.id).sort().join(',');

    // Only reload if volunteers actually changed or first load
    if (volunteerKey !== volunteersRef.current || !loadDataRef.current) {
      volunteersRef.current = volunteerKey;
      loadDataRef.current = true;

      const loadData = async () => {
        setState(prev => ({ ...prev, loading: true }));

        try {
          // Load sizes using client-side service
          const sizes = await tshirtService.fetchTShirtSizes();

          // Load volunteers and their allocations
          const volunteerIds = volunteersToDisplay.map(v => v.id);
          const allocations: Record<string, number> = {};
          volunteersToDisplay.forEach(v => {
            allocations[v.id] = v.requested_tshirt_quantity || eventSettings?.default_tshirt_allocation || 0;
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
        loadData();
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    }
  }, [eventId, volunteersToDisplay, tshirtService, toast]);

  // Helper functions
  const setSaving = (volunteerId: string, isSaving: boolean) => {
    setState(prev => ({
      ...prev,
      saving: { ...prev.saving, [volunteerId]: isSaving }
    }));
  };

  // Refresh inventory only (lighter than full refresh)
  const refreshInventory = async () => {
    try {
      const sizes = await tshirtService.fetchTShirtSizes();
      setState(prev => ({ ...prev, sizes }));
    } catch (error) {
      console.error("Error refreshing inventory:", error);
    }
  };

  const refreshData = async () => {
    const volunteerIds = state.volunteers.map(v => v.id);
    const { preferences, issuances } = await tshirtService.fetchTShirtData(volunteerIds);
    setState(prev => ({ ...prev, preferences, issuances }));
  };

  // Action handlers
  const handleAddPreference = async (volunteerId: string, sizeCode: string, quantity: number = 1, allowOverride: boolean = false) => {
    // Frontend validation first - check allocation limits before DB call
    const volunteer = state.volunteers.find(v => v.id === volunteerId);
    const effectiveAllocation = volunteer?.requested_tshirt_quantity || eventSettings?.default_tshirt_allocation || 0;

    if (!allowOverride) {
      const currentTotal = getTotalPreferences(volunteerId);
      const newTotal = currentTotal + quantity;

      if (newTotal > effectiveAllocation) {
        if (isAdmin) {
          // Show admin override dialog
          const volunteerName = volunteer ? `${volunteer.first_name} ${volunteer.last_name}` : 'this volunteer';

          const confirmed = window.confirm(
            `⚠️ ALLOCATION LIMIT EXCEEDED\n\n` +
            `Volunteer: ${volunteerName}\n` +
            `Allocation Limit: ${effectiveAllocation}\n` +
            `Current Total: ${currentTotal}\n` +
            `Attempting to add: ${quantity} ${sizeCode} T-shirt(s)\n` +
            `New Total: ${newTotal}\n\n` +
            `This will exceed the volunteer's allocation limit.\n\n` +
            `Do you want to proceed anyway?`
          );

          if (!confirmed) {
            return; // Admin chose not to override
          }
          allowOverride = true; // Set override for DB call
        } else {
          // Hard stop for volunteers - show toast and return
          toast({
            title: "Allocation Limit Exceeded",
            description: `Cannot add ${quantity} T-shirt(s). This would exceed your allocation limit (${effectiveAllocation}).`,
            variant: "destructive",
          });
          return;
        }
      }
    }

      if (newTotal > allocation) {
        if (isAdmin) {
          // Show admin override dialog
          const volunteerName = volunteer ? `${volunteer.first_name} ${volunteer.last_name}` : 'this volunteer';

          const confirmed = window.confirm(
            `⚠️ ALLOCATION LIMIT EXCEEDED\n\n` +
            `Volunteer: ${volunteerName}\n` +
            `Allocation Limit: ${allocation}\n` +
            `Current Total: ${currentTotal}\n` +
            `Attempting to add: ${quantity} ${sizeCode} T-shirt(s)\n` +
            `New Total: ${newTotal}\n\n` +
            `This will exceed the volunteer's allocation limit.\n\n` +
            `Do you want to proceed anyway?`
          );

          if (!confirmed) {
            return; // Admin chose not to override
          }
          allowOverride = true; // Set override for DB call
        } else {
          // Hard stop for volunteers - show toast and return
          toast({
            title: "Allocation Limit Exceeded",
            description: `Cannot add ${quantity} T-shirt(s). This would exceed your allocation limit (${allocation}).`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    try {
      await tshirtService.addPreference(volunteerId, sizeCode, quantity, toast, setSaving, allowOverride);
      await refreshData();
    } catch (error: any) {
      // Since we validate frontend first, only show non-allocation errors
      const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
      if (!errorMessage.includes('Allocation limit exceeded')) {
        // Error already handled in service for non-allocation errors
      }
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
    quantity: number = 1,
    allowOverride: boolean = false
  ) => {
    // Frontend validation first - check allocation limits before DB call
    const volunteer = state.volunteers.find(v => v.id === volunteerId);
    const effectiveAllocation = volunteer?.requested_tshirt_quantity || eventSettings?.default_tshirt_allocation || 0;

    if (!allowOverride) {
      const currentTotal = getTotalIssuances(volunteerId);
      const newTotal = currentTotal + quantity;

      if (newTotal > effectiveAllocation) {
        if (isAdmin) {
          // Show admin override dialog
          const volunteerName = volunteer ? `${volunteer.first_name} ${volunteer.last_name}` : 'this volunteer';

          const confirmed = window.confirm(
            `⚠️ ALLOCATION LIMIT EXCEEDED\n\n` +
            `Volunteer: ${volunteerName}\n` +
            `Allocation Limit: ${effectiveAllocation}\n` +
            `Current Total: ${currentTotal}\n` +
            `Attempting to issue: ${quantity} ${sizeCode} T-shirt(s)\n` +
            `New Total: ${newTotal}\n\n` +
            `This will exceed the volunteer's allocation limit.\n\n` +
            `Do you want to proceed anyway?`
          );

          if (!confirmed) {
            return; // Admin chose not to override
          }
          allowOverride = true; // Set override for DB call
        } else {
          // This shouldn't happen for issuances since only admins can issue
          toast({
            title: "Allocation Limit Exceeded",
            description: `Cannot issue ${quantity} T-shirt(s). This would exceed allocation limit (${effectiveAllocation}).`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    try {
      await tshirtService.issueTShirt(volunteerId, sizeCode, issuedByProfileId, quantity, toast, setSaving, allowOverride);
      // Refresh both data and inventory since issuances affect inventory counts
      await Promise.all([refreshData(), refreshInventory()]);
    } catch (error: any) {
      // Since we validate frontend first, only show non-allocation errors
      const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
      if (!errorMessage.includes('Allocation limit exceeded')) {
        // Error already handled in service for non-allocation errors
      }
    }
  };

  const handleReturnTShirt = async (volunteerId: string, sizeCode: string, quantity: number = 1) => {
    try {
      await tshirtService.returnTShirt(volunteerId, sizeCode, quantity, toast, setSaving);
      // Refresh both data and inventory since returns affect inventory counts
      await Promise.all([refreshData(), refreshInventory()]);
    } catch (error) {
      // Error already handled in service
    }
  };

  const handleSetQuantity = async (
    volunteerId: string,
    sizeCode: string,
    newQuantity: number,
    issuedByProfileId?: string,
    allowOverride: boolean = false
  ) => {
    const currentQuantity = isAdmin ? getIssuanceCount(volunteerId, sizeCode) : getPreferenceCount(volunteerId, sizeCode);

    if (newQuantity === currentQuantity) {
      return; // No change needed
    }

    // Frontend validation first - check allocation limits before DB call
    const volunteer = state.volunteers.find(v => v.id === volunteerId);
    const effectiveAllocation = volunteer?.requested_tshirt_quantity || eventSettings?.default_tshirt_allocation || 0;

    if (!allowOverride && newQuantity > currentQuantity) {
      const currentTotal = isAdmin ? getTotalIssuances(volunteerId) : getTotalPreferences(volunteerId);
      const currentSizeQuantity = isAdmin ? getIssuanceCount(volunteerId, sizeCode) : getPreferenceCount(volunteerId, sizeCode);
      const newTotal = currentTotal - currentSizeQuantity + newQuantity;

      if (newTotal > effectiveAllocation) {
        if (isAdmin) {
          // Show admin override dialog
          const volunteerName = volunteer ? `${volunteer.first_name} ${volunteer.last_name}` : 'this volunteer';

          const confirmed = window.confirm(
            `⚠️ ALLOCATION LIMIT EXCEEDED\n\n` +
            `Volunteer: ${volunteerName}\n` +
            `Allocation Limit: ${effectiveAllocation}\n` +
            `Current Total: ${currentTotal}\n` +
            `Attempting to set ${sizeCode} to: ${newQuantity}\n` +
            `New Total: ${newTotal}\n\n` +
            `This will exceed the volunteer's allocation limit.\n\n` +
            `Do you want to proceed anyway?`
          );

          if (!confirmed) {
            return; // Admin chose not to override
          }
          allowOverride = true; // Set override for DB call
        } else {
          // Hard stop for volunteers - show toast and return
          toast({
            title: "Allocation Limit Exceeded",
            description: `Cannot set quantity to ${newQuantity}. This would exceed your T-shirt allocation limit (${effectiveAllocation}).`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    setSaving(volunteerId, true);

    try {
      if (newQuantity === 0) {
        // Remove all quantities
        const removeQuantity = currentQuantity;
        if (isAdmin) {
          await tshirtService.returnTShirt(volunteerId, sizeCode, removeQuantity, toast, setSaving);
        } else {
          await tshirtService.removePreference(volunteerId, sizeCode, removeQuantity, toast, setSaving);
        }
      } else if (newQuantity > currentQuantity) {
        // Add the difference
        const addQuantity = newQuantity - currentQuantity;
        if (isAdmin && issuedByProfileId) {
          await tshirtService.issueTShirt(volunteerId, sizeCode, issuedByProfileId, addQuantity, toast, setSaving, allowOverride);
        } else {
          await tshirtService.addPreference(volunteerId, sizeCode, addQuantity, toast, setSaving, allowOverride);
        }
      } else {
        // Remove the difference
        const removeQuantity = currentQuantity - newQuantity;
        if (isAdmin) {
          await tshirtService.returnTShirt(volunteerId, sizeCode, removeQuantity, toast, setSaving);
        } else {
          await tshirtService.removePreference(volunteerId, sizeCode, removeQuantity, toast, setSaving);
        }
      }

      // Refresh data and inventory
      await Promise.all([refreshData(), refreshInventory()]);
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
      console.error("Error setting quantity:", errorMessage);

      // Since we handle allocation validation in frontend, DB allocation errors should be rare
      // Only show toast for non-allocation errors since allocation is handled above
      if (!errorMessage.includes('Allocation limit exceeded')) {
        toast({
          title: "Error",
          description: `Failed to update quantity: ${errorMessage}`,
          variant: "destructive",
        });
      } else {
        // This should rarely happen since we validate frontend first
        console.warn("DB allocation error despite frontend validation:", errorMessage);
      }
    } finally {
      setSaving(volunteerId, false);
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
    // Use effective allocation for this calculation
    const volunteer = state.volunteers.find(v => v.id === volunteerId);
    const allocated = volunteer?.requested_tshirt_quantity || eventSettings?.default_tshirt_allocation || 0;
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
    handleSetQuantity,
    refreshData,
    refreshInventory,

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
