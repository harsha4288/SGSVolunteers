// src/app/app/reports/hooks/use-report-data.ts
"use client";

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { createReportsService } from '../services/reports-service';
import type { 
  ReportType, 
  ReportFilters,
  RequirementsVsAssignmentsData,
  RequirementsByLocationData,
  AssignmentsVsAttendanceData,
  GenericReportData 
} from '../types';

interface UseReportDataProps {
  reportType: ReportType;
  initialFilters?: ReportFilters; // Allow passing initial filters
}

export function useReportData({ reportType, initialFilters = {} }: UseReportDataProps) {
  const [supabase] = React.useState(() => createClient());
  const [reportsService] = React.useState(() => createReportsService({ supabase }));
  const { toast } = useToast();

  const [data, setData] = React.useState<GenericReportData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = React.useState<ReportFilters>(initialFilters);

  const loadReportData = React.useCallback(async (filtersToApply: ReportFilters) => {
    setLoading(true);
    setError(null);
    try {
      let rawData: GenericReportData[] = [];
      if (reportType === 'requirements_vs_assignments') {
        rawData = await reportsService.fetchRequirementsVsAssignments(filtersToApply) as RequirementsVsAssignmentsData[];
        // Variance is already calculated in the view.
      } else if (reportType === 'requirements_by_location') {
        rawData = await reportsService.fetchRequirementsByLocation(filtersToApply) as RequirementsByLocationData[];
      } else if (reportType === 'assignments_vs_attendance') {
        const fetchedData = await reportsService.fetchAssignmentsVsAttendance(filtersToApply);
        // Client-side calculation for attendance_rate
        rawData = fetchedData.map(item => ({
          ...item,
          attendance_rate: item.assigned_volunteers_count > 0 
            ? (item.actual_attendance_count / item.assigned_volunteers_count) * 100 
            : 0,
        })) as AssignmentsVsAttendanceData[];
      }
      setData(rawData);
    } catch (e: any) {
      const errorMessage = e instanceof Error ? e.message : `Failed to load ${reportType} report data`;
      setError(errorMessage);
      toast({ title: `Error Loading Report`, description: errorMessage, variant: "destructive" });
      setData([]); // Clear data on error
    } finally {
      setLoading(false);
    }
  }, [reportsService, toast, reportType]); // reportType dependency ensures correct service call

  // Initial load and when filters or reportType change
  React.useEffect(() => {
    loadReportData(currentFilters);
  }, [loadReportData, currentFilters, reportType]);

  // Function to update filters and trigger data reload
  const applyFilters = (newFilters: ReportFilters) => {
    setCurrentFilters(newFilters);
    // The useEffect above will trigger reloadReportData due to currentFilters change
  };

  // Function to manually refresh data with current filters
  const refreshData = () => {
    loadReportData(currentFilters);
  };

  return {
    data,
    loading,
    error,
    reportType,
    currentFilters,
    applyFilters, // Expose function to apply new filters
    refreshData,  // Expose function to manually refresh
  };
}

export type ReportDataHookResult = ReturnType<typeof useReportData>;
