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
    // It's often better to let the caller handle specific error messages for the UI
    throw new Error(`Failed to ${context.toLowerCase()}.`);
  };

  const fetchSevaCategories = async (): Promise<SevaCategoryRef[]> => {
    const { data, error } = await supabase
      .from('seva_categories')
      .select('id, category_name, description, location_id'); // Supabase returns actual column names
    if (error) handleError(error, 'fetch Seva Categories');
    // Manually map to SevaCategoryRef, ensuring correct property names
    return (data || []).map(sc => ({
      id: sc.id,
      name: sc.category_name, // Map category_name to name
      description: sc.description,
      default_location_id: sc.location_id, // Map location_id to default_location_id
    }));
  };

  const fetchLocations = async (): Promise<Location[]> => {
    const { data, error } = await supabase.from('locations').select('id, name');
    if (error) handleError(error, 'fetch locations');
    return data || [];
  };

  const fetchTimeslots = async (): Promise<Timeslot[]> => {
    const { data, error } = await supabase
      .from('time_slots')
      .select('id, description'); // Supabase returns actual column names
    if (error) handleError(error, 'fetch timeslots');
     // Manually map to Timeslot, ensuring correct property names
    return (data || []).map(ts => ({
      id: ts.id,
      name: ts.description, // Map description to name
    }));
  };

  const fetchRequirements = async (sevaCategoryId?: number): Promise<Requirement[]> => {
    let query = supabase.from('requirements').select('*');
    if (sevaCategoryId) {
      query = query.eq('seva_category_id', sevaCategoryId);
    }
    const { data, error } = await query;
    if (error) handleError(error, 'fetch requirements');
    return data || [];
  };

  const upsertRequirement = async (requirement: Omit<Requirement, 'id' | 'created_at' | 'updated_at'>): Promise<Requirement> => {
    // Ensure the requirement object being passed to upsert has seva_category_id, not task_id
    const { seva_category_id, location_id, timeslot_id, required_count } = requirement;
    const upsertData = { seva_category_id, location_id, timeslot_id, required_count };

    const { data, error } = await supabase
      .from('requirements')
      .upsert(upsertData, { onConflict: 'seva_category_id, timeslot_id, location_id' })
      .select()
      .single();

    if (error) handleError(error, 'upsert requirement');
    return data as Requirement; // Supabase should return the upserted row
  };

  return {
    fetchSevaCategories, // Renamed from fetchTasks
    fetchLocations,
    fetchTimeslots,
    fetchRequirements,
    upsertRequirement,
  };
}
