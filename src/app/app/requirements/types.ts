// src/app/app/requirements/types.ts
export interface Requirement {
  id?: number;
  seva_category_id: number; // Renamed from task_id
  timeslot_id: number;
  location_id: number;
  required_count: number;
  created_at?: string;
  updated_at?: string;
}

// Renamed from Task to SevaCategoryRef
export interface SevaCategoryRef {
  id: number;
  name: string; // maps from seva_categories.category_name
  description?: string | null;
  default_location_id?: number | null; // from seva_categories.location_id
}

export interface Location {
  id: number;
  name: string;
}

export interface Timeslot {
  id: number;
  name: string; // From time_slots.description for user-friendliness
  // start_time and end_time can be added if needed for display logic later
}

// Combined type for display
export interface RequirementRow extends Requirement {
  seva_category_id: number; // Ensure this is part of Requirement and then here
  seva_category_name?: string; // Renamed from task_name
  location_name?: string;
  timeslot_name?: string;
}
