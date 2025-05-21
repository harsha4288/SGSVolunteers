/**
 * T-shirt module type definitions
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";

/**
 * T-shirt size definition
 */
export interface TShirtSize {
  id: number;
  event_id: number;
  size_name: string;
  sort_order: number;
}

/**
 * Volunteer information
 */
export interface Volunteer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  requested_tshirt_quantity?: number;
  profile_id?: string;
}

/**
 * T-shirt inventory item
 */
export interface TShirtInventoryItem {
  id: number;
  tshirt_size_id: number;
  quantity_initial: number;
  quantity: number;
  quantity_on_hand?: number;
  tshirt_sizes?: TShirtSize;
}

/**
 * T-shirt issuance record
 */
export interface TShirtIssuance {
  id: number;
  volunteer_id: string;
  tshirt_inventory_id: number;
  size: string;
  quantity?: number;
  issued_by_profile_id?: string;
  created_at?: string;
}

/**
 * T-shirt preference record
 */
export interface TShirtPreference {
  id: number;
  volunteer_id: string;
  event_id: number;
  tshirt_size_id: number;
  quantity?: number;
  preference_order?: number;
  is_fulfilled?: boolean;
  tshirt_sizes?: TShirtSize;
}

/**
 * Pending T-shirt issuance data
 */
export interface PendingIssuance {
  volunteerId: string;
  size: string;
  quantity: number;
}

/**
 * Common props for T-shirt components
 */
export interface TShirtBaseProps {
  supabase: SupabaseClient<Database>;
  isAdmin: boolean;
  eventId: number;
  profileId: string;
}

/**
 * T-shirt data state
 */
export interface TShirtDataState {
  loading: boolean;
  preferences: Record<string, Record<string, boolean>>;
  allocations: Record<string, number>;
  issuances: Record<string, string[]>;
  preferenceCountsBySize: Record<string, Record<string, number>>;
  issuanceCountsBySize: Record<string, Record<string, number>>;
  saving: Record<string, boolean>;
  volunteersToDisplay: Volunteer[];
}
