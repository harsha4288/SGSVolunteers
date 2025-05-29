"use client";

import * as React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, UserCheck, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { RequirementCellData, SevaCategoryRef, Timeslot } from "../types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface EnhancedRequirementsGridProps {
    sevaCategories: SevaCategoryRef[];
    timeslots: Timeslot[];
    gridData: RequirementCellData[][];
    onCellSelect: (cellData: RequirementCellData) => void;
    userRole: 'admin' | 'coordinator' | 'volunteer';
    isLoading: boolean;
}

export function EnhancedRequirementsGrid({
    sevaCategories,
    timeslots,
    gridData,
    onCellSelect,
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

    const getVarianceColor = (variance: number) => {
        if (variance < 0) return "bg-destructive/20 text-destructive-foreground";
        if (variance === 0) return "bg-success/20 text-success-foreground";
        return "bg-primary/20 text-primary";
    };

    const getVarianceIcon = (variance: number) => {
        if (variance < 0) return <ArrowDownRight className="h-3 w-3" />;
        if (variance === 0) return <ArrowUpRight className="h-3 w-3 rotate-45 text-success" />;
        return <ArrowUpRight className="h-3 w-3" />;
    };

    // Seva category icon and short code mapping
    const sevaCategoryMeta: Record<string, { icon: React.ReactNode; code: string }> = {
        'Crowd Mgmt': { icon: <span className="text-blue-400">👥</span>, code: 'CM' },
        'Health': { icon: <span className="text-green-400">🩺</span>, code: 'HL' },
        'Helpdesk': { icon: <span className="text-yellow-400">🛎️</span>, code: 'HD' },
        'Meals Prep': { icon: <span className="text-orange-400">🍽️</span>, code: 'MP' },
        'Hospitality': { icon: <span className="text-pink-400">🏠</span>, code: 'HO' },
        'Stage': { icon: <span className="text-purple-400">🎤</span>, code: 'ST' },
        // Add more as needed
    };

    // Filter out 'All Days' and 'Full Day' timeslots
    const filteredTimeslots = timeslots.filter(
        t => !/all\s*days|full(\s*day)?/i.test(t.name)
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
                                    className="bg-muted/50 text-center font-medium text-[11px] px-1 py-1 whitespace-nowrap w-auto min-w-[45px]"
                                >
                                    {timeslot.name}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sevaCategories.map((seva, rowIndex) => (
                            <TableRow key={seva.id} className="h-7">
                                <TableCell className="font-medium bg-muted/30 px-0.5 py-0.5 text-[11px] w-[60px] min-w-[60px] max-w-[60px] text-center align-middle flex flex-col items-center justify-center gap-px">
                                    <span className="flex items-center justify-center gap-0.5">
                                        {sevaCategoryMeta[seva.name]?.icon || <span>🔹</span>}
                                        <span className="font-bold md:hidden">{sevaCategoryMeta[seva.name]?.code || seva.name.slice(0, 2).toUpperCase()}</span>
                                        <span className="font-bold hidden md:inline truncate max-w-[50px]">{seva.name}</span>
                                    </span>
                                    <span className="text-[9px] text-muted-foreground truncate max-w-[50px] hidden md:hidden">{seva.name}</span>
                                </TableCell>
                                {filteredTimeslots.map((_, colIndex) => {
                                    // Find the correct colIndex in the original timeslots array
                                    const origColIndex = timeslots.findIndex(t => t.id === filteredTimeslots[colIndex].id);
                                    const cellData = gridData[rowIndex]?.[origColIndex];
                                    if (!cellData) return <TableCell key={colIndex} className="w-[60px] min-w-[60px] max-w-[60px] px-2 text-center align-middle" />;

                                    // TEMP: Debug log for DB data
                                    if (rowIndex === 0 && colIndex === 0) {
                                        // eslint-disable-next-line no-console
                                        console.log('DEBUG cellData:', cellData);
                                    }

                                    const {
                                        total_required_count,
                                        total_assigned_count,
                                        variance,
                                    } = cellData;

                                    // Color for variance (border or text only, no background)
                                    let varianceClass = "border text-xs";
                                    if (variance < 0) varianceClass += " border-red-700 text-red-700";
                                    else if (variance === 0) varianceClass += " border-green-700 text-green-700";
                                    else varianceClass += " border-blue-700 text-blue-700";

                                    return (
                                        <TableCell
                                            key={colIndex}
                                            className={cn(
                                                "cursor-pointer transition-colors group w-[50px] min-w-[50px] max-w-[50px] p-px align-middle text-center",
                                                isEditable && "hover:bg-accent/10"
                                            )}
                                            onClick={() => isEditable && onCellSelect(cellData)}
                                        >
                                            <div className="flex flex-col items-center justify-center gap-0 py-0 px-0 h-full">
                                                {/* Row 1: Required & Assigned */}
                                                <div className="flex items-center gap-0.5 justify-center w-full">
                                                    <ClipboardList className="h-3 w-3 text-muted-foreground" aria-label="Required" />
                                                    <span className="font-semibold text-[11px]">{total_required_count}</span>
                                                    <UserCheck className="h-3 w-3 text-muted-foreground ml-1" aria-label="Assigned" />
                                                    <span className="text-[11px]">{total_assigned_count}</span>
                                                </div>
                                                {/* Row 2: Variance */}
                                                <div className="flex items-center justify-center w-full h-full">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <span className={cn(
                                                                    "rounded px-0.5 py-px font-semibold flex items-center gap-px border mx-auto",
                                                                    varianceClass
                                                                )}>
                                                                    {getVarianceIcon(variance)}
                                                                    {variance}
                                                                </span>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top" className="text-xs">
                                                                Variance = Required - Assigned
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            </div>
                                        </TableCell>
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