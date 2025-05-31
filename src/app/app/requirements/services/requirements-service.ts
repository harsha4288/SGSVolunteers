// src/app/app/requirements/services/requirements-service.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/supabase';
import type { RequirementWithDetails, SevaCategoryRef, Timeslot as TypesTimeslot, Location as TypesLocation, Requirement as RequirementType } from '../types';

// Simpler interface definition since Database type may have issues
export interface Requirement {
  id?: number;
  seva_category_id: number;
  timeslot_id: number;
  location_id: number | null;
  required_count: number;
  notes?: string;
}
export interface InsertRequirement {
  seva_category_id: number;
  timeslot_id: number;
  location_id: number | null;
  required_count: number;
  notes?: string;
}
export interface UpdateRequirement {
  seva_category_id?: number;
  timeslot_id?: number;
  location_id?: number;
  required_count?: number;
  notes?: string;
}

export type SevaCategory = Database['public']['Tables']['seva_categories']['Row'];
export type TimeSlot = Database['public']['Tables']['time_slots']['Row'];

// Structure for location-based requirements in notes (legacy format)
export interface LocationRequirement {
  location: string;
  count: number;
}

// Helper to parse location requirements from notes (legacy format)
export function parseLocationRequirements(notes: string | null): LocationRequirement[] {
  if (!notes) return [];
  try {
    const parsed = JSON.parse(notes);
    // Validate the structure
    if (Array.isArray(parsed) && parsed.every(item =>
      typeof item === 'object' &&
      'location' in item &&
      'count' in item &&
      typeof item.location === 'string' &&
      typeof item.count === 'number'
    )) {
      return parsed;
    }
    return [];
  } catch {
    // If notes is in old format or invalid, return empty array
    return [];
  }
}

// Helper to format location requirements to notes (legacy format)
export function formatLocationRequirements(locations: LocationRequirement[]): string {
  return JSON.stringify(locations.map(loc => ({
    location: loc.location,
    count: loc.count
  })));
}

interface RequirementsServiceProps {
  supabase: SupabaseClient<Database>;
}

export function createRequirementsService({ supabase }: RequirementsServiceProps) {
  const handleError = (error: any, context: string) => {
    console.error(`Error in ${context}:`, error);
    throw new Error(`Failed to ${context.toLowerCase()}. ${error.message || ''}`);
  };

  const fetchSevaCategories = async (): Promise<SevaCategoryRef[]> => {
    const { data, error } = await supabase
      .from('seva_categories')
      .select('id, category_name')
      .order('category_name', { ascending: true });
    if (error) handleError(error, 'fetch Seva Categories');
    return (data || []).map(sc => ({ id: sc.id, name: sc.category_name, category_name: sc.category_name }));
  };

  const fetchTimeslots = async (): Promise<TypesTimeslot[]> => {
    const { data, error } = await supabase
      .from('time_slots')
      .select('id, slot_name, start_time, end_time')
      .order('start_time', { ascending: true });
    if (error) handleError(error, 'fetch timeslots');
    return (data || []).map(ts => ({ id: ts.id, name: ts.slot_name, slot_name: ts.slot_name, start_time: ts.start_time, end_time: ts.end_time }));
  };

  const fetchLocations = async (): Promise<TypesLocation[]> => {
    const { data, error } = await supabase.from('locations').select('id, name').order('name');
    if (error) {
      console.warn('Error fetching locations, possibly table doesn\'t exist or not seeded:', error);
      return [{ id: 0, name: "Default Location" }]; // Fallback
    }
    return data || [];
  };

  const fetchAllRequirements = async (): Promise<RequirementWithDetails[]> => {
    // Fetch requirements table data first
    const { data: requirementsData, error: requirementsError } = await supabase
      .from('requirements')
      .select('id, seva_category_id, location_id, timeslot_id, required_count, notes');
    if (requirementsError) handleError(requirementsError, 'fetch requirements');
    if (!requirementsData) return [];
    
    // Fetch related tables separately
    const { data: sevaCategories, error: sevaCategoriesError } = await supabase
      .from('seva_categories')
      .select('id, category_name');
    if (sevaCategoriesError) handleError(sevaCategoriesError, 'fetch seva categories');
    
    const { data: locations, error: locationsError } = await supabase
      .from('locations')
      .select('id, name');
    if (locationsError) handleError(locationsError, 'fetch locations');
    
    const { data: timeSlots, error: timeSlotsError } = await supabase
      .from('time_slots')
      .select('id, slot_name, start_time, end_time');
    if (timeSlotsError) handleError(timeSlotsError, 'fetch time slots');

    const { data: assignmentCountsData, error: assignmentCountsError } = await supabase
      .from('vw_requirements_vs_assignments')
      .select('seva_category_id, timeslot_id, assigned_volunteers');
    if (assignmentCountsError) handleError(assignmentCountsError, 'fetch assignment counts');

    const assignmentMap = new Map<string, number>();
    if (assignmentCountsData) {
      for (const item of assignmentCountsData) {
        if (item.seva_category_id !== null && item.timeslot_id !== null) {
          assignmentMap.set(`${item.seva_category_id}-${item.timeslot_id}`, item.assigned_volunteers || 0);
        }
      }
    }

    // Create lookup maps for related data
    const sevaCategoryMap = new Map();
    if (sevaCategories) {
      for (const sc of sevaCategories) {
        sevaCategoryMap.set(sc.id, sc);
      }
    }
    
    const locationMap = new Map();
    if (locations) {
      for (const loc of locations) {
        locationMap.set(loc.id, loc);
      }
    }
    
    const timeSlotMap = new Map();
    if (timeSlots) {
      for (const ts of timeSlots) {
        timeSlotMap.set(ts.id, ts);
      }
    }

    return requirementsData.map(req => {
      const assigned_count = assignmentMap.get(`${req.seva_category_id}-${req.timeslot_id}`) || 0;
      const sc = sevaCategoryMap.get(req.seva_category_id);
      const loc = locationMap.get(req.location_id);
      const ts = timeSlotMap.get(req.timeslot_id);

      return {
        id: req.id,
        seva_category_id: req.seva_category_id,
        timeslot_id: req.timeslot_id,
        location_id: req.location_id,
        required_count: req.required_count || 0,
        notes: req.notes || undefined,
        seva_category: sc ? { id: sc.id, name: sc.category_name, category_name: sc.category_name } : { id: req.seva_category_id, name: 'Unknown', category_name: 'Unknown' },
        location: loc ? { id: loc.id, name: loc.name } : { id: req.location_id || 0, name: 'Unknown' },
        timeslot: ts ? { id: ts.id, name: ts.slot_name, slot_name: ts.slot_name, start_time: ts.start_time, end_time: ts.end_time } : { id: req.timeslot_id, name: 'Unknown', slot_name: 'Unknown', start_time: '', end_time: '' },
        assigned_count: assigned_count,
      };
    });
  };

  const fetchRequirement = async (sevaCategoryId: number, timeslotId: number, locationId: number): Promise<RequirementWithDetails | null> => {
    // Fetch the requirement
    const { data: req, error } = await supabase
      .from('requirements')
      .select('id, seva_category_id, location_id, timeslot_id, required_count, notes')
      .eq('seva_category_id', sevaCategoryId)
      .eq('timeslot_id', timeslotId)
      .eq('location_id', locationId)
      .single();
    if (error) return null;
    if (!req) return null;

    // Fetch related data
    const { data: sevaCategory, error: sevaCategoryError } = await supabase
      .from('seva_categories')
      .select('id, category_name')
      .eq('id', sevaCategoryId)
      .single();
    if (sevaCategoryError) handleError(sevaCategoryError, 'fetch seva category');

    const { data: location, error: locationError } = await supabase
      .from('locations')
      .select('id, name')
      .eq('id', locationId)
      .single();
    if (locationError) handleError(locationError, 'fetch location');

    const { data: timeSlot, error: timeSlotError } = await supabase
      .from('time_slots')
      .select('id, slot_name, start_time, end_time')
      .eq('id', timeslotId)
      .single();
    if (timeSlotError) handleError(timeSlotError, 'fetch time slot');

    // Get assignment count for this requirement
    const { data: assignmentCountData, error: assignmentCountError } = await supabase
      .from('vw_requirements_vs_assignments')
      .select('assigned_volunteers')
      .eq('seva_category_id', sevaCategoryId)
      .eq('timeslot_id', timeslotId)
      .maybeSingle();
    if (assignmentCountError) handleError(assignmentCountError, 'fetch assignment count');

    return {
      id: req.id,
      seva_category_id: req.seva_category_id,
      timeslot_id: req.timeslot_id,
      location_id: req.location_id,
      required_count: req.required_count || 0,
      notes: req.notes || undefined,
      seva_category: sevaCategory ? { id: sevaCategory.id, name: sevaCategory.category_name, category_name: sevaCategory.category_name } : { id: req.seva_category_id, name: 'Unknown', category_name: 'Unknown' },
      location: location ? { id: location.id, name: location.name } : { id: req.location_id || 0, name: 'Unknown' },
      timeslot: timeSlot ? { id: timeSlot.id, name: timeSlot.slot_name, slot_name: timeSlot.slot_name, start_time: timeSlot.start_time, end_time: timeSlot.end_time } : { id: req.timeslot_id, name: 'Unknown', slot_name: 'Unknown', start_time: '', end_time: '' },
      assigned_count: assignmentCountData?.assigned_volunteers || 0,
    };
  };

  const upsertRequirement = async (requirementData: Omit<RequirementType, 'id'>): Promise<RequirementWithDetails> => {
    const { seva_category_id, timeslot_id, location_id, required_count, notes } = requirementData;
    const upsertData: InsertRequirement = {
      seva_category_id,
      timeslot_id,
      location_id,
      required_count,
      notes,
    };
    if (location_id === null || location_id === undefined) {
      throw new Error("Location ID must be provided for upserting a requirement.")
    }

    const { data, error } = await supabase
      .from('requirements')
      .upsert(upsertData, { onConflict: 'seva_category_id,location_id,timeslot_id' })
      .select(`
        id, seva_category_id, location_id, timeslot_id, required_count, notes, created_at, updated_at,
        seva_categories (id, category_name),
        locations (id, name),
        time_slots (id, slot_name, start_time, end_time)
      `)
      .single();

    if (error) handleError(error, 'upsert requirement');
    if (!data) throw new Error("Upsert failed to return data.");

    const { data: assignmentCountData, error: assignmentError } = await supabase
      .from('vw_requirements_vs_assignments')
      .select('assigned_volunteers')
      .eq('seva_category_id', data.seva_category_id)
      .eq('timeslot_id', data.timeslot_id)
      .maybeSingle();
    if (assignmentError) console.warn('Failed to fetch assignment count post-upsert', assignmentError);

    const sc = data.seva_categories;
    const loc = data.locations;
    const ts = data.time_slots;

    return {
      id: data.id,
      seva_category_id: data.seva_category_id,
      timeslot_id: data.timeslot_id,
      location_id: data.location_id,
      required_count: data.required_count || 0,
      notes: data.notes || undefined,
      created_at: data.created_at || undefined,
      updated_at: data.updated_at || undefined,
      seva_category: sc ? { id: sc.id, name: sc.category_name, category_name: sc.category_name } : { id: data.seva_category_id, name: 'Unknown', category_name: 'Unknown' },
      location: loc ? { id: loc.id, name: loc.name } : { id: data.location_id || 0, name: 'Unknown' },
      timeslot: ts ? { id: ts.id, name: ts.slot_name, slot_name: ts.slot_name, start_time: ts.start_time, end_time: ts.end_time } : { id: data.timeslot_id, name: 'Unknown', slot_name: 'Unknown', start_time: '', end_time: '' },
      assigned_count: assignmentCountData?.assigned_volunteers || 0,
    };
  };

  const upsertRequirementsForCell = async (
    sevaCategoryId: number,
    timeslotId: number,
    requirementsToUpsertForCell: Array<Omit<RequirementType, 'id' | 'seva_category_id' | 'timeslot_id'>>
  ): Promise<RequirementWithDetails[]> => {
    // For atomicity, this might ideally be a single RPC call in Supabase.
    // Current approach: delete all for cell, then insert all for cell.

    const { error: deleteError } = await supabase
      .from('requirements')
      .delete()
      .eq('seva_category_id', sevaCategoryId)
      .eq('timeslot_id', timeslotId);
    if (deleteError) handleError(deleteError, 'clearing existing requirements for cell');

    const insertPromises = requirementsToUpsertForCell.map(req => {
      const insertData: InsertRequirement = {
        seva_category_id: sevaCategoryId,
        timeslot_id: timeslotId,
        location_id: req.location_id,
        required_count: req.required_count,
        notes: req.notes
      };
      // location_id MUST be non-null here due to table constraint for this key
      if (insertData.location_id === null || insertData.location_id === undefined) {
        throw new Error(`Attempted to insert requirement for Seva Category ${sevaCategoryId}, Timeslot ${timeslotId} without a Location ID.`);
      }
      return supabase.from('requirements').insert(insertData).select().single();
    });

    const settledResults = await Promise.allSettled(insertPromises);
    const successfullyInsertedIds: number[] = [];
    settledResults.forEach(result => {
      if (result.status === 'fulfilled' && result.value.data) {
        successfullyInsertedIds.push(result.value.data.id);
      } else if (result.status === 'rejected') {
        console.error('Error during part of bulk upsert for cell:', result.reason);
        // Consider re-throwing or aggregating errors to inform the user properly
      }
    });

    // After all inserts, fetch all requirements for this cell again to get complete objects with assigned_counts
    // This ensures consistency, though it's an extra fetch.
    const finalCellRequirements = await fetchAllRequirements(); //This fetches all, then filter locally
    return finalCellRequirements.filter(rwd => rwd.seva_category_id === sevaCategoryId && rwd.timeslot_id === timeslotId);
  };

  const deleteRequirement = async (sevaCategoryId: number, timeslotId: number, locationId: number): Promise<void> => {
    const { error } = await supabase
      .from('requirements')
      .delete()
      .eq('seva_category_id', sevaCategoryId)
      .eq('timeslot_id', timeslotId)
      .eq('location_id', locationId);
    if (error) handleError(error, 'delete requirement');
  };

  return {
    fetchSevaCategories,
    fetchTimeslots,
    fetchLocations,
    fetchAllRequirements,
    fetchRequirement,
    upsertRequirement,
    deleteRequirement,
    upsertRequirementsForCell,
    parseLocationRequirements,
    formatLocationRequirements,
  };
}
