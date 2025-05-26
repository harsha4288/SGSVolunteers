// src/app/app/requirements/hooks/use-requirements-data.ts
"use client";

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { createRequirementsService } from '../services/requirements-service';
import type { Requirement, SevaCategoryRef, Location, Timeslot, RequirementRow } from '../types';

interface UseRequirementsDataProps {
  initialSevaCategoryId?: number; // Renamed from initialTaskId
}

export function useRequirementsData({ initialSevaCategoryId }: UseRequirementsDataProps) {
  const [supabase] = React.useState(() => createClient());
  const [requirementsService] = React.useState(() => createRequirementsService({ supabase }));
  const { toast } = useToast();

  const [sevaCategories, setSevaCategories] = React.useState<SevaCategoryRef[]>([]); // Renamed from tasks
  const [locations, setLocations] = React.useState<Location[]>([]);
  const [timeslots, setTimeslots] = React.useState<Timeslot[]>([]);
  const [requirements, setRequirements] = React.useState<Requirement[]>([]);
  
  const [loadingInitial, setLoadingInitial] = React.useState(true);
  const [loadingRequirements, setLoadingRequirements] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [currentSevaCategoryId, setCurrentSevaCategoryId] = React.useState<number | undefined>(initialSevaCategoryId); // Renamed from currentTaskId

  const loadInitialStaticData = React.useCallback(async () => {
    setLoadingInitial(true);
    setError(null);
    try {
      const [sevaCategoryData, locationData, timeslotData] = await Promise.all([ // Renamed taskData
        requirementsService.fetchSevaCategories(), // Renamed from fetchTasks
        requirementsService.fetchLocations(),
        requirementsService.fetchTimeslots(),
      ]);
      setSevaCategories(sevaCategoryData); // Renamed from setTasks
      setLocations(locationData);
      setTimeslots(timeslotData);

      if (!initialSevaCategoryId && sevaCategoryData.length > 0) { // Renamed initialTaskId and taskData
        setCurrentSevaCategoryId(sevaCategoryData[0].id); // Renamed setCurrentTaskId and taskData
      } else if (initialSevaCategoryId && !sevaCategoryData.some(sc => sc.id === initialSevaCategoryId)){ // Renamed initialTaskId and taskData
        setCurrentSevaCategoryId(sevaCategoryData.length > 0 ? sevaCategoryData[0].id : undefined); // Renamed setCurrentTaskId and taskData
         if (sevaCategoryData.length > 0) { // Renamed taskData
           toast({ title: "Notice", description: `Initial Seva Category ID ${initialSevaCategoryId} not found. Displaying first available.`, variant: "default" }); // Renamed initialTaskId
        }
      }
    } catch (e: any) {
      const errorMessage = e instanceof Error ? e.message : "Failed to load initial data";
      setError(errorMessage);
      toast({ title: "Error Loading Static Data", description: errorMessage, variant: "destructive" });
    } finally {
      setLoadingInitial(false);
    }
  }, [requirementsService, toast, initialSevaCategoryId]); // Renamed initialTaskId

  const loadSevaCategoryRequirements = React.useCallback(async () => { // Renamed from loadTaskRequirements
    if (!currentSevaCategoryId) { // Renamed from currentTaskId
      setRequirements([]);
      return;
    }
    setLoadingRequirements(true);
    setError(null); 
    try {
      const reqData = await requirementsService.fetchRequirements(currentSevaCategoryId); // Renamed from currentTaskId
      setRequirements(reqData);
    } catch (e: any) {
      const errorMessage = e instanceof Error ? e.message : `Failed to load requirements for Seva Category ${currentSevaCategoryId}`; // Renamed from currentTaskId
      setError(errorMessage); 
      toast({ title: "Error Loading Requirements", description: errorMessage, variant: "destructive" });
    } finally {
      setLoadingRequirements(false);
    }
  }, [requirementsService, toast, currentSevaCategoryId]); // Renamed from currentTaskId

  React.useEffect(() => {
    loadInitialStaticData();
  }, [loadInitialStaticData]);

  React.useEffect(() => {
    if (currentSevaCategoryId !== undefined) { // Renamed from currentTaskId
      loadSevaCategoryRequirements(); // Renamed from loadTaskRequirements
    } else {
      setRequirements([]);
    }
  }, [currentSevaCategoryId, loadSevaCategoryRequirements]); // Renamed from currentTaskId, loadTaskRequirements

  const updateRequirementCount = async (
    sevaCategoryId: number, // Renamed from taskId
    locationId: number,
    timeslotId: number,
    requiredCount: number
  ) => {
    const validRequiredCount = Math.max(0, requiredCount);

    try {
      await requirementsService.upsertRequirement({
        seva_category_id: sevaCategoryId, // Renamed from task_id
        location_id: locationId,
        timeslot_id: timeslotId,
        required_count: validRequiredCount,
      });
      if (sevaCategoryId === currentSevaCategoryId) { // Renamed from taskId and currentTaskId
        await loadSevaCategoryRequirements(); // Renamed from loadTaskRequirements
      }
      toast({ title: "Success", description: "Requirement updated." });
    } catch (e: any) {
      const errorMessage = e instanceof Error ? e.message : "Failed to update requirement";
      toast({ title: "Error Updating Requirement", description: errorMessage, variant: "destructive" });
      throw e; 
    }
  };

  const requirementRows = React.useMemo((): RequirementRow[] => {
    if (!currentSevaCategoryId || locations.length === 0 || timeslots.length === 0) { // Renamed from currentTaskId
      return [];
    }
    const currentSevaCategory = sevaCategories.find(sc => sc.id === currentSevaCategoryId); // Renamed from currentTask, tasks, currentTaskId
    return locations.flatMap(loc =>
      timeslots.map(ts => {
        const existingReq = requirements.find(
          r => r.location_id === loc.id && r.timeslot_id === ts.id && r.seva_category_id === currentSevaCategoryId // Added seva_category_id check
        ); 
        return {
          seva_category_id: currentSevaCategoryId, // Renamed from task_id
          location_id: loc.id,
          timeslot_id: ts.id,
          required_count: existingReq?.required_count || 0,
          id: existingReq?.id,
          created_at: existingReq?.created_at,
          updated_at: existingReq?.updated_at,
          seva_category_name: currentSevaCategory?.name || 'N/A', // Renamed from task_name, currentTask
          location_name: loc.name,
          timeslot_name: ts.name,
        };
      })
    );
  }, [requirements, sevaCategories, locations, timeslots, currentSevaCategoryId]); // Renamed from tasks, currentTaskId

  return {
    sevaCategories, // Renamed from tasks
    locations,
    timeslots,
    requirementRows,
    loading: loadingInitial || loadingRequirements, 
    loadingInitial, 
    loadingRequirements,
    error, 
    currentSevaCategoryId, // Renamed from currentTaskId
    setCurrentSevaCategoryId, // Renamed from setCurrentTaskId
    updateRequirementCount,
    refreshRequirements: loadSevaCategoryRequirements, // Renamed from loadTaskRequirements
  };
}
export type RequirementsData = ReturnType<typeof useRequirementsData>;
