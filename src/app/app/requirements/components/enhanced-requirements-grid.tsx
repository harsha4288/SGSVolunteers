"use client";

import * as React from "react";
import {
    DataTable,
    DataTableHeader,
    DataTableBody,
    DataTableRow,
    DataTableHead,
    DataTableCell,
    DataTableColGroup,
    DataTableCol
} from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import type { RequirementCellData, SevaCategoryRef, Timeslot } from "../types";
import { RequirementCell } from "./requirement-cell";
import { SevaCategoryCell } from "./seva-category-cell";
import { createClient } from '@/lib/supabase/client'; // Import createClient
import type { Database } from '@/lib/types/supabase'; // Import Database type

interface EnhancedRequirementsGridProps {
    sevaCategories: SevaCategoryRef[];
    timeslots: Timeslot[];
    gridData: RequirementCellData[][];
    onCellSelect: (cellData: RequirementCellData) => void;
    onRequirementUpdate?: (cellData: RequirementCellData, newRequiredCount: number) => void;
    userRole: 'admin' | 'coordinator' | 'volunteer';
    isLoading: boolean;
    // New props to pass to RequirementCell
    profileId: string | null;
    supabase: ReturnType<typeof createClient>;
    selectedEvent: string;
}

export function EnhancedRequirementsGrid({
    sevaCategories,
    timeslots,
    gridData,
    onCellSelect,
    onRequirementUpdate,
    userRole,
    isLoading,
    profileId, // Destructure new props
    supabase,
    selectedEvent,
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
        <div className="rounded-md border overflow-x-auto"> {/* Added overflow-x-auto */}
            <DataTable 
                maxHeight="calc(100vh - 20rem)" 
                className="text-[11px] w-full"
                frozenColumns={[0]}
                columnWidths={[80, ...Array(filteredTimeslots.length).fill(120)]}
            >
                <DataTableColGroup>
                    <DataTableCol widthClass="w-[80px]"/>{/*Seva Category column*/}
                    {filteredTimeslots.map((timeslot) => (
                        <DataTableCol key={timeslot.id} widthClass="w-[120px]"/>
                    ))}
                </DataTableColGroup>
                <DataTableHeader>
                    <DataTableRow>
                        <DataTableHead 
                            colIndex={0}
                            className="font-medium text-[11px] px-1 py-1 align-middle text-center"
                        >
                            Seva
                        </DataTableHead>
                        {filteredTimeslots.map((timeslot, colIndex) => (
                            <DataTableHead
                                key={timeslot.id}
                                className="text-center font-medium text-[11px] px-1 py-1 whitespace-nowrap"
                                sticky
                            >
                                {timeslot.slot_name}
                            </DataTableHead>
                        ))}
                    </DataTableRow>
                </DataTableHeader>
                <DataTableBody>
                    {sevaCategories.map((seva, rowIndex) => (
                        <DataTableRow key={seva.id} hover>
                            <DataTableCell colIndex={0} className="p-0" border>
                                <SevaCategoryCell categoryName={seva.category_name} />
                            </DataTableCell>
                            {filteredTimeslots.map((timeslot, colIndex) => {
                                // Find the cell data for this timeslot
                                const cellData = gridData[rowIndex]?.[timeslots.findIndex(t => t.id === timeslot.id)];
                                
                                return (
                                    <DataTableCell key={colIndex} colIndex={colIndex + 1} className="p-0" border>
                                        <RequirementCell
                                            required={cellData?.total_required_count || 0}
                                            assigned={cellData?.total_assigned_count || 0}
                                            variance={cellData?.variance || 0}
                                            isEditable={isEditable}
                                            onClick={() => cellData && isEditable && onCellSelect(cellData)}
                                            onRequiredChange={(newValue) => {
                                                if (cellData && isEditable && onRequirementUpdate) {
                                                    onRequirementUpdate(cellData, newValue);
                                                }
                                            }}
                                            sevaCategoryId={cellData.sevaCategory.id} // Pass sevaCategoryId
                                            timeslotId={cellData.timeslot.id}       // Pass timeslotId
                                            userRole={userRole as "admin" | "team_lead" | "volunteer"} // Cast userRole
                                            profileId={profileId}
                                            supabase={supabase}
                                            selectedEvent={selectedEvent}
                                            allTimeslots={timeslots} // Pass the timeslots prop from EnhancedRequirementsGrid
                                        />
                                    </DataTableCell>
                                );
                            })}
                        </DataTableRow>
                    ))}
                </DataTableBody>
            </DataTable>
        </div>
    );
}
