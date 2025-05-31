"use client";

import * as React from "react";
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { RequirementCellData, SevaCategoryRef, Timeslot } from "../types";
import { RequirementCell } from "./requirement-cell";
import { SevaCategoryCell } from "./seva-category-cell";

interface EnhancedRequirementsGridProps {
    sevaCategories: SevaCategoryRef[];
    timeslots: Timeslot[];
    gridData: RequirementCellData[][];
    onCellSelect: (cellData: RequirementCellData) => void;
    onRequirementUpdate?: (cellData: RequirementCellData, newRequiredCount: number) => void;
    userRole: 'admin' | 'coordinator' | 'volunteer';
    isLoading: boolean;
}

export function EnhancedRequirementsGrid({
    sevaCategories,
    timeslots,
    gridData,
    onCellSelect,
    onRequirementUpdate,
    userRole,
    isLoading,
}: EnhancedRequirementsGridProps) {
    const isEditable = userRole === 'admin' || userRole === 'coordinator';

    if (isLoading && sevaCategories.length === 0 && timeslots.length === 0) {
        return (
            <div className="border rounded-md p-2">
                <div className="space-y-2">
                    <Skeleton className="h-6 w-1/4" />
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex gap-2">
                            <Skeleton className="h-10 w-1/6" />
                            {[...Array(5)].map((_, j) => <Skeleton key={j} className="h-10 w-1/6" />)}
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

    // Filter out 'All Days' and 'Full Day' timeslots
    const filteredTimeslots = timeslots.filter(
        t => !/all\s*days|full(\s*day)?/i.test(t.slot_name)
    );

    return (
        <div className="rounded-md border overflow-x-auto">
            <ScrollArea className="h-[calc(100vh-20rem)] min-w-[600px]">
                <Table className="min-w-max text-[11px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="bg-muted/50 w-[60px] min-w-[60px] max-w-[60px] font-medium text-[11px] px-0.5 py-0.5 align-middle text-center">
                                Seva
                            </TableHead>
                            {filteredTimeslots.map((timeslot) => (
                                <TableHead
                                    key={timeslot.id}
                                    className="bg-muted/50 text-center font-medium text-[11px] px-1 py-1 whitespace-nowrap w-auto min-w-[50px]"
                                >
                                    {timeslot.slot_name}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sevaCategories.map((seva, rowIndex) => (
                            <TableRow key={seva.id}>
                                <SevaCategoryCell categoryName={seva.category_name} />
                                {filteredTimeslots.map((timeslot, colIndex) => {
                                    // Find the cell data for this timeslot
                                    const cellData = gridData[rowIndex]?.[timeslots.findIndex(t => t.id === timeslot.id)];

                                    if (!cellData) {
                                        return <RequirementCell
                                            key={colIndex}
                                            required={0}
                                            assigned={0}
                                            variance={0}
                                            isEditable={isEditable}
                                            onClick={() => { }}
                                            onRequiredChange={() => { }}
                                        />;
                                    }

                                    return (
                                        <RequirementCell
                                            key={colIndex}
                                            required={cellData.total_required_count}
                                            assigned={cellData.total_assigned_count}
                                            variance={cellData.variance}
                                            isEditable={isEditable}
                                            onClick={() => isEditable && onCellSelect(cellData)}
                                            onRequiredChange={(newValue) => {
                                                if (isEditable && onRequirementUpdate) {
                                                    onRequirementUpdate(cellData, newValue);
                                                }
                                            }}
                                        />
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
} 