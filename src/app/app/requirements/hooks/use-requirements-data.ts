// src/app/app/requirements/hooks/use-requirements-data.ts
"use client";

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { createRequirementsService } from '../services/requirements-service';
import type { 
  Requirement, 
  SevaCategoryRef, 
  Location, 
  Timeslot,
  RequirementCellData, // For the grid
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
  const [allRequirements, setAllRequirements] = React.useState<Requirement[]>([]);

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
        requirementsService.fetchAllRequirements(),
      ]);
      
      setAllSevaCategories(sevaCategoriesData);
      setAllLocations(locationsData);
      setAllTimeslots(timeslotsData);
      setAllRequirements(requirementsData);

    } catch (e: any) {
      const errorMessage = e instanceof Error ? e.message : "Failed to load initial data for requirements module.";
      setError(errorMessage);
      toast({ title: "Error Loading Data", description: errorMessage, variant: "destructive" });
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
        
        return {
          sevaCategory,
          timeslot,
          total_required_count,
          requirements_for_cell: requirementsForCell, // Full details for the modal
        };
      });
    });
    setGridData(newGridData);

  }, [allSevaCategories, allTimeslots, allRequirements, userRole, userSevaCategoryIds /*, activeFilters */]);


  // Function to update requirements for a specific cell (SevaCategory/Timeslot combination)
  const updateRequirementsForCell = async (
    sevaCategoryId: number, 
    timeslotId: number, 
    // This array comes from the modal, representing desired state for each location for that cell
    requirementsToUpsertForCell: Array<Omit<Requirement, 'id' | 'created_at' | 'updated_at'>>
  ) => {
    setLoadingRequirements(true);
    try {
      await requirementsService.upsertRequirementsForCell(sevaCategoryId, timeslotId, requirementsToUpsertForCell);
      toast({ title: "Success", description: "Requirements updated successfully." });
      // Refresh all requirements data to reflect changes
      // More granular update is possible but complex if IDs change or new items are added without IDs.
      const updatedRequirementsData = await requirementsService.fetchAllRequirements();
      setAllRequirements(updatedRequirementsData);
    } catch (e: any) {
      const errorMessage = e instanceof Error ? e.message : "Failed to update requirements.";
      setError(errorMessage); // Potentially set a more specific error state for the modal
      toast({ title: "Error Updating Requirements", description: errorMessage, variant: "destructive" });
      throw e; // Re-throw for the modal to handle if needed
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
