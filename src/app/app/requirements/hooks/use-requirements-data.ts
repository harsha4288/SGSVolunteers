// src/app/app/requirements/hooks/use-requirements-data.ts
"use client";

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { createRequirementsService } from '../services/requirements-service';
import type {
  RequirementWithDetails, // Changed from Requirement
  SevaCategoryRef,
  Location,
  Timeslot,
  RequirementCellData,
  Requirement as RequirementType, // For the upsert function argument
} from '../types';

// Assuming userRole and userSevaCategoryIds are provided, possibly via a context or props to the page component
interface UseRequirementsDataProps {
  userRole: 'admin' | 'coordinator' | 'volunteer'; // Example roles
  userSevaCategoryIds?: number[]; // Relevant for coordinators
}

export function useRequirementsData({ userRole, userSevaCategoryIds = [] }: UseRequirementsDataProps) {
  const [supabase] = React.useState(() => createClient());
  const [requirementsService] = React.useState(() => createRequirementsService({ supabase }));
  const { toast } = useToast();

  // Static data - fetched once
  const [allSevaCategories, setAllSevaCategories] = React.useState<SevaCategoryRef[]>([]);
  const [allLocations, setAllLocations] = React.useState<Location[]>([]);
  const [allTimeslots, setAllTimeslots] = React.useState<Timeslot[]>([]);

  // Dynamic data - requirements
  const [allRequirements, setAllRequirements] = React.useState<RequirementWithDetails[]>([]);

  // Derived/Filtered data for display
  const [displaySevaCategories, setDisplaySevaCategories] = React.useState<SevaCategoryRef[]>([]);
  const [gridData, setGridData] = React.useState<RequirementCellData[][]>([]); // Matrix for the grid

  // Loading and error states
  const [loadingInitial, setLoadingInitial] = React.useState(true);
  const [loadingRequirements, setLoadingRequirements] = React.useState(false); // For updates or specific fetches
  const [error, setError] = React.useState<string | null>(null);

  // Active filters (example, can be expanded)
  // const [activeFilters, setActiveFilters] = React.useState<object>({}); // To be used by FiltersBar

  // Initial data load
  const loadInitialData = React.useCallback(async () => {
    setLoadingInitial(true);
    setError(null);
    try {
      const [sevaCategoriesData, locationsData, timeslotsData, requirementsData] = await Promise.all([
        requirementsService.fetchSevaCategories(),
        requirementsService.fetchLocations(),
        requirementsService.fetchTimeslots(),
        requirementsService.fetchAllRequirements(), // Returns RequirementWithDetails[] now
      ]);

      setAllSevaCategories(sevaCategoriesData);
      setAllLocations(locationsData);
      setAllTimeslots(timeslotsData);
      setAllRequirements(requirementsData);

    } catch (e: any) {
      const errorMessage = e instanceof Error ? e.message : "Failed to load initial data for requirements module.";
      setError(errorMessage);
      toast({ title: "Error Loading Initial Data", description: errorMessage, variant: "destructive" });
    } finally {
      setLoadingInitial(false);
    }
  }, [requirementsService, toast]);

  React.useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Process and filter data for the grid
  React.useEffect(() => {
    let filteredCategories = allSevaCategories;
    if (userRole === 'coordinator' && userSevaCategoryIds.length > 0) {
      filteredCategories = allSevaCategories.filter(sc => userSevaCategoryIds.includes(sc.id));
    }
    // TODO: Add other filters from activeFilters if implemented (e.g., search text)
    setDisplaySevaCategories(filteredCategories);

    // Prepare grid data
    const newGridData: RequirementCellData[][] = filteredCategories.map(sevaCategory => {
      return allTimeslots.map(timeslot => {
        const requirementsForCell = allRequirements.filter(
          r => r.seva_category_id === sevaCategory.id && r.timeslot_id === timeslot.id
        );

        const total_required_count = requirementsForCell.reduce((sum, r) => sum + r.required_count, 0);
        // Calculate total_assigned_count - since assignments are per seva_category + timeslot (not per location),
        // all requirements in this cell should have the same assigned_count, so we take it from the first requirement
        // to avoid double-counting the same volunteers across multiple location-based requirements
        const total_assigned_count = requirementsForCell.length > 0 ? (requirementsForCell[0].assigned_count || 0) : 0;

        const variance = total_assigned_count - total_required_count;
        const fulfillment_rate = total_required_count > 0 ? (total_assigned_count / total_required_count) * 100 : 0;
        // Placeholder for attendance_rate, as attended_count is not yet implemented
        const attendance_rate = 0;

        return {
          sevaCategory,
          timeslot,
          total_required_count,
          total_assigned_count, // Now populated
          total_attended_count: 0, // Placeholder, needs attended_count from RequirementWithDetails
          requirements_for_cell: requirementsForCell,
          variance, // Now populated
          fulfillment_rate, // Now populated
          attendance_rate, // Placeholder
        };
      });
    });
    setGridData(newGridData);

  }, [allSevaCategories, allTimeslots, allRequirements, userRole, userSevaCategoryIds /*, activeFilters */]);


  // Function to update requirements for a specific cell (SevaCategory/Timeslot combination)
  const updateRequirementsForCell = async (
    sevaCategoryId: number,
    timeslotId: number,
    // This now expects Omit<RequirementType, ...> because the modal deals with individual location requirements
    requirementsToUpsertForCell: Array<Omit<RequirementType, 'id' | 'created_at' | 'updated_at' | 'seva_category_id' | 'timeslot_id'>>
  ) => {
    setLoadingRequirements(true);
    try {
      // The service function now handles deleting old and inserting new, then re-fetching.
      const updatedCellRequirements = await requirementsService.upsertRequirementsForCell(sevaCategoryId, timeslotId, requirementsToUpsertForCell);

      // Update the allRequirements state by replacing the requirements for the affected cell
      setAllRequirements(prevAllReqs => {
        // Filter out the old requirements for this cell
        const otherRequirements = prevAllReqs.filter(
          r => !(r.seva_category_id === sevaCategoryId && r.timeslot_id === timeslotId)
        );
        // Add the new/updated requirements for this cell
        return [...otherRequirements, ...updatedCellRequirements];
      });

      toast({ title: "Success", description: "Requirements updated successfully." });
    } catch (e: any) {
      const errorMessage = e instanceof Error ? e.message : "Failed to update requirements.";
      setError(errorMessage);
      toast({ title: "Error Updating Requirements", description: errorMessage, variant: "destructive" });
      throw e;
    } finally {
      setLoadingRequirements(false);
    }
  };

  // Function to be called by a FiltersBar component (not implemented in this step)
  // const onFilterChange = (newFilters: object) => {
  //   setActiveFilters(newFilters);
  // };

  return {
    // Data for UI
    displaySevaCategories, // Rows for the grid
    allTimeslots,       // Columns for the grid
    allLocations,       // For the modal
    gridData,           // The matrix data: RequirementCellData[][]

    // State
    isLoading: loadingInitial || loadingRequirements,
    loadingInitial,
    loadingRequirements,
    error,

    // Actions
    refreshData: loadInitialData, // To reload everything
    updateRequirementsForCell,
    // onFilterChange, // If filters were implemented

    // User context (passed in but useful to return if components downstream need it)
    userRole,
    userSevaCategoryIds,
  };
}

export type RequirementsPageData = ReturnType<typeof useRequirementsData>;
