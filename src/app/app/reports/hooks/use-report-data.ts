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
import debounce from 'lodash/debounce';

interface UseReportDataProps {
  reportType: ReportType;
  initialFilters?: ReportFilters; // Allow passing initial filters
}

// Cache implementation
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const dataCache = new Map<string, { data: any; timestamp: number }>();

const getCacheKey = (reportType: string, filters: ReportFilters) => {
  return `${reportType}-${JSON.stringify(filters)}`;
};

export function useReportData({ reportType, initialFilters = {} }: UseReportDataProps) {
  const [supabase] = React.useState(() => createClient());
  const [reportsService] = React.useState(() => createReportsService({ supabase }));
  const { toast } = useToast();

  const [data, setData] = React.useState<GenericReportData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = React.useState<ReportFilters>(initialFilters);

  // Debounced load function
  const debouncedLoadData = React.useCallback(
    debounce(async (filtersToApply: ReportFilters) => {
      const cacheKey = getCacheKey(reportType, filtersToApply);
      const cachedData = dataCache.get(cacheKey);

      if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
        setData(cachedData.data);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        let rawData: GenericReportData[] = [];
        if (reportType === 'requirements_vs_assignments') {
          rawData = await reportsService.fetchRequirementsVsAssignments(filtersToApply).catch(() => []);
        } else if (reportType === 'requirements_by_location') {
          rawData = await reportsService.fetchRequirementsByLocation(filtersToApply).catch(() => []);
        } else if (reportType === 'assignments_vs_attendance') {
          const fetchedData = await reportsService.fetchAssignmentsVsAttendance(filtersToApply).catch(() => []);
          rawData = fetchedData.map(item => ({
            ...item,
            attendance_rate: item.assigned_volunteers_count > 0
              ? (item.actual_attendance_count / item.assigned_volunteers_count) * 100
              : 0,
          }));
        }

        // Update cache
        dataCache.set(cacheKey, {
          data: rawData,
          timestamp: Date.now()
        });

        setData(rawData);
      } catch (e: any) {
        const errorMessage = e instanceof Error ? e.message : `Failed to load ${reportType} report data`;
        setError(errorMessage);
        console.warn('Reports module data loading failed:', errorMessage);
        setData([]);
      } finally {
        setLoading(false);
      }
    }, 500), // 500ms debounce
    [reportsService, reportType]
  );

  // Initial load and when filters change
  React.useEffect(() => {
    debouncedLoadData(currentFilters);
    return () => {
      debouncedLoadData.cancel(); // Cancel pending debounced calls on cleanup
    };
  }, [debouncedLoadData, currentFilters]);

  const refreshData = React.useCallback(() => {
    // Clear cache for this report type
    const cacheKey = getCacheKey(reportType, currentFilters);
    dataCache.delete(cacheKey);
    debouncedLoadData(currentFilters);
  }, [debouncedLoadData, currentFilters, reportType]);

  return {
    data,
    loading,
    error,
    reportType,
    currentFilters,
    applyFilters: setCurrentFilters,
    refreshData,
  };
}

export type ReportDataHookResult = ReturnType<typeof useReportData>;
