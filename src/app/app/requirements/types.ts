// src/app/app/requirements/types.ts

// From previous refactoring (Set 4, Turn 1), should be mostly correct
// but ensuring it matches the plan from Turn 50.

export interface SevaCategoryRef {
  id: number;
  name: string; // maps from seva_categories.category_name
  description?: string | null;
  // default_location_id is not directly used by UI plan, but good to have if service provides it
  default_location_id?: number | null; 
}

export interface Timeslot {
  id: number;
  name: string; // From time_slots.description or slot_name for user-friendliness
  // start_time and end_time can be added if needed for display logic later
}

export interface Location {
  id: number;
  name: string;
  description?: string | null;
}

export interface Requirement {
  id?: number; // DB ID of the requirement entry
  seva_category_id: number;
  location_id: number;
  timeslot_id: number;
  required_count: number;
  notes?: string | null; // Added from plan (if needed for modal)
  created_at?: string;
  updated_at?: string;
}

// Data for a single cell in the grid (sum of requirements for a SevaCategory/Timeslot across locations)
export interface RequirementCellData {
  sevaCategory: SevaCategoryRef;
  timeslot: Timeslot;
  total_required_count: number;
  // This will hold the detailed requirements for this cell, to be passed to the modal
  requirements_for_cell: Requirement[]; 
}

// Data structure for the Requirement Edit Modal
export interface RequirementEditModalData {
  sevaCategory: SevaCategoryRef;
  timeslot: Timeslot;
  // Requirements for this specific SevaCategory/Timeslot, broken down by location
  // This will be transformed into form state within the modal.
  requirementsForCell: Requirement[]; 
}

// This type was previously RequirementRow, renaming for clarity if it's only for internal grid processing
// If RequirementCellData is the primary display unit, RequirementRow might be redundant or internal to the hook.
// For now, let's assume RequirementCellData is what the grid component will consume.
// If a flat list is still needed by the hook for some processing before creating RequirementCellData,
// then a type like this might be used internally:
export interface ProcessedRequirementRow extends Requirement {
  seva_category_name?: string;
  location_name?: string;
  timeslot_name?: string;
}
