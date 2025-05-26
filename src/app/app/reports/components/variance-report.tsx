// src/app/app/reports/components/variance-report.tsx
"use client";

import * as React from 'react';
import { useReportData } from '../hooks/use-report-data';
import { ReportDisplay } from './common/report-display';
import type { VarianceSummaryData } from '../types'; // Updated type import

export function VarianceReport() {
  const { data, loading, error, refreshReportData } = useReportData({ reportType: 'varianceSummary' }); // Updated reportType

  const columns = [
    { accessorKey: 'task_name', header: 'Seva Category (Task)' },
    { accessorKey: 'timeslot_slot_name', header: 'Timeslot' },
    { accessorKey: 'timeslot_description', header: 'Timeslot Description' },
    { accessorKey: 'total_required_count', header: 'Total Required', align: 'center' as 'center' },
    { accessorKey: 'total_available_volunteers', header: 'Total Available', align: 'center' as 'center' },
    { accessorKey: 'overall_variance', header: 'Overall Variance', align: 'center' as 'center',
      cell: (row: VarianceSummaryData) => ( // Updated type for row
        <span className={row.overall_variance < 0 ? 'text-red-500' : row.overall_variance > 0 ? 'text-green-500' : 'text-muted-foreground'}>
          {row.overall_variance}
        </span>
      ),
    },
  ];

  // Cast data to VarianceSummaryData[] for type safety with ReportDisplay
  const varianceSummaryData = data as VarianceSummaryData[]; // Updated variable name and type

  return (
    <ReportDisplay<VarianceSummaryData> // Updated type for ReportDisplay
      title="Variance Summary Report (Seva Category / Timeslot)" // Updated title
      data={varianceSummaryData} // Updated data prop
      columns={columns}
      chartDataKey="task_name" // Group by task for chart (can be changed to timeslot_slot_name if preferred)
      chartValueKeys={[
        { key: 'total_required_count', name: 'Total Required', color: 'hsl(var(--chart-1))' },
        { key: 'total_available_volunteers', name: 'Total Available', color: 'hsl(var(--chart-2))' },
      ]}
      loading={loading}
      error={error}
      onRefresh={refreshReportData}
      reportTypeForId="varianceSummary" // Updated reportTypeForId
    />
  );
}
