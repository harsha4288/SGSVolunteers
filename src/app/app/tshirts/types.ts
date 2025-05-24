/**
 * Type definitions for the T-shirt module
 */

/**
 * Volunteer type
 */
export interface Volunteer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  profile_id?: string;
  requested_tshirt_quantity?: number;
  tshirt_size_preference?: string;
}

/**
 * T-shirt size type
 */
export interface TShirtSize {
  id?: number;
  event_id: number;
  size_cd: string;
  size_name: string;
  sort_order: number;
  quantity?: number;
  quantity_on_hand?: number;
}

/**
 * T-shirt inventory type (from get_tshirt_sizes function)
 */
export interface TShirtInventory {
  size_cd: string;
  size_name: string;
  sort_order: number;
  quantity: number;
  quantity_on_hand: number;
}

/**
 * Pending issuance type for confirmation dialog
 */
export interface PendingIssuance {
  volunteerId: string;
  size: string;
  quantity: number;
}
