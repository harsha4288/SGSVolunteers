// src/app/app/reports/services/reports-service.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/supabase';
import type { 
  RequirementsVsAssignmentsData,
  RequirementsByLocationData,
  AssignmentsVsAttendanceData,
  ReportFilters 
} from '../types';

interface ReportsServiceProps {
  supabase: SupabaseClient<Database>;
}

export function createReportsService({ supabase }: ReportsServiceProps) {
  const handleError = (error: any, context: string) => {
    console.error(`Error in ${context}:`, error);
    throw new Error(`Failed to ${context.toLowerCase()}. ${error.message || ''}`);
  };

  // Fetch data for Requirements vs. Assignments report
  const fetchRequirementsVsAssignments = async (filters?: ReportFilters): Promise<RequirementsVsAssignmentsData[]> => {
    let query = supabase.from('vw_requirements_vs_assignments').select('*');

    // Apply filters - This is illustrative. Actual filters depend on view columns and filter UI.
    // The views currently do not have event_id, date, or direct location_id/timeslot_id at the top level for easy filtering.
    // These filters would be more effective if the views themselves incorporated these IDs,
    // or if we filter on related tables (e.g. requirements.event_id if it existed).
    // For now, showing how filters *could* be applied if view structure supported them.
    if (filters?.sevaCategoryIds && filters.sevaCategoryIds.length > 0) {
      query = query.in('seva_category_id', filters.sevaCategoryIds);
    }
    if (filters?.timeslotIds && filters.timeslotIds.length > 0) {
      query = query.in('timeslot_id', filters.timeslotIds);
    }
    // Date range filters would require date columns in the view.
    // Event ID filters would require event_id columns in the view.

    const { data, error } = await query;
    if (error) handleError(error, 'fetch requirements vs assignments data');
    return data || [];
  };

  // Fetch data for Requirements by Location report
  const fetchRequirementsByLocation = async (filters?: ReportFilters): Promise<RequirementsByLocationData[]> => {
    let query = supabase.from('vw_requirements_by_location').select('*');

    if (filters?.sevaCategoryIds && filters.sevaCategoryIds.length > 0) {
      query = query.in('seva_category_id', filters.sevaCategoryIds);
    }
    if (filters?.locationIds && filters.locationIds.length > 0) {
      query = query.in('location_id', filters.locationIds);
    }
    if (filters?.timeslotIds && filters.timeslotIds.length > 0) {
      query = query.in('timeslot_id', filters.timeslotIds);
    }
    // Event ID / Date range filters would need those columns in the view or related tables.

    const { data, error } = await query;
    if (error) handleError(error, 'fetch requirements by location data');
    return data || [];
  };

  // Fetch data for Assignments vs. Attendance report
  // The view vw_assignments_vs_attendance has task_id (seva_category_id) and timeslot_slot_name
  const fetchAssignmentsVsAttendance = async (filters?: ReportFilters): Promise<Omit<AssignmentsVsAttendanceData, 'attendance_rate'>[]> => {
    let query = supabase.from('vw_assignments_vs_attendance')
      .select('task_id, task_name, timeslot_slot_name, timeslot_description, assigned_volunteers_count, actual_attendance_count');
      // Note: The view vw_assignments_vs_attendance in fix_requirements_schema.sql does not group by location_id.
      // If location filtering is needed here, the view must be adapted or we filter on a related field if available.

    if (filters?.sevaCategoryIds && filters.sevaCategoryIds.length > 0) {
      query = query.in('task_id', filters.sevaCategoryIds); // task_id in view maps to seva_category_id
    }
    // Filtering by timeslot_id would require timeslot_id to be part of the view's SELECT and GROUP BY.
    // Currently, only timeslot_slot_name and timeslot_description are available.
    // If timeslot_ids filter is based on a list of names, then:
    // if (filters?.timeslotIds && filters.timeslotIds.length > 0) {
    //   const { data: timeslotMap, error: tsError } = await supabase.from('time_slots').select('id, slot_name').in('id', filters.timeslotIds);
    //   if (tsError) console.error("Error fetching timeslot names for filter", tsError);
    //   else if (timeslotMap) query = query.in('timeslot_slot_name', timeslotMap.map(ts => ts.slot_name));
    // }


    const { data, error } = await query;
    if (error) handleError(error, 'fetch assignments vs attendance data');
    
    // Ensure all fields defined in Omit<AssignmentsVsAttendanceData, 'attendance_rate'> are returned
    // The select statement above matches the fields in AssignmentsVsAttendanceData (excluding attendance_rate)
    return (data || []).map(item => ({
        task_id: item.task_id,
        task_name: item.task_name,
        timeslot_slot_name: item.timeslot_slot_name,
        timeslot_description: item.timeslot_description,
        // The view vw_assignments_vs_attendance does not have assigned_location_id/name.
        // These were in the old AttendanceReportData type but removed from the new view.
        // If they are needed, the view must be updated. For now, they are not in the type.
        assigned_volunteers_count: item.assigned_volunteers_count,
        actual_attendance_count: item.actual_attendance_count,
    }));
  };

  return {
    fetchRequirementsVsAssignments,
    fetchRequirementsByLocation,
    fetchAssignmentsVsAttendance,
  };
}
