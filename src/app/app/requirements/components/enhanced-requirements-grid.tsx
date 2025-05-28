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
        t => !/all\s*days|full\s*day/i.test(t.slot_name)
    );

    return (
        <div className="rounded-md border overflow-x-auto">
            <ScrollArea className="h-[calc(100vh-20rem)] min-w-[600px]">
                <Table className="min-w-max text-[11px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="bg-muted/50 w-[80px] font-medium text-[11px] px-1 py-1">
                                Seva
                            </TableHead>
                            {filteredTimeslots.map((timeslot) => (
                                <TableHead
                                    key={timeslot.id}
                                    className="bg-muted/50 text-center min-w-[60px] px-1 py-1 align-bottom"
                                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', height: 80 }}
                                >
                                    <span className="font-medium text-[10px] truncate max-w-[60px] block">
                                        {timeslot.slot_name}
                                    </span>
                                    <span className="text-[9px] text-muted-foreground block rotate-180">
                                        {new Date(timeslot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sevaCategories.map((seva, rowIndex) => (
                            <TableRow key={seva.id} className="h-7">
                                <TableCell className="font-medium bg-muted/30 px-1 py-1 text-[11px] truncate max-w-[80px] flex flex-col items-center gap-0.5">
                                    <span className="flex items-center gap-1">
                                        {sevaCategoryMeta[seva.category_name]?.icon || <span>🔹</span>}
                                        <span className="font-bold">{sevaCategoryMeta[seva.category_name]?.code || seva.category_name.slice(0, 2).toUpperCase()}</span>
                                    </span>
                                    <span className="text-[9px] text-muted-foreground truncate max-w-[60px]">{seva.category_name}</span>
                                </TableCell>
                                {filteredTimeslots.map((_, colIndex) => {
                                    // Find the correct colIndex in the original timeslots array
                                    const origColIndex = timeslots.findIndex(t => t.id === filteredTimeslots[colIndex].id);
                                    const cellData = gridData[rowIndex]?.[origColIndex];
                                    if (!cellData) return <TableCell key={colIndex} />;

                                    const {
                                        total_required_count,
                                        total_assigned_count,
                                        variance,
                                    } = cellData;

                                    return (
                                        <TableCell
                                            key={colIndex}
                                            className={cn(
                                                "p-0 cursor-pointer transition-colors group min-w-[60px] max-w-[70px]",
                                                isEditable && "hover:bg-accent/10"
                                            )}
                                            onClick={() => isEditable && onCellSelect(cellData)}
                                        >
                                            <div className="flex flex-col items-center justify-center gap-0.5 py-0.5 px-0.5">
                                                <div className="flex items-center gap-0.5">
                                                    <ClipboardList className="h-3 w-3 text-muted-foreground" aria-label="Required" />
                                                    <span className="font-semibold text-[11px]">{total_required_count}</span>
                                                </div>
                                                <div className="flex items-center gap-0.5">
                                                    <UserCheck className="h-3 w-3 text-muted-foreground" aria-label="Assigned" />
                                                    <span className="text-[11px]">{total_assigned_count}</span>
                                                </div>
                                                <div className="flex items-center gap-0.5">
                                                    <span className={cn(
                                                        "rounded px-1 py-0.5 text-[11px] font-semibold flex items-center gap-0.5 border",
                                                        variance < 0 ? "bg-red-700 text-white border-red-800" : variance === 0 ? "bg-green-700 text-white border-green-800" : "bg-blue-700 text-white border-blue-800"
                                                    )} aria-label="Variance (Required - Assigned)">
                                                        {getVarianceIcon(variance)}
                                                        {variance}
                                                    </span>
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