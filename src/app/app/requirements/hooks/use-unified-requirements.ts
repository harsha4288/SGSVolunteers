"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { createUnifiedRequirementsService } from "../services/unified-requirements-service";
import type {
    RequirementsState,
    RequirementWithDetails,
    RequirementSummary,
    RequirementCellData,
    ReportFilters,
    SevaCategoryRef,
    Timeslot,
    Location,
} from "../types";

interface UseUnifiedRequirementsProps {
    userRole: 'admin' | 'coordinator' | 'volunteer';
    initialFilters?: ReportFilters;
}

export function useUnifiedRequirements({
    userRole,
    initialFilters = {},
}: UseUnifiedRequirementsProps) {
    // Initialize state
    const [state, setState] = React.useState<RequirementsState>({
        loading: true,
        loadingInitial: true,
        loadingRequirements: false,
        error: null,
        requirements: [],
        summaries: [],
        displaySevaCategories: [],
        allTimeslots: [],
        allLocations: [],
        filters: initialFilters,
        saving: {},
    });

    // Initialize services
    const [supabase] = React.useState(() => createClient());
    const requirementsService = React.useMemo(
        () => createUnifiedRequirementsService({ supabase }),
        [supabase]
    );
    const { toast } = useToast();

    // Load initial data
    const loadInitialData = React.useCallback(async () => {
        setState(prev => ({ ...prev, loadingInitial: true, error: null }));
        try {
            const [sevaCategories, timeslots, locations, requirements] = await Promise.all([
                requirementsService.fetchSevaCategories(),
                requirementsService.fetchTimeslots(),
                requirementsService.fetchLocations(),
                requirementsService.fetchRequirementsWithDetails(state.filters),
            ]);

            setState(prev => ({
                ...prev,
                displaySevaCategories: sevaCategories,
                allTimeslots: timeslots,
                allLocations: locations,
                requirements,
                loadingInitial: false,
                loading: false,
            }));
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: "Failed to load initial data",
                loadingInitial: false,
                loading: false,
            }));
            console.error("Error loading initial data:", error);
        }
    }, [requirementsService, state.filters]);

    React.useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    // Compute summaries and grid data
    const computeSummariesAndGrid = React.useCallback(
        (requirements: RequirementWithDetails[]) => {
            const summariesMap = new Map<string, RequirementSummary>();
            const gridData: RequirementCellData[][] = [];

            // Initialize summaries
            requirements.forEach(req => {
                const key = `${req.seva_category_id}-${req.timeslot_id}`;
                if (!summariesMap.has(key)) {
                    summariesMap.set(key, {
                        seva_category_id: req.seva_category_id,
                        timeslot_id: req.timeslot_id,
                        total_required: 0,
                        total_assigned: 0,
                        total_attended: 0,
                        requirements_by_location: [],
                    });
                }

                const summary = summariesMap.get(key)!;
                summary.total_required += req.required_count;
                summary.total_assigned += req.assigned_count || 0;
                summary.total_attended += req.attended_count || 0;
                summary.requirements_by_location.push(req);
            });

            // Convert to grid data
            state.displaySevaCategories.forEach((seva, rowIndex) => {
                gridData[rowIndex] = [];
                state.allTimeslots.forEach((timeslot, colIndex) => {
                    const key = `${seva.id}-${timeslot.id}`;
                    const summary = summariesMap.get(key);

                    gridData[rowIndex][colIndex] = {
                        sevaCategory: seva,
                        timeslot: timeslot,
                        total_required_count: summary?.total_required || 0,
                        total_assigned_count: summary?.total_assigned || 0,
                        total_attended_count: summary?.total_attended || 0,
                        requirements_for_cell: summary?.requirements_by_location || [],
                        variance: (summary?.total_assigned || 0) - (summary?.total_required || 0),
                        fulfillment_rate: summary?.total_required ?
                            (summary.total_assigned / summary.total_required) * 100 : 0,
                        attendance_rate: summary?.total_assigned ?
                            (summary.total_attended / summary.total_assigned) * 100 : 0,
                    };
                });
            });

            return {
                summaries: Array.from(summariesMap.values()),
                gridData,
            };
        },
        [state.displaySevaCategories, state.allTimeslots]
    );

    // Computed values
    const { summaries, gridData } = React.useMemo(
        () => computeSummariesAndGrid(state.requirements),
        [state.requirements, computeSummariesAndGrid]
    );

    // Actions
    const updateRequirement = async (
        seva_category_id: number,
        timeslot_id: number,
        location_id: number,
        required_count: number,
        notes?: string
    ) => {
        const savingKey = `${seva_category_id}-${timeslot_id}-${location_id}`;
        setState(prev => ({
            ...prev,
            saving: { ...prev.saving, [savingKey]: true },
        }));

        try {
            const result = await requirementsService.manageRequirement({
                seva_category_id,
                timeslot_id,
                location_id,
                required_count,
                notes,
            });

            if (!result.success) throw new Error(result.message);

            // Refresh data
            const requirements = await requirementsService.fetchRequirementsWithDetails(state.filters);
            setState(prev => ({
                ...prev,
                requirements,
                saving: { ...prev.saving, [savingKey]: false },
            }));

            toast({
                title: "Success",
                description: result.message,
            });
        } catch (error) {
            console.error("Error updating requirement:", error);
            toast({
                title: "Error",
                description: "Failed to update requirement",
                variant: "destructive",
            });
            setState(prev => ({
                ...prev,
                saving: { ...prev.saving, [savingKey]: false },
            }));
        }
    };

    const deleteRequirement = async (
        seva_category_id: number,
        timeslot_id: number,
        location_id: number
    ) => {
        const savingKey = `${seva_category_id}-${timeslot_id}-${location_id}`;
        setState(prev => ({
            ...prev,
            saving: { ...prev.saving, [savingKey]: true },
        }));

        try {
            const result = await requirementsService.deleteRequirement(
                seva_category_id,
                timeslot_id,
                location_id
            );

            if (!result.success) throw new Error(result.message);

            // Refresh data
            const requirements = await requirementsService.fetchRequirementsWithDetails(state.filters);
            setState(prev => ({
                ...prev,
                requirements,
                saving: { ...prev.saving, [savingKey]: false },
            }));

            toast({
                title: "Success",
                description: result.message,
            });
        } catch (error) {
            console.error("Error deleting requirement:", error);
            toast({
                title: "Error",
                description: "Failed to delete requirement",
                variant: "destructive",
            });
            setState(prev => ({
                ...prev,
                saving: { ...prev.saving, [savingKey]: false },
            }));
        }
    };

    const updateFilters = async (newFilters: ReportFilters) => {
        setState(prev => ({
            ...prev,
            filters: newFilters,
            loadingRequirements: true,
        }));

        try {
            const requirements = await requirementsService.fetchRequirementsWithDetails(newFilters);
            setState(prev => ({
                ...prev,
                requirements,
                loadingRequirements: false,
            }));
        } catch (error) {
            console.error("Error updating filters:", error);
            setState(prev => ({
                ...prev,
                loadingRequirements: false,
                error: "Failed to update filters",
            }));
        }
    };

    return {
        // State
        ...state,
        summaries,
        gridData,

        // Actions
        updateRequirement,
        deleteRequirement,
        updateFilters,
        refreshData: loadInitialData,

        // Service (for advanced usage)
        requirementsService,
    };
} 