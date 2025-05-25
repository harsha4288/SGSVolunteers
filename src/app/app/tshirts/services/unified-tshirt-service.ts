"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";

interface UnifiedTShirtServiceProps {
  supabase: SupabaseClient<Database>;
  eventId: number;
}

/**
 * Unified service for managing T-shirt preferences and issuances
 * This service uses the same underlying functions for both operations
 */
export function createUnifiedTShirtService({
  supabase,
  eventId,
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
    toast?: any,
    setSaving?: (volunteerId: string, isSaving: boolean) => void,
    allowOverride: boolean = false
  ) => {
    if (!supabase) return null;

    setSaving?.(volunteerId, true);

    try {
      // Use the appropriate convenience function based on status
      let data, error;

      if (status === 'preferred') {
        ({ data, error } = await (supabase as any).rpc('add_tshirt_preference', {
          p_volunteer_id: volunteerId,
          p_event_id: eventId,
          p_size_cd: sizeCode,
          p_quantity: quantity,
          p_allow_override: allowOverride,
        }));
      } else if (status === 'issued') {
        ({ data, error } = await (supabase as any).rpc('issue_tshirt', {
          p_volunteer_id: volunteerId,
          p_event_id: eventId,
          p_size_cd: sizeCode,
          p_issued_by_profile_id: issuedByProfileId,
          p_quantity: quantity,
          p_allow_override: allowOverride,
        }));
      } else {
        throw new Error(`Invalid status: ${status}`);
      }

      if (error) {
        // Improve error message for inventory issues
        if (error.message?.includes('Not enough inventory')) {
          throw new Error(`Insufficient inventory for size ${sizeCode}`);
        }
        throw error;
      }

      toast?.({
        title: "Success",
        description: `T-shirt ${status === 'preferred' ? 'preference' : 'issuance'} ${quantity > 1 ? `(${quantity})` : ''} added successfully.`,
        variant: "default",
      });

      return data;
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
      console.error(`Error managing T-shirt ${status}:`, errorMessage);

      // Don't show toast for allocation limit errors - let frontend handle them
      if (!errorMessage.includes('Allocation limit exceeded')) {
        toast?.({
          title: "Error",
          description: `Failed to add ${status === 'preferred' ? 'preference' : 'issuance'}: ${errorMessage}`,
          variant: "destructive",
        });
      }

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
    toast?: any,
    setSaving?: (volunteerId: string, isSaving: boolean) => void
  ) => {
    if (!supabase) return false;

    setSaving?.(volunteerId, true);

    try {
      // Use the appropriate convenience function based on status
      let data, error;

      if (status === 'preferred') {
        ({ data, error } = await (supabase as any).rpc('remove_tshirt_preference', {
          p_volunteer_id: volunteerId,
          p_event_id: eventId,
          p_size_cd: sizeCode,
          p_quantity: quantity,
        }));
      } else if (status === 'issued') {
        ({ data, error } = await (supabase as any).rpc('return_tshirt', {
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
      const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
      console.error(`Error removing T-shirt ${status}:`, errorMessage);
      toast?.({
        title: "Error",
        description: `Failed to remove ${status === 'preferred' ? 'preference' : 'issuance'}: ${errorMessage}`,
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
    toast?: any,
    setSaving?: (volunteerId: string, isSaving: boolean) => void,
    allowOverride: boolean = false
  ) => manageTShirt(volunteerId, sizeCode, 'preferred', quantity, undefined, toast, setSaving, allowOverride);

  /**
   * Convenience method for issuing T-shirts
   */
  const issueTShirt = (
    volunteerId: string,
    sizeCode: string,
    issuedByProfileId: string,
    quantity: number = 1,
    toast?: any,
    setSaving?: (volunteerId: string, isSaving: boolean) => void,
    allowOverride: boolean = false
  ) => manageTShirt(volunteerId, sizeCode, 'issued', quantity, issuedByProfileId, toast, setSaving, allowOverride);

  /**
   * Convenience method for removing preferences
   */
  const removePreference = (
    volunteerId: string,
    sizeCode: string,
    quantity: number = 1,
    toast?: any,
    setSaving?: (volunteerId: string, isSaving: boolean) => void
  ) => removeTShirt(volunteerId, sizeCode, 'preferred', quantity, toast, setSaving);

  /**
   * Convenience method for returning T-shirts
   */
  const returnTShirt = (
    volunteerId: string,
    sizeCode: string,
    quantity: number = 1,
    toast?: any,
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
      // Use direct table query instead of RPC for now to avoid TypeScript issues
      const { data, error } = await supabase
        .from('tshirt_inventory')
        .select('size_cd, quantity, quantity_on_hand, sort_order')
        .eq('event_id', eventId)
        .order('sort_order');

      if (error) throw error;

      // Transform the data to match expected format
      const transformedData = (data || []).map(item => ({
        size_cd: item.size_cd,
        size_name: item.size_cd, // Use size_cd as size_name for now
        sort_order: item.sort_order || 0,
        quantity: item.quantity || 0,
        quantity_on_hand: item.quantity_on_hand || 0,
      }));

      return transformedData;
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
