// src/app/app/requirements/components/requirements-grid.tsx
"use client";

import * as React from 'react';
import { Table, TableBody, TableCaption, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { SevaCategoryRef, Timeslot, RequirementCellData } from '../types';
import { RequirementCell } from './requirement-cell';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

interface RequirementsGridProps {
  sevaCategories: SevaCategoryRef[]; // Rows
  timeslots: Timeslot[];             // Columns
  gridData: RequirementCellData[][]; // Matrix of cell data
  onCellSelect: (cellData: RequirementCellData) => void;
  userRole: 'admin' | 'coordinator' | 'volunteer'; // Example roles
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

  const isEditable = userRole === 'admin' || userRole === 'coordinator'; // Simplified, coordinators might have row-specific editability

  if (isLoading && sevaCategories.length === 0 && timeslots.length === 0) {
    return (
      <div className="border rounded-md p-4">
        <div className="space-y-3">
          <Skeleton className="h-8 w-1/4" /> {/* Header placeholder */}
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-20 w-1/6" /> {/* Seva Category name placeholder */}
              {[...Array(5)].map((_, j) => <Skeleton key={j} className="h-20 w-1/6" />)} {/* Cell placeholders */}
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
    <ScrollArea className="whitespace-nowrap border rounded-md">
      <Table className="min-w-full table-fixed">
        <TableCaption className="my-4">
          Volunteer requirements matrix. Click on a cell to view or edit details.
        </TableCaption>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead className="sticky left-0 z-10 bg-muted/30 w-1/6 min-w-[180px] max-w-[250px] p-3 text-sm font-semibold">
              Seva Category
            </TableHead>
            {timeslots.map((timeslot) => (
              <TableHead key={timeslot.id} className="p-3 text-center w-1/6 min-w-[120px] max-w-[160px] text-sm font-semibold">
                <div className="flex flex-col items-center gap-1">
                  <span className="font-semibold">{timeslot.name.split('(')[0].trim()}</span>
                  {timeslot.name.includes('(') && (
                    <span className="text-xs text-muted-foreground font-normal">
                      ({timeslot.name.split('(')[1]})
                    </span>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {gridData.map((row, rowIndex) => {
            const sevaCategory = sevaCategories[rowIndex]; // Get current Seva Category for the row
            // Determine row-specific editability for coordinators
            // For now, using global isEditable, but this could be refined:
            // const canEditRow = userRole === 'admin' || (userRole === 'coordinator' && userSevaCategoryIds.includes(sevaCategory.id));

            return (
              <TableRow key={sevaCategory.id} className="hover:bg-muted/10">
                <TableHead
                    scope="row"
                    className="sticky left-0 z-10 bg-background border-r p-3 text-sm font-medium max-w-[250px] overflow-hidden text-ellipsis whitespace-nowrap"
                    title={sevaCategory.name}
                >
                  {sevaCategory.name}
                </TableHead>
                {row.map((cellData) => (
                  <RequirementCell
                    key={`${cellData.sevaCategory.id}-${cellData.timeslot.id}`}
                    cellData={cellData}
                    onSelect={() => onCellSelect(cellData)}
                    isEditable={isEditable} // Could be canEditRow for coordinator role
                  />
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
