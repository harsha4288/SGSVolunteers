// src/app/app/reports/components/variance-report.tsx
"use client";

import * as React from 'react';
import { useReportData } from '../hooks/use-report-data';
import { ReportDisplay } from './common/report-display';
import type { VarianceReportData } from '../types';

export function VarianceReport() {
  const { data, loading, error, refreshReportData } = useReportData({ reportType: 'variance' });

  const columns = [
    { accessorKey: 'task_name', header: 'Task' },
    { accessorKey: 'location_name', header: 'Location' },
    { accessorKey: 'timeslot_name', header: 'Timeslot' },
    { accessorKey: 'required_count', header: 'Required', align: 'center' as 'center' },
    { accessorKey: 'available_volunteers', header: 'Available', align: 'center' as 'center' },
    { accessorKey: 'variance', header: 'Variance (Avail - Req)', align: 'center' as 'center',
      cell: (row: VarianceReportData) => (
        <span className={row.variance < 0 ? 'text-red-500' : row.variance > 0 ? 'text-green-500' : 'text-muted-foreground'}>
          {row.variance}
        </span>
      ),
    },
  ];

  // Cast data to VarianceReportData[] for type safety with ReportDisplay
  const varianceData = data as VarianceReportData[];

  return (
    <ReportDisplay<VarianceReportData>
      title="Variance Report (Requirements vs. Availability)"
      data={varianceData}
      columns={columns}
      chartDataKey="task_name" // Example: group by task for chart
      chartValueKeys={[
        { key: 'required_count', name: 'Required', color: 'hsl(var(--chart-1))' },
        { key: 'available_volunteers', name: 'Available', color: 'hsl(var(--chart-2))' },
      ]}
      loading={loading}
      error={error}
      onRefresh={refreshReportData}
      reportTypeForId="variance"
    />
  );
}
