// src/app/app/reports/types.ts
export type ReportType = 'variance' | 'attendance';

export interface VarianceReportData {
  task_id: number;
  task_name: string;
  timeslot_id: number;
  timeslot_name: string;
  location_id: number;
  location_name: string;
  required_count: number;
  available_volunteers: number;
  variance: number; // calculated: available_volunteers - required_count
}

export interface AttendanceReportData {
  task_id: number;
  task_name: string;
  timeslot_id: number;
  timeslot_name: string;
  location_id: number;
  location_name: string;
  assigned_volunteers: number;
  actual_attendance: number;
  attendance_rate?: number; // calculated: actual_attendance / assigned_volunteers
  // Include any other fields from vw_availability_vs_actual_attendance
}

// Generic data type for the hook, can be union of specific report types
export type GenericReportData = VarianceReportData | AttendanceReportData;
