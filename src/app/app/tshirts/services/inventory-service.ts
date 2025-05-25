"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";
import type { TShirtInventory } from "../types";

interface InventoryServiceProps {
  supabase: SupabaseClient<Database>;
  eventId: number;
}

/**
 * Service for managing T-shirt inventory operations
 * Provides CRUD operations for inventory management
 */
export function createInventoryService({
  supabase,
  eventId,
}: InventoryServiceProps) {

  /**
   * Fetch all T-shirt inventory for the current event
   */
  const fetchInventory = async (): Promise<TShirtInventory[]> => {
    if (!supabase) throw new Error("Supabase client not available");

    const { data, error } = await supabase
      .from('tshirt_inventory')
      .select('*')
      .eq('event_id', eventId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error("Error fetching inventory:", error);
      throw new Error(`Failed to fetch inventory: ${error.message}`);
    }

    return data.map(item => ({
      size_cd: item.size_cd,
      size_name: item.size_cd, // Using size_cd as display name for consistency
      sort_order: item.sort_order,
      quantity: item.quantity,
      quantity_on_hand: item.quantity_on_hand,
    }));
  };

  /**
   * Update inventory quantity for a specific size
   * Note: Only 'initial' quantity should be editable, 'current' is calculated
   */
  const updateInventoryQuantity = async (
    sizeCode: string,
    newQuantity: number,
    updateType: 'initial' | 'current' = 'initial'
  ): Promise<void> => {
    if (!supabase) throw new Error("Supabase client not available");

    // Only allow updating initial quantity - current stock is calculated
    if (updateType !== 'initial') {
      throw new Error("Current stock is calculated and cannot be edited directly");
    }

    const { error } = await supabase
      .from('tshirt_inventory')
      .update({
        quantity: newQuantity,
        updated_at: new Date().toISOString()
      })
      .eq('event_id', eventId)
      .eq('size_cd', sizeCode);

    if (error) {
      console.error("Error updating initial quantity:", error);
      throw new Error(`Failed to update initial quantity: ${error.message}`);
    }
  };

  /**
   * Update size code for a specific inventory item
   * Only allowed if no T-shirts have been issued for this size
   */
  const updateSizeCode = async (
    oldSizeCode: string,
    newSizeCode: string
  ): Promise<void> => {
    if (!supabase) throw new Error("Supabase client not available");

    // Check if any T-shirts have been issued for this size
    const { data: issuedCount, error: checkError } = await supabase
      .from('volunteer_tshirts')
      .select('id', { count: 'exact' })
      .eq('event_id', eventId)
      .eq('size', oldSizeCode)
      .eq('status', 'issued');

    if (checkError) {
      console.error("Error checking issued T-shirts:", checkError);
      throw new Error(`Failed to check issued T-shirts: ${checkError.message}`);
    }

    if (issuedCount && issuedCount > 0) {
      throw new Error(`Cannot change size code: ${issuedCount} T-shirts have been issued for size ${oldSizeCode}`);
    }

    // Update the size code
    const { error } = await supabase
      .from('tshirt_inventory')
      .update({
        size_cd: newSizeCode.toUpperCase(),
        updated_at: new Date().toISOString()
      })
      .eq('event_id', eventId)
      .eq('size_cd', oldSizeCode);

    if (error) {
      console.error("Error updating size code:", error);
      throw new Error(`Failed to update size code: ${error.message}`);
    }
  };

  /**
   * Update sort order for a specific size
   */
  const updateSortOrder = async (
    sizeCode: string,
    newSortOrder: number
  ): Promise<void> => {
    if (!supabase) throw new Error("Supabase client not available");

    const { error } = await supabase
      .from('tshirt_inventory')
      .update({
        sort_order: newSortOrder,
        updated_at: new Date().toISOString()
      })
      .eq('event_id', eventId)
      .eq('size_cd', sizeCode);

    if (error) {
      console.error("Error updating sort order:", error);
      throw new Error(`Failed to update sort order: ${error.message}`);
    }
  };

  /**
   * Add a new T-shirt size to inventory
   */
  const addInventorySize = async (
    sizeCode: string,
    initialQuantity: number,
    sortOrder: number
  ): Promise<void> => {
    if (!supabase) throw new Error("Supabase client not available");

    const { error } = await supabase
      .from('tshirt_inventory')
      .insert({
        event_id: eventId,
        size_cd: sizeCode,
        quantity: initialQuantity,
        quantity_on_hand: initialQuantity,
        sort_order: sortOrder,
      });

    if (error) {
      console.error("Error adding inventory size:", error);
      throw new Error(`Failed to add size: ${error.message}`);
    }
  };

  /**
   * Remove a T-shirt size from inventory
   * Only allowed if no T-shirts have been issued for this size
   */
  const removeInventorySize = async (sizeCode: string): Promise<void> => {
    if (!supabase) throw new Error("Supabase client not available");

    // Check if any T-shirts have been issued for this size
    const { data: issuedCount, error: checkError } = await supabase
      .from('volunteer_tshirts')
      .select('id', { count: 'exact' })
      .eq('event_id', eventId)
      .eq('size', sizeCode)
      .eq('status', 'issued');

    if (checkError) {
      console.error("Error checking issued T-shirts:", checkError);
      throw new Error(`Failed to check issued T-shirts: ${checkError.message}`);
    }

    if (issuedCount && issuedCount > 0) {
      throw new Error(`Cannot remove size ${sizeCode}: ${issuedCount} T-shirts have been issued`);
    }

    const { error } = await supabase
      .from('tshirt_inventory')
      .delete()
      .eq('event_id', eventId)
      .eq('size_cd', sizeCode);

    if (error) {
      console.error("Error removing inventory size:", error);
      throw new Error(`Failed to remove size: ${error.message}`);
    }
  };

  return {
    fetchInventory,
    updateInventoryQuantity,
    updateSizeCode,
    updateSortOrder,
    addInventorySize,
    removeInventorySize,
  };
}
