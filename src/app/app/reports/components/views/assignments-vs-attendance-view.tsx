// src/app/app/reports/components/views/assignments-vs-attendance-view.tsx
"use client";

import * as React from 'react';
import { useReportData } from '../../../hooks/use-report-data'; // Adjusted path
import { ReportDisplay } from '../../common/report-display'; // Adjusted path
import type { AssignmentsVsAttendanceData, ReportFilters } from '../../../types'; // Adjusted path
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface AssignmentsVsAttendanceViewProps {
  filters: ReportFilters;
}

export function AssignmentsVsAttendanceView({ filters }: AssignmentsVsAttendanceViewProps) {
  const { data, loading, error, refreshData, applyFilters } = useReportData({ 
    reportType: 'assignments_vs_attendance', 
    initialFilters: filters 
  });

  // Effect to re-apply filters when the filters prop changes from the parent page
  React.useEffect(() => {
    applyFilters(filters);
  }, [filters, applyFilters]); // Dependency on applyFilters which is stable

  const columns = [
    { accessorKey: 'task_name', header: 'Seva Category (Task)' },
    { accessorKey: 'timeslot_slot_name', header: 'Timeslot' },
    // Location details are not in the current vw_assignments_vs_attendance view.
    // If added to view, columns like 'assigned_location_name' could be included here.
    { accessorKey: 'assigned_volunteers_count', header: 'Assigned', align: 'center' as 'center' },
    { accessorKey: 'actual_attendance_count', header: 'Attended', align: 'center' as 'center' },
    { accessorKey: 'attendance_rate', header: 'Attendance Rate (%)', align: 'center' as 'center',
      cell: (row: AssignmentsVsAttendanceData) => `${row.attendance_rate?.toFixed(1) || '0.0'}%`,
    },
  ];

  const reportData = data as AssignmentsVsAttendanceData[];

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
    <ReportDisplay<AssignmentsVsAttendanceData>
      title="Assignments vs. Actual Attendance"
      data={reportData}
      columns={columns}
      chartDataKey="task_name" 
      chartValueKeys={[
        { key: 'assigned_volunteers_count', name: 'Assigned', color: 'hsl(var(--chart-3))' },
        { key: 'actual_attendance_count', name: 'Attended', color: 'hsl(var(--chart-4))' },
      ]}
      loading={loading}
      error={null} // Error handled above for empty data case
      onRefresh={refreshData}
      reportTypeForId="assignmentsVsAttendance" // Unique ID for chart
      emptyStateMessage="No attendance data available for the selected filters. Try adjusting your filter criteria."
    />
  );
}
