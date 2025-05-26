// src/app/app/reports/services/reports-service.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/supabase';
import type { ReportType, VarianceReportData, AttendanceReportData } from '../types';

interface ReportsServiceProps {
  supabase: SupabaseClient<Database>;
}

export function createReportsService({ supabase }: ReportsServiceProps) {
  const handleError = (error: any, context: string) => {
    console.error(`Error in ${context}:`, error);
    throw new Error(`Failed to ${context.toLowerCase()}.`);
  };

  const fetchVarianceReportData = async (): Promise<Omit<VarianceReportData, 'variance'>[]> => {
    // Data directly from the view
    const { data, error } = await supabase.from('vw_requirements_vs_availability').select('*');
    if (error) handleError(error, 'fetch variance report data');
    return data || [];
  };

  const fetchAttendanceReportData = async (): Promise<Omit<AttendanceReportData, 'attendance_rate'>[]> => {
    // Data directly from the view
    const { data, error } = await supabase.from('vw_availability_vs_actual_attendance').select('*');
    if (error) handleError(error, 'fetch attendance report data');
    return data || [];
  };

  return {
    fetchVarianceReportData,
    fetchAttendanceReportData,
  };
}
