// src/app/app/requirements/types.ts

// From previous refactoring (Set 4, Turn 1), should be mostly correct
// but ensuring it matches the plan from Turn 50.

// Base interfaces
export interface SevaCategoryRef {
  id: number;
  name: string;
  category_name: string;
}

export interface Location {
  id: number;
  name: string;
}

export interface Timeslot {
  id: number;
  name: string;
  slot_name: string;
  start_time: string;
  end_time: string;
}

export interface Requirement {
  id?: number;
  seva_category_id: number;
  timeslot_id: number;
  location_id: number | null;
  required_count: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Enhanced interfaces for unified management
export interface RequirementWithDetails extends Requirement {
  seva_category: SevaCategoryRef;
  timeslot: Timeslot;
  location: Location;
  assigned_count?: number;
  attended_count?: number;
}

export interface RequirementSummary {
  seva_category_id: number;
  timeslot_id: number;
  total_required: number;
  total_assigned: number;
  total_attended: number;
  requirements_by_location: RequirementWithDetails[];
}

// Data for a single cell in the grid
export interface RequirementCellData {
  sevaCategory: SevaCategoryRef;
  timeslot: Timeslot;
  total_required_count: number;
  total_assigned_count: number;
  total_attended_count: number;
  requirements_for_cell: RequirementWithDetails[];
  variance: number; // Difference between required and assigned
  fulfillment_rate: number; // Percentage of requirements fulfilled
  attendance_rate: number; // Percentage of assigned that attended
}

// Data structure for the Requirement Edit Modal
export interface RequirementEditModalData {
  sevaCategory: SevaCategoryRef;
  timeslot: Timeslot;
  requirementsForCell: RequirementWithDetails[];
}

// Filter types
export interface ReportFilters {
  seva_category_ids?: number[];
  timeslot_ids?: number[];
  location_ids?: number[];
  date_range?: {
    start: string;
    end: string;
  };
}

// Service response types
export interface RequirementServiceResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: any;
}

// State types for hooks
export interface RequirementsState {
  loading: boolean;
  loadingInitial: boolean;
  loadingRequirements: boolean;
  error: string | null;
  requirements: RequirementWithDetails[];
  summaries: RequirementSummary[];
  displaySevaCategories: SevaCategoryRef[];
  allTimeslots: Timeslot[];
  allLocations: Location[];
  filters: ReportFilters;
  saving: { [key: string]: boolean };
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
