"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";
import type { ToastType } from "@/hooks/use-toast";

interface UnifiedTShirtServiceProps {
  supabase: SupabaseClient<Database>;
  eventId: number;
  isAdmin: boolean;
}

/**
 * Unified service for managing T-shirt preferences and issuances
 * This service uses the same underlying functions for both operations
 */
export function createUnifiedTShirtService({
  supabase,
  eventId,
  isAdmin,
}: UnifiedTShirtServiceProps) {

  /**
   * Add or update a T-shirt record (preference or issuance)
   */
  const manageTShirt = async (
    volunteerId: string,
    sizeCode: string,
    status: 'preferred' | 'issued',
    quantity: number = 1,
    issuedByProfileId?: string,
    toast?: ToastType,
    setSaving?: (volunteerId: string, isSaving: boolean) => void
  ) => {
    if (!supabase) return null;

    setSaving?.(volunteerId, true);

    try {
      // Use the appropriate convenience function based on status
      let data, error;

      if (status === 'preferred') {
        ({ data, error } = await supabase.rpc('add_tshirt_preference', {
          p_volunteer_id: volunteerId,
          p_event_id: eventId,
          p_size_cd: sizeCode,
          p_quantity: quantity,
        }));
      } else if (status === 'issued') {
        ({ data, error } = await supabase.rpc('issue_tshirt', {
          p_volunteer_id: volunteerId,
          p_event_id: eventId,
          p_size_cd: sizeCode,
          p_issued_by_profile_id: issuedByProfileId,
          p_quantity: quantity,
        }));
      } else {
        throw new Error(`Invalid status: ${status}`);
      }

      if (error) {
        console.error(`Database error for ${status}:`, error);
        throw error;
      }

      toast?.({
        title: "Success",
        description: `T-shirt ${status === 'preferred' ? 'preference' : 'issuance'} ${quantity > 1 ? `(${quantity})` : ''} added successfully.`,
        variant: "default",
      });

      return data;
    } catch (error: any) {
      console.error(`Error managing T-shirt ${status}:`, error);
      toast?.({
        title: "Error",
        description: `Failed to add ${status === 'preferred' ? 'preference' : 'issuance'}: ${error.message}`,
        variant: "destructive",
      });
      throw error;
    } finally {
      setSaving?.(volunteerId, false);
    }
  };

  /**
   * Remove or reduce a T-shirt record (preference or issuance)
   */
  const removeTShirt = async (
    volunteerId: string,
    sizeCode: string,
    status: 'preferred' | 'issued',
    quantity: number = 1,
    toast?: ToastType,
    setSaving?: (volunteerId: string, isSaving: boolean) => void
  ) => {
    if (!supabase) return false;

    setSaving?.(volunteerId, true);

    try {
      // Use the appropriate convenience function based on status
      let data, error;

      if (status === 'preferred') {
        ({ data, error } = await supabase.rpc('remove_tshirt_preference', {
          p_volunteer_id: volunteerId,
          p_event_id: eventId,
          p_size_cd: sizeCode,
          p_quantity: quantity,
        }));
      } else if (status === 'issued') {
        ({ data, error } = await supabase.rpc('return_tshirt', {
          p_volunteer_id: volunteerId,
          p_event_id: eventId,
          p_size_cd: sizeCode,
          p_quantity: quantity,
        }));
      } else {
        throw new Error(`Invalid status: ${status}`);
      }

      if (error) {
        console.error(`Database error removing ${status}:`, error);
        throw error;
      }

      toast?.({
        title: "Success",
        description: `T-shirt ${status === 'preferred' ? 'preference' : 'issuance'} ${quantity > 1 ? `(${quantity})` : ''} removed successfully.`,
        variant: "default",
      });

      return data;
    } catch (error: any) {
      console.error(`Error removing T-shirt ${status}:`, error);
      toast?.({
        title: "Error",
        description: `Failed to remove ${status === 'preferred' ? 'preference' : 'issuance'}: ${error.message}`,
        variant: "destructive",
      });
      throw error;
    } finally {
      setSaving?.(volunteerId, false);
    }
  };

  /**
   * Convenience method for adding preferences
   */
  const addPreference = (
    volunteerId: string,
    sizeCode: string,
    quantity: number = 1,
    toast?: ToastType,
    setSaving?: (volunteerId: string, isSaving: boolean) => void
  ) => manageTShirt(volunteerId, sizeCode, 'preferred', quantity, undefined, toast, setSaving);

  /**
   * Convenience method for issuing T-shirts
   */
  const issueTShirt = (
    volunteerId: string,
    sizeCode: string,
    issuedByProfileId: string,
    quantity: number = 1,
    toast?: ToastType,
    setSaving?: (volunteerId: string, isSaving: boolean) => void
  ) => manageTShirt(volunteerId, sizeCode, 'issued', quantity, issuedByProfileId, toast, setSaving);

  /**
   * Convenience method for removing preferences
   */
  const removePreference = (
    volunteerId: string,
    sizeCode: string,
    quantity: number = 1,
    toast?: ToastType,
    setSaving?: (volunteerId: string, isSaving: boolean) => void
  ) => removeTShirt(volunteerId, sizeCode, 'preferred', quantity, toast, setSaving);

  /**
   * Convenience method for returning T-shirts
   */
  const returnTShirt = (
    volunteerId: string,
    sizeCode: string,
    quantity: number = 1,
    toast?: ToastType,
    setSaving?: (volunteerId: string, isSaving: boolean) => void
  ) => removeTShirt(volunteerId, sizeCode, 'issued', quantity, toast, setSaving);

  /**
   * Fetch all T-shirt data for volunteers (both preferences and issuances)
   */
  const fetchTShirtData = async (volunteerIds: string[]) => {
    if (!supabase || volunteerIds.length === 0) return { preferences: {}, issuances: {} };

    try {
      const { data, error } = await supabase
        .from('volunteer_tshirts')
        .select(`
          id,
          volunteer_id,
          size,
          status,
          quantity,
          issued_by_profile_id,
          issued_at,
          created_at
        `)
        .in('volunteer_id', volunteerIds)
        .eq('event_id', eventId)
        .in('status', ['preferred', 'issued']);

      if (error) {
        console.error("Database error fetching T-shirt data:", error);
        throw error;
      }

      // Separate preferences and issuances
      const preferences: Record<string, Record<string, number>> = {};
      const issuances: Record<string, Record<string, number>> = {};

      volunteerIds.forEach(id => {
        preferences[id] = {};
        issuances[id] = {};
      });

      data?.forEach(record => {
        const target = record.status === 'preferred' ? preferences : issuances;
        if (!target[record.volunteer_id][record.size]) {
          target[record.volunteer_id][record.size] = 0;
        }
        target[record.volunteer_id][record.size] += record.quantity;
      });

      return { preferences, issuances };
    } catch (error) {
      console.error("Error fetching T-shirt data:", error);
      return { preferences: {}, issuances: {} };
    }
  };

  /**
   * Fetch available T-shirt sizes for the event
   */
  const fetchTShirtSizes = async (): Promise<Array<{
    size_cd: string;
    size_name: string;
    sort_order: number;
    quantity: number;
    quantity_on_hand: number;
  }>> => {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase.rpc('get_tshirt_sizes', {
        p_event_id: eventId,
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching T-shirt sizes:", error);
      return [];
    }
  };

  return {
    // Core functions
    manageTShirt,
    removeTShirt,

    // Convenience functions
    addPreference,
    issueTShirt,
    removePreference,
    returnTShirt,

    // Data fetching
    fetchTShirtData,
    fetchTShirtSizes,
  };
}

export type UnifiedTShirtService = ReturnType<typeof createUnifiedTShirtService>;
