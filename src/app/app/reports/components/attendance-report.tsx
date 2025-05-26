// src/app/app/reports/components/attendance-report.tsx
"use client";

import * as React from 'react';
import { useReportData } from '../hooks/use-report-data';
import { ReportDisplay } from './common/report-display';
import type { AttendanceReportData } from '../types';

export function AttendanceReport() {
  // reportType is already 'attendance' in the hook, which matches the updated types
  const { data, loading, error, refreshReportData } = useReportData({ reportType: 'attendance' }); 

  const columns = [
    { accessorKey: 'task_name', header: 'Seva Category (Task)' },
    { accessorKey: 'assigned_location_name', header: 'Location' },
    { accessorKey: 'timeslot_slot_name', header: 'Timeslot' },
    { accessorKey: 'timeslot_description', header: 'Timeslot Description' },
    { accessorKey: 'assigned_volunteers_count', header: 'Assigned', align: 'center' as 'center' },
    { accessorKey: 'actual_attendance_count', header: 'Attended', align: 'center' as 'center' },
    { accessorKey: 'attendance_rate', header: 'Attendance Rate (%)', align: 'center' as 'center',
      cell: (row: AttendanceReportData) => `${row.attendance_rate?.toFixed(1) || '0.0'}%`,
    },
  ];
  
  // Cast data for type safety
  const attendanceData = data as AttendanceReportData[];

  return (
    <ReportDisplay<AttendanceReportData>
      title="Attendance Report (Assigned vs. Actual)" // Updated title
      data={attendanceData}
      columns={columns}
      chartDataKey="task_name" // Group by task for chart
      chartValueKeys={[
        { key: 'assigned_volunteers_count', name: 'Assigned', color: 'hsl(var(--chart-3))' },
        { key: 'actual_attendance_count', name: 'Attended', color: 'hsl(var(--chart-4))' },
      ]}
      loading={loading}
      error={error}
      onRefresh={refreshReportData}
      reportTypeForId="attendance" // This ID is for chart config, can remain 'attendance'
    />
  );
}
