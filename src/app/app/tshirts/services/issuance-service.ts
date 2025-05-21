"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";
import type { TShirtSize } from "../types";
import type { ToastType } from "@/hooks/use-toast";

interface IssuanceServiceProps {
  supabase: SupabaseClient<Database>;
  eventId: number;
  profileId: string;
  isAdmin: boolean;
}

/**
 * Service for managing T-shirt issuances
 */
export function createIssuanceService({
  supabase,
  eventId,
  profileId,
  isAdmin,
}: IssuanceServiceProps) {
  /**
   * Issue a T-shirt to a volunteer
   */
  const issueTShirt = async (
    volunteerId: string,
    size: string,
    sizeId: number,
    quantity: number = 1,
    toast: ToastType,
    setSaving: (volunteerId: string, isSaving: boolean) => void
  ) => {
    if (!isAdmin || !supabase) return false;
    
    setSaving(volunteerId, true);
    
    try {
      // Check inventory
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('tshirt_inventory')
        .select('id, quantity, quantity_on_hand')
        .eq('tshirt_size_id', sizeId)
        .eq('event_id', eventId)
        .single();

      if (inventoryError) throw inventoryError;

      if (!inventoryData || inventoryData.quantity < quantity) {
        throw new Error(`Only ${inventoryData?.quantity || 0} T-shirts available for size ${size}, but tried to issue ${quantity}`);
      }

      // Update inventory
      const { error: updateError } = await supabase
        .from('tshirt_inventory')
        .update({
          quantity: inventoryData.quantity - quantity,
          quantity_on_hand: (inventoryData.quantity_on_hand || inventoryData.quantity) - quantity
        })
        .eq('id', inventoryData.id);

      if (updateError) throw updateError;

      // Record issuance in the database
      const insertData = {
        volunteer_id: volunteerId,
        tshirt_inventory_id: inventoryData.id,
        issued_by_profile_id: profileId,
        size: size,
        quantity: quantity,
        event_id: eventId
      };

      const { error: insertError } = await supabase
        .from('tshirt_issuances')
        .insert(insertData);

      if (insertError) throw insertError;

      // Update preference if it exists
      const { data: prefData, error: prefError } = await supabase
        .from('volunteer_tshirt_preferences')
        .select('id')
        .eq('volunteer_id', volunteerId)
        .eq('event_id', eventId)
        .eq('tshirt_size_id', sizeId)
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

      toast({
        title: "Success",
        description: quantity === 1
          ? `T-shirt (size ${size}) issued successfully.`
          : `${quantity} T-shirts (size ${size}) issued successfully.`,
      });

      return true;
    } catch (error: any) {
      console.error("Error issuing T-shirt:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to issue T-shirt.",
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(volunteerId, false);
    }
  };

  /**
   * Return a T-shirt from a volunteer
   */
  const returnTShirt = async (
    volunteerId: string,
    size: string,
    sizeId: number,
    toast: ToastType,
    setSaving: (volunteerId: string, isSaving: boolean) => void
  ) => {
    if (!isAdmin || !supabase) return false;
    
    setSaving(volunteerId, true);
    
    try {
      // Check inventory
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('tshirt_inventory')
        .select('id, quantity, quantity_on_hand')
        .eq('tshirt_size_id', sizeId)
        .eq('event_id', eventId)
        .single();

      if (inventoryError) throw inventoryError;

      // Update inventory (increment quantity)
      const { error: updateError } = await supabase
        .from('tshirt_inventory')
        .update({
          quantity: (inventoryData?.quantity || 0) + 1,
          quantity_on_hand: (inventoryData?.quantity_on_hand || 0) + 1
        })
        .eq('id', inventoryData.id);

      if (updateError) throw updateError;

      // Find the issuance to delete
      const { data: issuanceData, error: findError } = await supabase
        .from('tshirt_issuances')
        .select('id')
        .eq('volunteer_id', volunteerId)
        .eq('size', size)
        .order('id', { ascending: false })
        .limit(1);

      if (findError) throw findError;

      if (!issuanceData || issuanceData.length === 0) {
        throw new Error(`No issuance found to delete for volunteer ${volunteerId}`);
      }

      // Delete the issuance
      const { error: deleteError } = await supabase
        .from('tshirt_issuances')
        .delete()
        .eq('id', issuanceData[0].id);

      if (deleteError) throw deleteError;

      toast({
        title: "Success",
        description: `T-shirt (size ${size}) returned successfully.`,
      });

      return true;
    } catch (error: any) {
      console.error("Error returning T-shirt:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to return T-shirt.",
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(volunteerId, false);
    }
  };

  /**
   * Fetch all issuances for a volunteer
   */
  const fetchIssuances = async (volunteerId: string) => {
    if (!supabase) return [];
    
    try {
      const { data, error } = await supabase
        .from('tshirt_issuances')
        .select(`
          id,
          volunteer_id,
          size,
          quantity,
          tshirt_inventory_id,
          created_at
        `)
        .eq('volunteer_id', volunteerId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching issuances:", error);
      return [];
    }
  };

  return {
    issueTShirt,
    returnTShirt,
    fetchIssuances
  };
}
