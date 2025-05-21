"use client";

import * as React from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";
import type { TShirtSize, TShirtInventoryItem } from "../types";

interface UseTShirtInventoryProps {
  supabase: SupabaseClient<Database>;
  eventId: number;
  tshirtSizes: TShirtSize[];
}

/**
 * Hook to manage T-shirt inventory data
 */
export function useTShirtInventory({
  supabase,
  eventId,
  tshirtSizes,
}: UseTShirtInventoryProps) {
  const [tshirtInventory, setTshirtInventory] = React.useState<TShirtInventoryItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch inventory data
  const fetchInventory = React.useCallback(async () => {
    if (!supabase || !eventId) return;
    
    setLoading(true);
    setError(null);

    try {
      // First, let's check if the tshirt_inventory table exists
      const { data: tableInfo, error: tableError } = await supabase
        .from('tshirt_inventory')
        .select('id')
        .limit(1);

      if (tableError) {
        console.error("Error checking tshirt_inventory table:", tableError);
        setLoading(false);
        setError("Error checking inventory table");
        return;
      }

      // Now fetch the actual inventory data
      const { data, error } = await supabase
        .from('tshirt_inventory')
        .select(`
          id,
          tshirt_size_id,
          quantity_initial,
          quantity,
          quantity_on_hand,
          tshirt_sizes (
            id,
            size_name,
            sort_order
          )
        `)
        .eq('event_id', eventId);

      if (error) {
        console.error("Error fetching inventory:", error);
        setLoading(false);
        setError("Error fetching inventory data");
        return;
      }

      if (!data || data.length === 0) {
        console.log("No inventory data found");
        
        // If no inventory exists, create default inventory
        if (tshirtSizes && tshirtSizes.length > 0) {
          await createDefaultInventory(tshirtSizes);
        } else {
          setLoading(false);
          setError("No T-shirt sizes available to create inventory");
        }
        return;
      }

      setTshirtInventory(data);
    } catch (err) {
      console.error("Error in fetchInventory:", err);
      setError("An error occurred while fetching inventory");
    } finally {
      setLoading(false);
    }
  }, [supabase, eventId, tshirtSizes]);

  // Create default inventory for all sizes
  const createDefaultInventory = async (sizes: TShirtSize[]) => {
    if (!supabase || !eventId || !sizes || sizes.length === 0) return;

    try {
      const inventoryItems = sizes.map(size => ({
        event_id: eventId,
        tshirt_size_id: size.id,
        size: size.size_name,
        quantity_initial: 50, // Default initial quantity
        quantity: 50, // Default available quantity
        quantity_on_hand: 50 // Default on-hand quantity
      }));

      const { data, error } = await supabase
        .from('tshirt_inventory')
        .insert(inventoryItems)
        .select();

      if (error) {
        console.error("Error creating default inventory:", error);
        setError("Error creating default inventory");
        return;
      }

      console.log("Created default inventory:", data);
      
      // Fetch the inventory again to get the joined data
      fetchInventory();
    } catch (err) {
      console.error("Error in createDefaultInventory:", err);
      setError("An error occurred while creating default inventory");
    }
  };

  // Update inventory quantity
  const updateInventoryQuantity = async (
    inventoryId: number, 
    newQuantity: number,
    newOnHandQuantity?: number
  ) => {
    if (!supabase) return false;

    try {
      const updateData: any = { quantity: newQuantity };
      
      // Only include quantity_on_hand if it's provided
      if (newOnHandQuantity !== undefined) {
        updateData.quantity_on_hand = newOnHandQuantity;
      }

      const { error } = await supabase
        .from('tshirt_inventory')
        .update(updateData)
        .eq('id', inventoryId);

      if (error) {
        console.error("Error updating inventory quantity:", error);
        return false;
      }

      // Update local state
      setTshirtInventory(prev => 
        prev.map(item => 
          item.id === inventoryId 
            ? { 
                ...item, 
                quantity: newQuantity,
                ...(newOnHandQuantity !== undefined ? { quantity_on_hand: newOnHandQuantity } : {})
              } 
            : item
        )
      );

      return true;
    } catch (err) {
      console.error("Error in updateInventoryQuantity:", err);
      return false;
    }
  };

  // Fetch inventory on mount and when dependencies change
  React.useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  return {
    tshirtInventory,
    loading,
    error,
    fetchInventory,
    updateInventoryQuantity
  };
}
