// src/app/app/reports/components/common/report-display.tsx
"use client";

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableHead, DataTableCell } from '@/components/ui/data-table';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { BarChart, CartesianGrid, XAxis, YAxis, Bar } from 'recharts';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface ColumnDef<T extends object> {
  accessorKey: keyof T | string;
  header: string;
  cell?: (data: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

interface ReportDisplayProps<T extends object> {
  title: string;
  data: T[];
  columns: ColumnDef<T>[];
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

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p className="font-medium">Error loading report: {error}</p>
        </div>
      </Card>
    );
  }

  if (!data.length) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">No data available for this report</p>
          <Button variant="outline" size="sm" onClick={onRefresh} className="mt-4">
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <div className="h-full flex flex-col lg:flex-row">
        {/* Chart Section */}
        <div className="h-[50%] lg:h-full lg:w-1/2 p-2 border-b lg:border-b-0 lg:border-r flex flex-col">
          <ChartContainer id={uniqueChartId} config={chartConfig}>
            <div className="h-full flex flex-col">
              <div className="flex-1 min-h-0">
                <BarChart
                  data={data}
                  margin={{ top: 10, right: 20, left: 10, bottom: 40 }}
                  width={500}
                  height={280}
                  layout="horizontal"
                  style={{ width: '100%', height: '100%', maxHeight: 'calc(100% - 20px)' }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey={chartDataKey as string}
                    tickLine={false}
                    axisLine={false}
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                    height={40}
                    fontSize={12}
                    dy={10}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  {chartValueKeys.map(val => (
                    <Bar
                      key={val.key as string}
                      dataKey={val.key as string}
                      fill={`var(--color-${val.key as string})`}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              </div>
              <div className="flex-none h-8 mt-2">
                <ChartLegend content={<ChartLegendContent />} />
              </div>
            </div>
          </ChartContainer>
        </div>

        {/* Table Section */}
        <div className="h-[50%] lg:h-full lg:w-1/2 p-2">
          <div className="h-full rounded-md border overflow-auto">
            <DataTable>
              <DataTableHeader>
                <DataTableRow>
                  {columns.map(col => (
                    <DataTableHead
                      key={col.accessorKey as string}
                      align={col.align}
                      className="whitespace-nowrap"
                    >
                      {col.header}
                    </DataTableHead>
                  ))}
                </DataTableRow>
              </DataTableHeader>
              <DataTableBody>
                {data.map((row, rowIndex) => (
                  <DataTableRow key={`row-${rowIndex}`}>
                    {columns.map(col => (
                      <DataTableCell
                        key={`${col.accessorKey as string}-${rowIndex}`}
                        align={col.align}
                      >
                        {col.cell ? col.cell(row) : row[col.accessorKey as keyof T]}
                      </DataTableCell>
                    ))}
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Updating...</span>
          </div>
        </div>
      )}
    </Card>
  );
}