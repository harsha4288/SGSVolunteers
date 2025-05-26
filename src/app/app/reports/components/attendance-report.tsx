// src/app/app/reports/components/attendance-report.tsx
"use client";

import * as React from 'react';
import { useReportData } from '../hooks/use-report-data';
import { ReportDisplay } from './common/report-display';
import type { AttendanceReportData } from '../types';

export function AttendanceReport() {
  const { data, loading, error, refreshReportData } = useReportData({ reportType: 'attendance' });

  const columns = [
    { accessorKey: 'task_name', header: 'Task' },
    { accessorKey: 'location_name', header: 'Location' },
    { accessorKey: 'timeslot_name', header: 'Timeslot' },
    { accessorKey: 'assigned_volunteers', header: 'Assigned', align: 'center' as 'center' },
    { accessorKey: 'actual_attendance', header: 'Attended', align: 'center' as 'center' },
    { accessorKey: 'attendance_rate', header: 'Attendance Rate (%)', align: 'center' as 'center',
      cell: (row: AttendanceReportData) => `${row.attendance_rate?.toFixed(1) || '0.0'}%`,
    },
  ];
  
  // Cast data for type safety
  const attendanceData = data as AttendanceReportData[];

  return (
    <ReportDisplay<AttendanceReportData>
      title="Attendance Report (Availability vs. Actual)"
      data={attendanceData}
      columns={columns}
      chartDataKey="task_name" // Example: group by task for chart
      chartValueKeys={[
        { key: 'assigned_volunteers', name: 'Assigned', color: 'hsl(var(--chart-3))' },
        { key: 'actual_attendance', name: 'Attended', color: 'hsl(var(--chart-4))' },
      ]}
      loading={loading}
      error={error}
      onRefresh={refreshReportData}
      reportTypeForId="attendance"
    />
  );
}
