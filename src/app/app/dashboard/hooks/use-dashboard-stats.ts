// src/app/app/dashboard/hooks/use-dashboard-stats.ts
"use client";

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast'; 
import type { Database } from '@/lib/types/supabase'; // For Supabase client type

export function useDashboardStats() {
  const [supabase] = React.useState(() => createClient<Database>()); // Typed Supabase client
  const { toast } = useToast();

  const [stats, setStats] = React.useState({
    totalVolunteers: 0,
    tasksFilledPercentage: 0,
    overallAttendancePercentage: 0,
  });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadStats = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Total Volunteers
      const { count: volunteerCount, error: volunteerError } = await supabase
        .from('volunteers')
        .select('id', { count: 'exact', head: true });

      if (volunteerError) throw new Error(`Failed to fetch total volunteers: ${volunteerError.message}`);
      
      // 2. Fetch Data for Tasks Filled Percentage
      const { data: varianceData, error: varianceError } = await supabase
        .from('vw_seva_timeslot_variance_summary')
        .select('total_required_count, total_available_volunteers');

      if (varianceError) throw new Error(`Failed to fetch variance summary: ${varianceError.message}`);

      let filledTasks = 0;
      let relevantTasks = 0;
      varianceData?.forEach(item => {
        if (item.total_required_count > 0) {
          relevantTasks++;
          if (item.total_available_volunteers >= item.total_required_count) {
            filledTasks++;
          }
        }
      });
      const tasksFilledPercentage = relevantTasks > 0 ? (filledTasks / relevantTasks) * 100 : 0; // Or 100 if no relevant tasks

      // 3. Fetch Data for Overall Attendance Percentage
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('vw_assignments_vs_attendance')
        .select('assigned_volunteers_count, actual_attendance_count');
      
      if (attendanceError) throw new Error(`Failed to fetch attendance data: ${attendanceError.message}`);

      let totalAssigned = 0;
      let totalAttended = 0;
      attendanceData?.forEach(item => {
        totalAssigned += item.assigned_volunteers_count || 0;
        totalAttended += item.actual_attendance_count || 0;
      });
      const overallAttendancePercentage = totalAssigned > 0 ? (totalAttended / totalAssigned) * 100 : 0; // Or 100 if no assignments

      setStats({
        totalVolunteers: volunteerCount || 0,
        tasksFilledPercentage: parseFloat(tasksFilledPercentage.toFixed(1)), // Keep one decimal place
        overallAttendancePercentage: parseFloat(overallAttendancePercentage.toFixed(1)), // Keep one decimal place
      });

    } catch (e: any) {
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred while fetching dashboard stats.";
      setError(errorMessage);
      toast({ title: "Error Loading Dashboard Stats", description: errorMessage, variant: "destructive" });
      // Keep existing stats or reset, based on preference. Resetting to 0 for now.
      setStats({ totalVolunteers: 0, tasksFilledPercentage: 0, overallAttendancePercentage: 0 });
    } finally {
      setLoading(false);
    }
  }, [supabase, toast]); 

  React.useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error, // Expose error state
    refreshStats: loadStats,
  };
}
