/**
 * Service for volunteer data operations
 * Handles Supabase interactions for volunteer management
 */

import { createClient } from "@/lib/supabase/client";
import type { VolunteerWithProfile, VolunteerFilters, VolunteerDataResponse } from "../types";

export class VolunteersService {
  private supabase = createClient();

  /**
   * Fetches volunteers with pagination and filtering
   * @param page Page number (1-based)
   * @param pageSize Number of items per page
   * @param filters Optional filters to apply
   * @returns Promise with volunteer data, error, and total count
   */
  async fetchVolunteers(
    page: number = 1,
    pageSize: number = 10,
    filters: VolunteerFilters = {}
  ): Promise<VolunteerDataResponse> {
    try {
      let query = this.supabase
        .from("volunteers")
        .select(`
          *,
          profile:profiles(
            id,
            display_name,
            user_id
          )
        `, { count: 'exact' });

      // Apply search filter
      if (filters.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      // Apply location filter
      if (filters.location) {
        query = query.eq('location', filters.location);
      }

      // Apply gender filter
      if (filters.gender) {
        query = query.eq('gender', filters.gender);
      }

      // Apply GM family filter
      if (filters.gmFamily !== undefined) {
        query = query.eq('gm_family', filters.gmFamily);
      }

      // Apply hospitality needed filter
      if (filters.hospitalityNeeded !== undefined) {
        query = query.eq('hospitality_needed', filters.hospitalityNeeded);
      }

      // Apply t-shirt size filter
      if (filters.tshirtSize) {
        query = query.eq('tshirt_size_preference', filters.tshirtSize);
      }

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      // Order by name
      query = query.order('first_name').order('last_name');

      const { data, error, count } = await query;

      if (error) {
        console.error("Error fetching volunteers:", error);
        return {
          data: [],
          error: error.message,
          totalCount: 0
        };
      }

      return {
        data: data as VolunteerWithProfile[],
        error: null,
        totalCount: count || 0
      };
    } catch (err) {
      console.error("Service error fetching volunteers:", err);
      return {
        data: [],
        error: err instanceof Error ? err.message : "An unknown error occurred",
        totalCount: 0
      };
    }
  }

  /**
   * Gets a single volunteer by ID
   * @param volunteerId The volunteer ID
   * @returns Promise with volunteer data or error
   */
  async getVolunteerById(volunteerId: string): Promise<{ data: VolunteerWithProfile | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from("volunteers")
        .select(`
          *,
          profile:profiles(
            id,
            display_name,
            user_id
          )
        `)
        .eq('id', volunteerId)
        .single();

      if (error) {
        console.error("Error fetching volunteer:", error);
        return {
          data: null,
          error: error.message
        };
      }

      return {
        data: data as VolunteerWithProfile,
        error: null
      };
    } catch (err) {
      console.error("Service error fetching volunteer:", err);
      return {
        data: null,
        error: err instanceof Error ? err.message : "An unknown error occurred"
      };
    }
  }

  /**
   * Deletes a volunteer
   * @param volunteerId The volunteer ID to delete
   * @returns Promise with success status and optional error
   */
  async deleteVolunteer(volunteerId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase
        .from("volunteers")
        .delete()
        .eq('id', volunteerId);

      if (error) {
        console.error("Error deleting volunteer:", error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        error: null
      };
    } catch (err) {
      console.error("Service error deleting volunteer:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "An unknown error occurred"
      };
    }
  }

  /**
   * Gets unique locations for filter dropdown
   * @returns Promise with array of unique locations
   */
  async getUniqueLocations(): Promise<{ data: string[]; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from("volunteers")
        .select('location')
        .not('location', 'is', null)
        .neq('location', '');

      if (error) {
        console.error("Error fetching locations:", error);
        return {
          data: [],
          error: error.message
        };
      }

      // Extract unique locations
      const uniqueLocations = [...new Set(data.map(item => item.location).filter(Boolean))];
      
      return {
        data: uniqueLocations,
        error: null
      };
    } catch (err) {
      console.error("Service error fetching locations:", err);
      return {
        data: [],
        error: err instanceof Error ? err.message : "An unknown error occurred"
      };
    }
  }
}