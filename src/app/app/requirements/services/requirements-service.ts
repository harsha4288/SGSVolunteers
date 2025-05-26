// src/app/app/requirements/services/requirements-service.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/supabase';
import type { Requirement, Task, Location, Timeslot } from '../types';

interface RequirementsServiceProps {
  supabase: SupabaseClient<Database>;
}

export function createRequirementsService({ supabase }: RequirementsServiceProps) {
  const handleError = (error: any, context: string) => {
    console.error(`Error in ${context}:`, error);
    // It's often better to let the caller handle specific error messages for the UI
    throw new Error(`Failed to ${context.toLowerCase()}.`);
  };

  const fetchTasks = async (): Promise<Task[]> => {
    const { data, error } = await supabase.from('tasks').select('id, name, description');
    if (error) handleError(error, 'fetch tasks');
    return data || [];
  };

  const fetchLocations = async (): Promise<Location[]> => {
    const { data, error } = await supabase.from('locations').select('id, name');
    if (error) handleError(error, 'fetch locations');
    return data || [];
  };

  const fetchTimeslots = async (): Promise<Timeslot[]> => {
    const { data, error } = await supabase.from('timeslots').select('id, name, start_time, end_time');
    if (error) handleError(error, 'fetch timeslots');
    return data || [];
  };

  const fetchRequirements = async (taskId?: number): Promise<Requirement[]> => {
    let query = supabase.from('requirements').select('*');
    if (taskId) {
      query = query.eq('task_id', taskId);
    }
    const { data, error } = await query;
    if (error) handleError(error, 'fetch requirements');
    return data || [];
  };

  const upsertRequirement = async (requirement: Omit<Requirement, 'id' | 'created_at' | 'updated_at'>): Promise<Requirement> => {
    const { data, error } = await supabase
      .from('requirements')
      .upsert(requirement, { onConflict: 'task_id, timeslot_id, location_id' })
      .select()
      .single();

    if (error) handleError(error, 'upsert requirement');
    return data as Requirement; // Supabase should return the upserted row
  };

  return {
    fetchTasks,
    fetchLocations,
    fetchTimeslots,
    fetchRequirements,
    upsertRequirement,
  };
}
