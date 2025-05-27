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
        .from('vw_requirements_vs_assignments')
        .select('total_required, assigned_volunteers');

      if (varianceError) {
        console.warn('Variance view not available, using fallback calculation:', varianceError.message);
        // Fallback: calculate from volunteer commitments
        const { count: assignmentCount } = await supabase
          .from('volunteer_commitments')
          .select('id', { count: 'exact', head: true })
          .eq('commitment_type', 'ASSIGNED_TASK');

        const tasksFilledPercentage = assignmentCount ? Math.min(100, (assignmentCount / 10) * 100) : 0; // Rough estimate
        setStats(prev => ({ ...prev, tasksFilledPercentage: parseFloat(tasksFilledPercentage.toFixed(1)) }));
      } else {
        let filledTasks = 0;
        let relevantTasks = 0;
        varianceData?.forEach(item => {
          if (item.total_required > 0) {
            relevantTasks++;
            if (item.assigned_volunteers >= item.total_required) {
              filledTasks++;
            }
          }
        });
        const tasksFilledPercentage = relevantTasks > 0 ? (filledTasks / relevantTasks) * 100 : 0;
        setStats(prev => ({ ...prev, tasksFilledPercentage: parseFloat(tasksFilledPercentage.toFixed(1)) }));
      }

      // 3. Fetch Data for Overall Attendance Percentage
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('vw_assignments_vs_attendance')
        .select('assigned_volunteers_count, actual_attendance_count');

      if (attendanceError) {
        console.warn('Attendance view not available, using fallback calculation:', attendanceError.message);
        // Fallback: calculate from check-ins
        const { count: checkInCount } = await supabase
          .from('volunteer_check_ins')
          .select('id', { count: 'exact', head: true });

        const overallAttendancePercentage = checkInCount ? Math.min(100, (checkInCount / 5) * 100) : 0; // Rough estimate
        setStats(prev => ({ ...prev, overallAttendancePercentage: parseFloat(overallAttendancePercentage.toFixed(1)) }));
      } else {
        let totalAssigned = 0;
        let totalAttended = 0;
        attendanceData?.forEach(item => {
          totalAssigned += item.assigned_volunteers_count || 0;
          totalAttended += item.actual_attendance_count || 0;
        });
        const overallAttendancePercentage = totalAssigned > 0 ? (totalAttended / totalAssigned) * 100 : 0;
        setStats(prev => ({ ...prev, overallAttendancePercentage: parseFloat(overallAttendancePercentage.toFixed(1)) }));
      }

      // Set the volunteer count (this should always work)
      setStats(prev => ({ ...prev, totalVolunteers: volunteerCount || 0 }));

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
