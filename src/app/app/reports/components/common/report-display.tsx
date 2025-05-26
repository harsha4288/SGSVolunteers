// src/app/app/reports/components/common/report-display.tsx
"use client";

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableHead, DataTableCell } from '@/components/ui/data-table';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { BarChart, CartesianGrid, XAxis, YAxis, Bar, Tooltip } from 'recharts'; // Assuming recharts, Tooltip from recharts
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button'; // Added Button import
import { RefreshCw, AlertCircle } from 'lucide-react';

// Define a more specific type for columns if possible, or use a generic one
interface ColumnDef<T extends object> { // Made ColumnDef generic
  accessorKey: keyof T | string; // Allow string for nested or custom keys
  header: string;
  cell?: (data: T) => React.ReactNode; // For custom cell rendering
  align?: 'left' | 'center' | 'right';
}

interface ReportDisplayProps<T extends object> {
  title: string;
  data: T[];
  columns: ColumnDef<T>[]; // Use generic ColumnDef
  chartDataKey: keyof T; 
  chartValueKeys: Array<{ key: keyof T; name: string; color: string }>; 
  loading: boolean;
  error?: string | null;
  onRefresh: () => void;
  reportTypeForId: string; 
}

export function ReportDisplay<T extends { [key: string]: any }>({
  title,
  data,
  columns,
  chartDataKey,
  chartValueKeys,
  loading,
  error,
  onRefresh,
  reportTypeForId
}: ReportDisplayProps<T>) {

  const chartConfig = chartValueKeys.reduce((acc, val) => {
    acc[val.key as string] = { label: val.name, color: val.color };
    return acc;
  }, {} as any);
  
  const uniqueChartId = `report-chart-${reportTypeForId}`;


  if (loading && data.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full mb-4" />
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive p-4 border border-destructive bg-destructive/10 rounded-md">
            <AlertCircle className="h-5 w-5" />
            <p>Error loading report: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!loading && data.length === 0 && !error) { // Added !error condition
     return (
      <Card>
        <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">No data available for this report.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading}>
          {loading && data.length === 0 ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Chart Section */}
        {data.length > 0 && chartValueKeys.length > 0 && (
          <div className="h-[350px] w-full"> {/* Increased height for angled labels */}
             <ChartContainer id={uniqueChartId} config={chartConfig} className="min-h-[200px] w-full">
                <BarChart accessibilityLayer data={data} margin={{ top: 5, right: 20, left: -20, bottom: 70 /* Increased bottom margin */ }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis 
                    dataKey={chartDataKey as string} 
                    tickLine={false} 
                    axisLine={false} 
                    tickMargin={8}
                    angle={-45} 
                    textAnchor="end" 
                    interval={0} 
                    // height={60} // Recharts calculates height with margin
                   />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  {chartValueKeys.map(val => (
                    <Bar key={val.key as string} dataKey={val.key as string} fill={`var(--color-${val.key as string})`} radius={4} />
                  ))}
                  <ChartLegend content={<ChartLegendContent />} />
                </BarChart>
              </ChartContainer>
          </div>
        )}

        {/* Data Table Section */}
        <DataTable>
          <DataTableHeader>
            <DataTableRow>
              {columns.map(col => <DataTableHead key={col.accessorKey as string} align={col.align}>{col.header}</DataTableHead>)}
            </DataTableRow>
          </DataTableHeader>
          <DataTableBody>
            {data.map((row, rowIndex) => (
              <DataTableRow key={`row-${rowIndex}`}>
                {columns.map(col => (
                  <DataTableCell key={`${col.accessorKey as string}-${rowIndex}`} align={col.align}>
                    {col.cell ? col.cell(row) : row[col.accessorKey as keyof T]}
                  </DataTableCell>
                ))}
              </DataTableRow>
            ))}
             {loading && data.length > 0 && ( // Show spinner overlay only if data exists and loading more
                <DataTableRow>
                    <DataTableCell colSpan={columns.length} align="center" className="py-4">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <RefreshCw className="h-4 w-4 animate-spin" /> <span>Refreshing data...</span>
                    </div>
                    </DataTableCell>
                </DataTableRow>
            )}
          </DataTableBody>
        </DataTable>
      </CardContent>
    </Card>
  );
}
