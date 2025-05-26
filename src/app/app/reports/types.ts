// src/app/app/reports/types.ts

// ReportType will distinguish which report data to fetch and display
export type ReportType = 'requirements_vs_assignments' | 'requirements_by_location' | 'assignments_vs_attendance';

// Based on vw_requirements_vs_assignments
export interface RequirementsVsAssignmentsData {
  seva_category_id: number;
  category_name: string; // from seva_categories
  timeslot_id: number;
  slot_name: string; // from time_slots
  total_required: number;
  assigned_volunteers: number;
  variance: number; // (assigned_volunteers - total_required)
}

// Based on vw_requirements_by_location
export interface RequirementsByLocationData {
  seva_category_id: number;
  category_name: string; // from seva_categories
  location_id: number;
  location_name: string; // from locations
  timeslot_id: number;
  slot_name: string; // from time_slots
  required_count: number;
}

// Based on vw_assignments_vs_attendance
export interface AssignmentsVsAttendanceData {
  task_id: number; // This is seva_category_id in the view
  task_name: string; // This is category_name in the view
  timeslot_slot_name: string;
  timeslot_description?: string | null;
  // Location details are not directly in this view as per fix_requirements_schema.sql for vw_assignments_vs_attendance
  // If location is needed here, the view vw_assignments_vs_attendance needs to be updated.
  // For now, assuming location is not part of this specific view's direct output for this type.
  assigned_volunteers_count: number;
  actual_attendance_count: number;
  // Calculated client-side in the hook
  attendance_rate?: number; 
}

// Generic data type for the hook, can be a union of specific report types
export type GenericReportData = 
  | RequirementsVsAssignmentsData 
  | RequirementsByLocationData 
  | AssignmentsVsAttendanceData;

// Filter types for the reports service and hook
// These can be expanded based on available filter controls
export interface ReportFilters {
  eventId?: number | null;
  dateRange?: { from?: Date; to?: Date } | null;
  sevaCategoryIds?: number[] | null;
  timeslotIds?: number[] | null;
  locationIds?: number[] | null;
  // Add other potential filters: e.g., specific volunteer, task status etc.
}
