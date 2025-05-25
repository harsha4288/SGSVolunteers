"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { createInventoryService } from "../services/inventory-service";
import type { TShirtInventory } from "../types";

interface UseInventoryDataProps {
  eventId: number;
}

interface InventoryState {
  inventory: TShirtInventory[];
  loading: boolean;
  saving: Record<string, boolean>; // sizeCode -> saving state
}

/**
 * Hook for managing T-shirt inventory data
 * Provides CRUD operations and state management for inventory
 */
export function useInventoryData({ eventId }: UseInventoryDataProps) {
  const [state, setState] = React.useState<InventoryState>({
    inventory: [],
    loading: true,
    saving: {},
  });

  const { toast } = useToast();
  const [supabase] = React.useState(() => createClient());
  const [inventoryService] = React.useState(() =>
    createInventoryService({ supabase, eventId })
  );

  // Load inventory data
  const loadInventory = React.useCallback(async () => {
    if (!supabase || !eventId) return;

    setState(prev => ({ ...prev, loading: true }));

    try {
      const inventory = await inventoryService.fetchInventory();
      setState(prev => ({
        ...prev,
        inventory,
        loading: false,
      }));
    } catch (error) {
      console.error("Error loading inventory:", error);
      toast({
        title: "Error",
        description: "Failed to load inventory data",
        variant: "destructive",
      });
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [supabase, eventId, inventoryService, toast]);

  // Load data on mount and when eventId changes
  React.useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  // Set saving state for a specific size
  const setSaving = (sizeCode: string, isSaving: boolean) => {
    setState(prev => ({
      ...prev,
      saving: {
        ...prev.saving,
        [sizeCode]: isSaving,
      },
    }));
  };

  // Update inventory quantity (only initial quantity is editable)
  const updateQuantity = async (
    sizeCode: string,
    newQuantity: number,
    updateType: 'initial' | 'current' = 'initial'
  ) => {
    setSaving(sizeCode, true);

    try {
      await inventoryService.updateInventoryQuantity(sizeCode, newQuantity, updateType);

      // Update local state - only update initial quantity
      setState(prev => ({
        ...prev,
        inventory: prev.inventory.map(item =>
          item.size_cd === sizeCode
            ? {
                ...item,
                quantity: newQuantity,
                // Recalculate quantity_on_hand based on current issuances
                // This will be updated when we refresh from the database
              }
            : item
        ),
      }));

      // Refresh data to get accurate calculated values
      await loadInventory();

      toast({
        title: "Success",
        description: `Initial quantity updated for size ${sizeCode}`,
      });
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update quantity",
        variant: "destructive",
      });
      throw error; // Re-throw for component handling
    } finally {
      setSaving(sizeCode, false);
    }
  };

  // Update size code
  const updateSizeCode = async (oldSizeCode: string, newSizeCode: string) => {
    setSaving(oldSizeCode, true);

    try {
      await inventoryService.updateSizeCode(oldSizeCode, newSizeCode);

      // Reload inventory to get the updated data
      await loadInventory();

      toast({
        title: "Success",
        description: `Size code updated from ${oldSizeCode} to ${newSizeCode}`,
      });
    } catch (error) {
      console.error("Error updating size code:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update size code",
        variant: "destructive",
      });
      throw error;
    } finally {
      setSaving(oldSizeCode, false);
    }
  };

  // Update sort order
  const updateSortOrder = async (sizeCode: string, newSortOrder: number) => {
    setSaving(sizeCode, true);

    try {
      await inventoryService.updateSortOrder(sizeCode, newSortOrder);

      // Update local state
      setState(prev => ({
        ...prev,
        inventory: prev.inventory.map(item =>
          item.size_cd === sizeCode
            ? { ...item, sort_order: newSortOrder }
            : item
        ).sort((a, b) => a.sort_order - b.sort_order), // Re-sort the array
      }));

      toast({
        title: "Success",
        description: `Sort order updated for size ${sizeCode}`,
      });
    } catch (error) {
      console.error("Error updating sort order:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update sort order",
        variant: "destructive",
      });
      throw error;
    } finally {
      setSaving(sizeCode, false);
    }
  };

  // Add new inventory size
  const addSize = async (sizeCode: string, initialQuantity: number) => {
    setSaving(sizeCode, true);

    try {
      // Calculate sort order (next available)
      const maxSortOrder = Math.max(...state.inventory.map(item => item.sort_order), 0);
      const sortOrder = maxSortOrder + 10;

      await inventoryService.addInventorySize(sizeCode, initialQuantity, sortOrder);

      // Reload inventory to get the new item
      await loadInventory();

      toast({
        title: "Success",
        description: `Size ${sizeCode} added to inventory`,
      });
    } catch (error) {
      console.error("Error adding size:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add size",
        variant: "destructive",
      });
      throw error;
    } finally {
      setSaving(sizeCode, false);
    }
  };

  // Remove inventory size
  const removeSize = async (sizeCode: string) => {
    setSaving(sizeCode, true);

    try {
      await inventoryService.removeInventorySize(sizeCode);

      // Update local state
      setState(prev => ({
        ...prev,
        inventory: prev.inventory.filter(item => item.size_cd !== sizeCode),
      }));

      toast({
        title: "Success",
        description: `Size ${sizeCode} removed from inventory`,
      });
    } catch (error) {
      console.error("Error removing size:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove size",
        variant: "destructive",
      });
      throw error;
    } finally {
      setSaving(sizeCode, false);
    }
  };

  // Refresh inventory data
  const refreshInventory = () => {
    loadInventory();
  };

  return {
    // State
    inventory: state.inventory,
    loading: state.loading,
    saving: state.saving,

    // Actions
    updateQuantity,
    updateSizeCode,
    updateSortOrder,
    addSize,
    removeSize,
    refreshInventory,

    // Utilities
    getSaving: (sizeCode: string) => state.saving[sizeCode] || false,
  };
}

export type InventoryData = ReturnType<typeof useInventoryData>;
