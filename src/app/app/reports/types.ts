// src/app/app/reports/types.ts
export type ReportType = 'varianceSummary' | 'requirementDetails' | 'attendance';

export interface VarianceSummaryData { // Renamed from VarianceReportData
  seva_category_id: number;
  task_name: string; // from seva_categories.category_name
  timeslot_id: number;
  timeslot_slot_name: string; // from time_slots.slot_name
  timeslot_description?: string | null; // from time_slots.description
  total_required_count: number;
  total_available_volunteers: number;
  overall_variance: number; // from view: total_available_volunteers - total_required_count
}

export interface RequirementDetailData {
  requirement_id: number;
  seva_category_id: number;
  task_name: string; // from seva_categories.category_name
  location_id: number;
  location_name: string; // from locations.name
  timeslot_id: number;
  timeslot_slot_name: string; // from time_slots.slot_name
  timeslot_description?: string | null; // from time_slots.description
  required_count: number;
  total_available_for_seva_timeslot: number; // from view
}

export interface AttendanceReportData {
  task_id: number; // maps to vw_assignments_vs_attendance.seva_category_id
  task_name: string; // from vw_assignments_vs_attendance.task_name
  timeslot_slot_name: string; // from vw_assignments_vs_attendance.timeslot_slot_name
  timeslot_description?: string | null; // from vw_assignments_vs_attendance.timeslot_description
  assigned_location_id: number;
  assigned_location_name: string;
  assigned_volunteers_count: number;
  actual_attendance_count: number;
  attendance_rate?: number; // calculated client-side: (actual_attendance_count / assigned_volunteers_count) * 100
}

// Generic data type for the hook, can be union of specific report types
export type GenericReportData = VarianceSummaryData | RequirementDetailData | AttendanceReportData;
