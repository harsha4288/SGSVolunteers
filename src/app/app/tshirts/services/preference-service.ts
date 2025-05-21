"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";
import type { TShirtSize } from "../types";
import type { ToastType } from "@/hooks/use-toast";

interface PreferenceServiceProps {
  supabase: SupabaseClient<Database>;
  eventId: number;
  isAdmin: boolean;
}

/**
 * Service for managing T-shirt preferences
 */
export function createPreferenceService({
  supabase,
  eventId,
  isAdmin,
}: PreferenceServiceProps) {
  /**
   * Add a T-shirt preference for a volunteer
   */
  const addPreference = async (
    volunteerId: string,
    sizeId: number,
    toast: ToastType,
    setSaving: (volunteerId: string, isSaving: boolean) => void
  ) => {
    if (!supabase) return null;
    
    setSaving(volunteerId, true);
    
    try {
      // Check if preference already exists
      const { data: existingPref, error: existingError } = await supabase
        .from('volunteer_tshirt_preferences')
        .select('id, quantity')
        .eq('volunteer_id', volunteerId)
        .eq('event_id', eventId)
        .eq('tshirt_size_id', sizeId)
        .single();

      if (existingError && existingError.code !== 'PGRST116') {
        throw existingError;
      }

      if (existingPref) {
        // If preference exists, increment the quantity
        const newQuantity = (existingPref.quantity || 1) + 1;

        const { data, error } = await supabase
          .from('volunteer_tshirt_preferences')
          .update({
            quantity: newQuantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPref.id)
          .select();

        if (error) throw error;
        return data?.[0] || null;
      } else {
        // If preference doesn't exist, insert a new one
        const { data, error } = await supabase
          .from('volunteer_tshirt_preferences')
          .insert({
            volunteer_id: volunteerId,
            event_id: eventId,
            tshirt_size_id: sizeId,
            quantity: 1,
            is_fulfilled: false
          })
          .select();

        if (error) throw error;
        return data?.[0] || null;
      }
    } catch (error: any) {
      console.error("Error adding preference:", error);
      toast({
        title: "Error",
        description: `Failed to add preference: ${error.message}`,
        variant: "destructive",
      });
      return null;
    } finally {
      setSaving(volunteerId, false);
    }
  };

  /**
   * Remove a T-shirt preference for a volunteer
   */
  const removePreference = async (
    volunteerId: string,
    sizeId: number,
    toast: ToastType,
    setSaving: (volunteerId: string, isSaving: boolean) => void
  ) => {
    if (!supabase) return false;
    
    setSaving(volunteerId, true);
    
    try {
      // Check if preference exists
      const { data: existingPref, error: existingError } = await supabase
        .from('volunteer_tshirt_preferences')
        .select('id, quantity')
        .eq('volunteer_id', volunteerId)
        .eq('event_id', eventId)
        .eq('tshirt_size_id', sizeId)
        .single();

      if (existingError && existingError.code !== 'PGRST116') {
        throw existingError;
      }

      if (!existingPref) {
        // No preference found
        return false;
      }

      const currentQuantity = existingPref.quantity || 1;

      if (currentQuantity > 1) {
        // If quantity > 1, decrement the quantity
        const { error } = await supabase
          .from('volunteer_tshirt_preferences')
          .update({
            quantity: currentQuantity - 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPref.id);

        if (error) throw error;
      } else {
        // If quantity is 1, remove the preference
        const { error } = await supabase
          .from('volunteer_tshirt_preferences')
          .delete()
          .eq('id', existingPref.id);

        if (error) throw error;
      }

      return true;
    } catch (error: any) {
      console.error("Error removing preference:", error);
      toast({
        title: "Error",
        description: `Failed to remove preference: ${error.message}`,
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(volunteerId, false);
    }
  };

  /**
   * Fetch all preferences for a volunteer
   */
  const fetchPreferences = async (volunteerId: string) => {
    if (!supabase) return [];
    
    try {
      const { data, error } = await supabase
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

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching preferences:", error);
      return [];
    }
  };

  return {
    addPreference,
    removePreference,
    fetchPreferences
  };
}
