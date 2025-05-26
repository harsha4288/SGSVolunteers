// src/app/app/requirements/services/requirements-service.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/supabase';
import type { Requirement, SevaCategoryRef, Location, Timeslot } from '../types';

interface RequirementsServiceProps {
  supabase: SupabaseClient<Database>;
}

export function createRequirementsService({ supabase }: RequirementsServiceProps) {
  const handleError = (error: any, context: string) => {
    console.error(`Error in ${context}:`, error);
    // Consider more specific error messages or codes for UI handling
    throw new Error(`Failed to ${context.toLowerCase()}. ${error.message || ''}`);
  };

  const fetchSevaCategories = async (): Promise<SevaCategoryRef[]> => {
    const { data, error } = await supabase
      .from('seva_categories')
      .select('id, category_name, description, location_id'); // location_id is default_location_id
    if (error) handleError(error, 'fetch Seva Categories');
    return (data || []).map(sc => ({
      id: sc.id,
      name: sc.category_name,
      description: sc.description,
      default_location_id: sc.location_id,
    }));
  };

  const fetchLocations = async (): Promise<Location[]> => {
    const { data, error } = await supabase
      .from('locations')
      .select('id, name, description');
    if (error) handleError(error, 'fetch locations');
    return data || [];
  };

  const fetchTimeslots = async (): Promise<Timeslot[]> => {
    const { data, error } = await supabase
      .from('time_slots')
      .select('id, slot_name, description'); // Use slot_name or description as 'name'
    if (error) handleError(error, 'fetch timeslots');
    return (data || []).map(ts => ({
      id: ts.id,
      name: ts.slot_name || ts.description || 'Unnamed Timeslot', // Fallback for name
    }));
  };

  // Fetches all requirements. Filtering by user's Seva Categories can be done client-side or by adding a filter here.
  const fetchAllRequirements = async (): Promise<Requirement[]> => {
    const { data, error } = await supabase
      .from('requirements')
      .select('*');
    if (error) handleError(error, 'fetch all requirements');
    return data || [];
  };

  // Fetches requirements for a specific Seva Category and Timeslot (used by the modal)
  const fetchRequirementsForCell = async (sevaCategoryId: number, timeslotId: number): Promise<Requirement[]> => {
    const { data, error } = await supabase
      .from('requirements')
      .select('*')
      .eq('seva_category_id', sevaCategoryId)
      .eq('timeslot_id', timeslotId);
    if (error) handleError(error, 'fetch requirements for cell');
    return data || [];
  };

  // Upserts a batch of requirements for a specific Seva Category / Timeslot cell.
  // This will typically involve multiple locations.
  // The `requirementsToUpsert` array should contain full Requirement objects.
  // Existing requirements not in the list for this cell (SevaCategory/Timeslot) might need to be handled (e.g., deleted if count is 0).
  const upsertRequirementsForCell = async (
    sevaCategoryId: number, 
    timeslotId: number, 
    requirementsToUpsert: Array<Omit<Requirement, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<Requirement[]> => {
    
    // Logic to handle existing requirements for this cell:
    // 1. Fetch all existing requirements for the given seva_category_id and timeslot_id.
    const { data: existingRequirements, error: fetchError } = await supabase
      .from('requirements')
      .select('id, location_id')
      .eq('seva_category_id', sevaCategoryId)
      .eq('timeslot_id', timeslotId);

    if (fetchError) handleError(fetchError, 'fetching existing requirements before upsert');

    const upsertedLocationIds = new Set(requirementsToUpsert.map(r => r.location_id));
    const requirementsToDelete: number[] = [];

    if (existingRequirements) {
      for (const existingReq of existingRequirements) {
        // If an existing requirement's location is not in the new list, mark for deletion.
        if (!upsertedLocationIds.has(existingReq.location_id)) {
          requirementsToDelete.push(existingReq.id);
        }
      }
    }
    
    // Perform deletions for locations no longer having a requirement in this cell
    if (requirementsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('requirements')
        .delete()
        .in('id', requirementsToDelete);
      if (deleteError) handleError(deleteError, 'delete old requirements for cell');
    }

    // Perform upserts for the new/updated requirements
    // Filter out items with required_count <= 0 if the intent is to remove them via not upserting.
    // Or, let them upsert with 0 if the backend/DB handles that (e.g., RLS policies).
    // For now, we'll assume upserting 0 is valid for explicit "zeroing out".
    const validUpserts = requirementsToUpsert.map(r => ({
        seva_category_id: r.seva_category_id,
        location_id: r.location_id,
        timeslot_id: r.timeslot_id,
        required_count: r.required_count,
        notes: r.notes,
    }));
    
    if (validUpserts.length === 0) { // If all requirements were to be deleted, and none to upsert.
        return []; // Return empty array as no actual upsert happened.
    }

    const { data, error: upsertError } = await supabase
      .from('requirements')
      .upsert(validUpserts, { 
        onConflict: 'seva_category_id, location_id, timeslot_id', // Unique constraint
        // ignoreDuplicates: false, // default is false, ensures update on conflict
      })
      .select(); // Fetch the results of the upsert

    if (upsertError) handleError(upsertError, 'upsert requirements for cell');
    return data || [];
  };

  return {
    fetchSevaCategories,
    fetchLocations,
    fetchTimeslots,
    fetchAllRequirements, // Renamed from fetchRequirements
    fetchRequirementsForCell, // New specific fetcher
    upsertRequirementsForCell, // New batch upsert logic for a cell
  };
}
