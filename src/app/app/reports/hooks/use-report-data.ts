// src/app/app/reports/hooks/use-report-data.ts
"use client";

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { createReportsService } from '../services/reports-service';
import type { ReportType, VarianceReportData, AttendanceReportData, GenericReportData } from '../types';

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
      if (reportType === 'variance') {
        const rawData = await reportsService.fetchVarianceReportData();
        const processedData: VarianceReportData[] = rawData.map(item => ({
          ...item,
          variance: item.available_volunteers - item.required_count,
        }));
        setData(processedData);
      } else if (reportType === 'attendance') {
        const rawData = await reportsService.fetchAttendanceReportData();
        const processedData: AttendanceReportData[] = rawData.map(item => ({
          ...item,
          attendance_rate: item.assigned_volunteers > 0 ? (item.actual_attendance / item.assigned_volunteers) * 100 : 0,
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
