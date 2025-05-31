"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";
import type {
    Requirement,
    RequirementWithDetails,
    RequirementServiceResponse,
    SevaCategoryRef,
    Timeslot,
    Location,
    ReportFilters,
} from "../types";

interface UnifiedRequirementsServiceProps {
    supabase: SupabaseClient<Database> | null;
}

export function createUnifiedRequirementsService({
    supabase,
}: UnifiedRequirementsServiceProps) {
    /**
     * Fetch all requirements with details
     */
    const fetchRequirementsWithDetails = async (filters?: ReportFilters): Promise<RequirementWithDetails[]> => {
        if (!supabase) return [];

        try {
            let query = supabase
                .from('requirements')
                .select(`
                    *,
                    seva_categories (
                        id,
                        category_name
                    ),
                    time_slots (
                        id,
                        slot_name,
                        start_time,
                        end_time
                    ),
                    volunteer_commitments!requirements_seva_category_id_timeslot_id_fkey (
                        id,
                        volunteer_id
                    )
                `);

            // Apply filters if provided
            if (filters) {
                if (filters.seva_category_ids?.length) {
                    query = query.in('seva_category_id', filters.seva_category_ids);
                }
                if (filters.timeslot_ids?.length) {
                    query = query.in('timeslot_id', filters.timeslot_ids);
                }
                if (filters.location_ids?.length) {
                    query = query.in('location_id', filters.location_ids);
                }
            }

            const { data, error } = await query;

            if (error) throw error;

            // Transform the data
            return (data || []).map(item => ({
                id: item.id,
                seva_category_id: item.seva_category_id,
                timeslot_id: item.timeslot_id,
                location_id: item.location_id,
                required_count: item.required_count,
                notes: item.notes || undefined,
                created_at: item.created_at || undefined,
                updated_at: item.updated_at || undefined,
                seva_category: {
                    id: item.seva_categories?.id || item.seva_category_id,
                    name: item.seva_categories?.category_name || '',
                    category_name: item.seva_categories?.category_name || '',
                },
                timeslot: {
                    id: item.time_slots?.id || item.timeslot_id,
                    name: item.time_slots?.slot_name || '',
                    slot_name: item.time_slots?.slot_name || '',
                    start_time: item.time_slots?.start_time || '',
                    end_time: item.time_slots?.end_time || '',
                },
                location: {
                    id: item.location_id,
                    name: '', // We'll need to add locations table to the query
                },
                assigned_count: Array.isArray(item.volunteer_commitments) ? item.volunteer_commitments.length : 0,
                attended_count: 0, // We'll need to add check-ins to get this
            }));
        } catch (error) {
            console.error("Error fetching requirements:", error);
            return [];
        }
    };

    /**
     * Update or create a requirement
     */
    const manageRequirement = async (
        requirement: Omit<Requirement, 'id' | 'created_at' | 'updated_at'>
    ): Promise<RequirementServiceResponse> => {
        if (!supabase) return { success: false, error: "Supabase client not initialized" };

        try {
            // Check if requirement exists
            const { data: existing } = await supabase
                .from('requirements')
                .select('id')
                .eq('seva_category_id', requirement.seva_category_id)
                .eq('timeslot_id', requirement.timeslot_id)
                .eq('location_id', requirement.location_id)
                .maybeSingle();

            if (existing) {
                // Update
                const { error } = await supabase
                    .from('requirements')
                    .update({
                        required_count: requirement.required_count,
                        notes: requirement.notes,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', existing.id);

                if (error) throw error;
                return { success: true, message: "Requirement updated successfully" };
            } else {
                // Insert
                const { error } = await supabase
                    .from('requirements')
                    .insert({
                        ...requirement,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    });

                if (error) throw error;
                return { success: true, message: "Requirement created successfully" };
            }
        } catch (error) {
            console.error("Error managing requirement:", error);
            return { success: false, error };
        }
    };

    /**
     * Delete a requirement
     */
    const deleteRequirement = async (
        seva_category_id: number,
        timeslot_id: number,
        location_id: number
    ): Promise<RequirementServiceResponse> => {
        if (!supabase) return { success: false, error: "Supabase client not initialized" };

        try {
            const { error } = await supabase
                .from('requirements')
                .delete()
                .eq('seva_category_id', seva_category_id)
                .eq('timeslot_id', timeslot_id)
                .eq('location_id', location_id);

            if (error) throw error;
            return { success: true, message: "Requirement deleted successfully" };
        } catch (error) {
            console.error("Error deleting requirement:", error);
            return { success: false, error };
        }
    };

    /**
     * Fetch all seva categories
     */
    const fetchSevaCategories = async (): Promise<SevaCategoryRef[]> => {
        if (!supabase) return [];

        try {
            const { data, error } = await supabase
                .from('seva_categories')
                .select('id, category_name')
                .order('category_name');

            if (error) throw error;

            return (data || []).map(item => ({
                id: item.id,
                name: item.category_name,
                category_name: item.category_name,
            }));
        } catch (error) {
            console.error("Error fetching seva categories:", error);
            return [];
        }
    };

    /**
     * Fetch all timeslots
     */
    const fetchTimeslots = async (): Promise<Timeslot[]> => {
        if (!supabase) return [];

        try {
            const { data, error } = await supabase
                .from('time_slots')
                .select('id, slot_name, start_time, end_time')
                .order('start_time');

            if (error) throw error;

            return (data || []).map(item => ({
                id: item.id,
                name: item.slot_name,
                slot_name: item.slot_name,
                start_time: item.start_time,
                end_time: item.end_time,
            }));
        } catch (error) {
            console.error("Error fetching timeslots:", error);
            return [];
        }
    };

    /**
     * Fetch all locations
     */
    const fetchLocations = async (): Promise<Location[]> => {
        if (!supabase) return [];

        try {
            // For now, return a simplified location list
            // In a future update, we can add proper location management
            return [
                { id: 1, name: 'Location 1' },
                { id: 2, name: 'Location 2' },
                { id: 3, name: 'Location 3' },
            ];
        } catch (error) {
            console.error("Error fetching locations:", error);
            return [];
        }
    };

    return {
        // Core functions
        fetchRequirementsWithDetails,
        manageRequirement,
        deleteRequirement,

        // Data fetching
        fetchSevaCategories,
        fetchTimeslots,
        fetchLocations,
    };
} 