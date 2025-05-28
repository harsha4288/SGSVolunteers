// src/app/app/reports/components/views/requirements-vs-assignments-view.tsx
"use client";

import * as React from 'react';
import { useReportData } from '../../hooks/use-report-data';
import { ReportDisplay } from '../common/report-display';
import type { RequirementsVsAssignmentsData, ReportFilters } from '../../types';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface RequirementsVsAssignmentsViewProps {
  filters: ReportFilters;
}

export function RequirementsVsAssignmentsView({ filters }: RequirementsVsAssignmentsViewProps) {
  const { data, loading, error, refreshData } = useReportData({
    reportType: 'requirements_vs_assignments',
    initialFilters: filters
  });

  // React.useEffect to re-fetch data when filters change from parent
  React.useEffect(() => {
    refreshData();
  }, [filters, refreshData]);

  const columns = [
    { accessorKey: 'category_name', header: 'Seva Category' },
    { accessorKey: 'slot_name', header: 'Timeslot' },
    { accessorKey: 'total_required', header: 'Total Required', align: 'center' as 'center' },
    { accessorKey: 'assigned_volunteers', header: 'Assigned', align: 'center' as 'center' },
    { accessorKey: 'variance', header: 'Variance (Assigned - Req)', align: 'center' as 'center',
      cell: (row: RequirementsVsAssignmentsData) => (
        <span className={row.variance < 0 ? 'text-red-500 font-semibold' : row.variance > 0 ? 'text-green-500 font-semibold' : 'text-muted-foreground'}>
          {row.variance}
        </span>
      ),
    },
  ];

  const reportData = data as RequirementsVsAssignmentsData[];

  if (error && !loading && data.length === 0) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Report Data</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <ReportDisplay<RequirementsVsAssignmentsData>
      title="Requirements vs. Assignments Variance"
      data={reportData}
      columns={columns}
      chartDataKey="category_name"
      chartValueKeys={[
        { key: 'total_required', name: 'Total Required', color: 'hsl(var(--chart-1))' },
        { key: 'assigned_volunteers', name: 'Assigned Volunteers', color: 'hsl(var(--chart-2))' },
      ]}
      loading={loading}
      error={null}
      onRefresh={refreshData}
      reportTypeForId="reqsVsAssignments"
      emptyStateMessage="No data available for the selected filters. Try adjusting your filter criteria."
    />
  );
}
