/**
 * Types and interfaces for the Volunteers module
 */

import type { Database } from "@/lib/types/supabase";

// Database table types
type VolunteerRow = Database["public"]["Tables"]["volunteers"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * Volunteer data with profile information for display
 */
export interface VolunteerWithProfile {
  id: string;
  profile_id: string | null;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  gender: string | null;
  gm_family: boolean | null;
  association_with_mahayajna: string | null;
  mahayajna_student_name: string | null;
  student_batch: string | null;
  hospitality_needed: boolean | null;
  location: string | null;
  other_location: string | null;
  additional_info: string | null;
  requested_tshirt_quantity: number | null;
  tshirt_size_preference: string | null;
  created_at: string;
  updated_at: string;
  profile?: {
    id: string;
    display_name: string | null;
    user_id: string | null;
  } | null;
}

/**
 * Filters for volunteer search and filtering
 */
export interface VolunteerFilters {
  search?: string;
  location?: string;
  gender?: string;
  gmFamily?: boolean;
  hospitalityNeeded?: boolean;
  tshirtSize?: string;
}

/**
 * Pagination parameters for volunteer data fetching
 */
export interface VolunteerPagination {
  page: number;
  pageSize: number;
  totalCount: number;
}

/**
 * Response from volunteer data service
 */
export interface VolunteerDataResponse {
  data: VolunteerWithProfile[];
  error: string | null;
  totalCount: number;
}

/**
 * Volunteer form data (extends the form schema from volunteer-form.tsx)
 */
export interface VolunteerFormData {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  gender?: "Male" | "Female";
  gm_family?: boolean;
  association_with_mahayajna?: string;
  mahayajna_student_name?: string;
  student_batch?: string;
  hospitality_needed?: boolean;
  location?: string;
  other_location?: string;
  additional_info?: string;
  requested_tshirt_quantity?: number;
  tshirt_size_preference?: "XS" | "S" | "M" | "L" | "XL" | "XXL";
}