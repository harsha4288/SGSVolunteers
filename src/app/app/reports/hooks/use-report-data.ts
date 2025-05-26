// src/app/app/reports/hooks/use-report-data.ts
"use client";

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { createReportsService } from '../services/reports-service';
import type { 
  ReportType, 
  VarianceSummaryData, 
  RequirementDetailData, 
  AttendanceReportData, 
  GenericReportData 
} from '../types';

interface UseReportDataProps {
  reportType: ReportType;
}

export function useReportData({ reportType }: UseReportDataProps) {
  const [supabase] = React.useState(() => createClient());
  const [reportsService] = React.useState(() => createReportsService({ supabase }));
  const { toast } = useToast();

  const [data, setData] = React.useState<GenericReportData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadReportData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (reportType === 'varianceSummary') {
        const rawData = await reportsService.fetchVarianceSummaryData();
        // overall_variance is already in the view, so no client-side calculation needed
        setData(rawData as VarianceSummaryData[]);
      } else if (reportType === 'requirementDetails') {
        const rawData = await reportsService.fetchRequirementDetailsData();
        setData(rawData as RequirementDetailData[]);
      } else if (reportType === 'attendance') {
        const rawData = await reportsService.fetchAttendanceReportData();
        const processedData: AttendanceReportData[] = rawData.map(item => ({
          ...item,
          attendance_rate: item.assigned_volunteers_count > 0 
            ? (item.actual_attendance_count / item.assigned_volunteers_count) * 100 
            : 0,
        }));
        setData(processedData);
      }
    } catch (e: any) {
      const errorMessage = e instanceof Error ? e.message : `Failed to load ${reportType} report data`;
      setError(errorMessage);
      toast({ title: `Error Loading ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`, description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [reportsService, toast, reportType]);

  React.useEffect(() => {
    loadReportData();
  }, [loadReportData, reportType]); // Reload if reportType changes

  return {
    data,
    loading,
    error,
    reportType,
    refreshReportData: loadReportData,
  };
}

export type ReportDataHookResult = ReturnType<typeof useReportData>;
