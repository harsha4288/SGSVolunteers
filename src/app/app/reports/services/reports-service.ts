// src/app/app/reports/services/reports-service.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/supabase';
import type { VarianceSummaryData, RequirementDetailData, AttendanceReportData } from '../types';

interface ReportsServiceProps {
  supabase: SupabaseClient<Database>;
}

export function createReportsService({ supabase }: ReportsServiceProps) {
  const handleError = (error: any, context: string) => {
    console.error(`Error in ${context}:`, error);
    throw new Error(`Failed to ${context.toLowerCase()}.`);
  };

  const fetchVarianceSummaryData = async (): Promise<VarianceSummaryData[]> => {
    // Data directly from the view, no client-side calculation needed for 'overall_variance'
    const { data, error } = await supabase.from('vw_seva_timeslot_variance_summary').select('*');
    if (error) handleError(error, 'fetch variance summary data');
    return data || [];
  };

  const fetchRequirementDetailsData = async (): Promise<RequirementDetailData[]> => {
    const { data, error } = await supabase.from('vw_requirement_details').select('*');
    if (error) handleError(error, 'fetch requirement details data');
    return data || [];
  };

  const fetchAttendanceReportData = async (): Promise<Omit<AttendanceReportData, 'attendance_rate'>[]> => {
    // Data directly from the view, 'attendance_rate' will be calculated client-side
    const { data, error } = await supabase
      .from('vw_assignments_vs_attendance')
      .select('task_id, task_name, timeslot_slot_name, timeslot_description, assigned_location_id, assigned_location_name, assigned_volunteers_count, actual_attendance_count');
    if (error) handleError(error, 'fetch attendance report data');
    return data || [];
  };

  return {
    fetchVarianceSummaryData,
    fetchRequirementDetailsData,
    fetchAttendanceReportData,
  };
}
