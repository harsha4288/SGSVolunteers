/**
 * Custom hook for managing volunteer data state and operations
 * Follows the established pattern from other modules like tshirts
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { VolunteersService } from "../services/volunteers-service";
import type { VolunteerWithProfile, VolunteerFilters, VolunteerPagination } from "../types";

interface UseVolunteersDataReturn {
  // Data state
  volunteers: VolunteerWithProfile[];
  loading: boolean;
  error: string | null;
  
  // Pagination state
  pagination: VolunteerPagination;
  
  // Filter state
  filters: VolunteerFilters;
  availableLocations: string[];
  
  // Actions
  setFilters: (filters: VolunteerFilters) => void;
  clearFilters: () => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  refreshData: () => Promise<void>;
  deleteVolunteer: (volunteerId: string) => Promise<boolean>;
}

/**
 * Hook for managing volunteers data, filtering, and pagination
 * Centralizes volunteer data management logic
 */
export function useVolunteersData(): UseVolunteersDataReturn {
  const { toast } = useToast();
  const volunteersService = useMemo(() => new VolunteersService(), []);

  // Data state
  const [volunteers, setVolunteers] = useState<VolunteerWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [pagination, setPagination] = useState<VolunteerPagination>({
    page: 1,
    pageSize: 10,
    totalCount: 0
  });

  // Filter state
  const [filters, setFiltersState] = useState<VolunteerFilters>({});
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);

  /**
   * Fetches volunteer data based on current filters and pagination
   */
  const fetchVolunteers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await volunteersService.fetchVolunteers(
        pagination.page,
        pagination.pageSize,
        filters
      );

      if (response.error) {
        setError(response.error);
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive"
        });
      } else {
        setVolunteers(response.data);
        setPagination(prev => ({
          ...prev,
          totalCount: response.totalCount
        }));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch volunteers";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, filters, volunteersService, toast]);

  /**
   * Fetches available locations for filter dropdown
   */
  const fetchLocations = useCallback(async () => {
    try {
      const response = await volunteersService.getUniqueLocations();
      if (response.error) {
        console.warn("Failed to fetch locations:", response.error);
      } else {
        setAvailableLocations(response.data);
      }
    } catch (err) {
      console.warn("Error fetching locations:", err);
    }
  }, [volunteersService]);

  // Initial data load and refresh when dependencies change
  useEffect(() => {
    fetchVolunteers();
  }, [fetchVolunteers]);

  // Load locations on mount
  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  /**
   * Updates filters and resets pagination to first page
   */
  const setFilters = useCallback((newFilters: VolunteerFilters) => {
    setFiltersState(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  /**
   * Clears all filters and resets pagination
   */
  const clearFilters = useCallback(() => {
    setFiltersState({});
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  /**
   * Updates current page
   */
  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  /**
   * Updates page size and resets to first page
   */
  const setPageSize = useCallback((pageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize, page: 1 }));
  }, []);

  /**
   * Manually refreshes the data
   */
  const refreshData = useCallback(async () => {
    await fetchVolunteers();
  }, [fetchVolunteers]);

  /**
   * Deletes a volunteer and refreshes the data
   */
  const deleteVolunteer = useCallback(async (volunteerId: string): Promise<boolean> => {
    try {
      const response = await volunteersService.deleteVolunteer(volunteerId);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Volunteer deleted successfully"
        });
        await refreshData();
        return true;
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to delete volunteer",
          variant: "destructive"
        });
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete volunteer";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    }
  }, [volunteersService, toast, refreshData]);

  return {
    // Data state
    volunteers,
    loading,
    error,
    
    // Pagination state
    pagination,
    
    // Filter state
    filters,
    availableLocations,
    
    // Actions
    setFilters,
    clearFilters,
    setPage,
    setPageSize,
    refreshData,
    deleteVolunteer
  };
}