// src/app/app/reports/components/views/requirements-by-location-view.tsx
"use client";

import * as React from 'react';
import { useReportData } from '../../../hooks/use-report-data'; // Adjusted path
import { ReportDisplay } from '../../common/report-display'; // Adjusted path
import type { RequirementsByLocationData, ReportFilters } from '../../../types'; // Adjusted path
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface RequirementsByLocationViewProps {
  filters: ReportFilters;
}

export function RequirementsByLocationView({ filters }: RequirementsByLocationViewProps) {
  const { data, loading, error, refreshData } = useReportData({ 
    reportType: 'requirements_by_location', 
    initialFilters: filters 
  });

  // Effect to refresh data when filters prop changes.
  // The hook's internal useEffect for currentFilters changes handles the actual re-fetch.
  React.useEffect(() => {
    refreshData();
  }, [filters, refreshData]);

  const columns = [
    { accessorKey: 'category_name', header: 'Seva Category' },
    { accessorKey: 'location_name', header: 'Location' },
    { accessorKey: 'slot_name', header: 'Timeslot' },
    { accessorKey: 'required_count', header: 'Required Count', align: 'center' as 'center' },
  ];

  const reportData = data as RequirementsByLocationData[];
  
  // Charting this data can be complex. A simple bar chart might group by Seva Category and sum required_count,
  // or by location. For detailed breakdown, the table is primary.
  // For this example, let's chart total requirements per Seva Category.
  // More advanced charting could involve drill-downs or stacked bars if library supports it easily.
  
  // Charting this detailed data directly can be dense. 
  // The ReportDisplay component will attempt to chart based on the provided data.
  // For a meaningful chart, data might need pre-aggregation before being passed to ReportDisplay,
  // or ReportDisplay itself would need more complex charting options (e.g., allowing grouping).
  // For now, we'll pass the detailed data and configure a simple chart.
  // A more practical chart might sum `required_count` per `category_name` or `location_name`.

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
    <ReportDisplay<RequirementsByLocationData> 
      title="Requirements Breakdown by Location"
      data={reportData} 
      columns={columns}
      // Chart: Sum of required_count per category_name.
      // This requires ReportDisplay to handle aggregation or the data to be pre-aggregated for the chart.
      // As ReportDisplay is generic, pre-aggregation or specific chart logic here would be better.
      // For simplicity, let's use category_name as X-axis and sum of required_count as Y-axis.
      // This will result in multiple bars for the same category if there are multiple locations/timeslots.
      // A better chart would aggregate this first. Let's assume ReportDisplay can plot this directly for now.
      chartDataKey="category_name" 
      chartValueKeys={[
        { key: 'required_count', name: 'Required Count', color: 'hsl(var(--chart-1))' },
      ]}
      loading={loading}
      error={null} // Error handled above for empty data case
      onRefresh={refreshData}
      reportTypeForId="reqsByLocation" // Unique ID for chart
      emptyStateMessage="No data available for the selected filters. Try adjusting your filter criteria."
    />
  );
}
