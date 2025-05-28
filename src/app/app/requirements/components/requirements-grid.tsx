// src/app/app/requirements/components/requirements-grid.tsx
"use client";

import * as React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { SevaCategoryRef, Timeslot, RequirementCellData } from '../types';
import { Skeleton } from '@/components/ui/skeleton';

interface RequirementsGridProps {
  sevaCategories: SevaCategoryRef[];
  timeslots: Timeslot[];
  gridData: RequirementCellData[][];
  onCellSelect: (cellData: RequirementCellData) => void;
  userRole: 'admin' | 'coordinator' | 'volunteer';
  isLoading: boolean;
}

export function RequirementsGrid({
  sevaCategories,
  timeslots,
  gridData,
  onCellSelect,
  userRole,
  isLoading,
}: RequirementsGridProps) {
  const isEditable = userRole === 'admin' || userRole === 'coordinator';

  if (isLoading && sevaCategories.length === 0 && timeslots.length === 0) {
    return (
      <div className="border rounded-md p-4">
        <div className="space-y-3">
          <Skeleton className="h-8 w-1/4" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-20 w-1/6" />
              {[...Array(5)].map((_, j) => <Skeleton key={j} className="h-20 w-1/6" />)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (sevaCategories.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No Seva Categories to display. Please add Seva Categories or adjust filters.</p>;
  }
  if (timeslots.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No Timeslots to display. Please add Timeslots.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-medium text-sm">Seva Category</TableHead>
            {timeslots.map((timeslot) => (
              <TableHead key={timeslot.id} className="text-center font-medium text-sm">
                {timeslot.name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {gridData.map((row, rowIndex) => {
            const sevaCategory = sevaCategories[rowIndex];
            return (
              <TableRow key={sevaCategory.id}>
                <TableCell className="font-medium text-sm">
                  {sevaCategory.name}
                </TableCell>
                {row.map((cellData) => {
                  const count = cellData.total_required_count;
                  return (
                    <TableCell
                      key={`${cellData.sevaCategory.id}-${cellData.timeslot.id}`}
                      className={`text-center cursor-pointer hover:bg-accent/20 transition-colors ${count > 0 ? 'bg-background' : 'bg-muted/5'
                        }`}
                      onClick={() => onCellSelect(cellData)}
                    >
                      <span className={`text-lg font-semibold ${count === 0 ? 'text-muted-foreground' :
                          count < 5 ? 'text-orange-600' :
                            count < 10 ? 'text-blue-600' :
                              'text-green-600'
                        }`}>
                        {count || '—'}
                      </span>
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
