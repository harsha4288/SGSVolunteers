// src/app/app/requirements/hooks/use-requirements-data.ts
"use client";

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { createRequirementsService } from '../services/requirements-service';
import type { Requirement, Task, Location, Timeslot, RequirementRow } from '../types';

interface UseRequirementsDataProps {
  initialTaskId?: number;
}

export function useRequirementsData({ initialTaskId }: UseRequirementsDataProps) {
  const [supabase] = React.useState(() => createClient());
  const [requirementsService] = React.useState(() => createRequirementsService({ supabase }));
  const { toast } = useToast();

  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [locations, setLocations] = React.useState<Location[]>([]);
  const [timeslots, setTimeslots] = React.useState<Timeslot[]>([]);
  const [requirements, setRequirements] = React.useState<Requirement[]>([]);
  
  const [loadingInitial, setLoadingInitial] = React.useState(true);
  const [loadingRequirements, setLoadingRequirements] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [currentTaskId, setCurrentTaskId] = React.useState<number | undefined>(initialTaskId);

  const loadInitialStaticData = React.useCallback(async () => {
    setLoadingInitial(true);
    setError(null);
    try {
      const [taskData, locationData, timeslotData] = await Promise.all([
        requirementsService.fetchTasks(),
        requirementsService.fetchLocations(),
        requirementsService.fetchTimeslots(),
      ]);
      setTasks(taskData);
      setLocations(locationData);
      setTimeslots(timeslotData);

      if (!initialTaskId && taskData.length > 0) {
        setCurrentTaskId(taskData[0].id);
      } else if (initialTaskId && !taskData.some(t => t.id === initialTaskId)){
        setCurrentTaskId(taskData.length > 0 ? taskData[0].id : undefined);
         if (taskData.length > 0) {
           toast({ title: "Notice", description: `Initial task ID ${initialTaskId} not found. Displaying first available task.`, variant: "default" });
        }
      }
    } catch (e: any) {
      const errorMessage = e instanceof Error ? e.message : "Failed to load initial data";
      setError(errorMessage);
      toast({ title: "Error Loading Static Data", description: errorMessage, variant: "destructive" });
    } finally {
      setLoadingInitial(false);
    }
  }, [requirementsService, toast, initialTaskId]);

  const loadTaskRequirements = React.useCallback(async () => {
    if (!currentTaskId) {
      setRequirements([]);
      return;
    }
    setLoadingRequirements(true);
    setError(null); 
    try {
      const reqData = await requirementsService.fetchRequirements(currentTaskId);
      setRequirements(reqData);
    } catch (e: any) {
      const errorMessage = e instanceof Error ? e.message : `Failed to load requirements for task ${currentTaskId}`;
      setError(errorMessage); 
      toast({ title: "Error Loading Requirements", description: errorMessage, variant: "destructive" });
    } finally {
      setLoadingRequirements(false);
    }
  }, [requirementsService, toast, currentTaskId]);

  React.useEffect(() => {
    loadInitialStaticData();
  }, [loadInitialStaticData]);

  React.useEffect(() => {
    if (currentTaskId !== undefined) {
      loadTaskRequirements();
    } else {
      setRequirements([]);
    }
  }, [currentTaskId, loadTaskRequirements]);

  const updateRequirementCount = async (
    taskId: number,
    locationId: number,
    timeslotId: number,
    requiredCount: number
  ) => {
    const validRequiredCount = Math.max(0, requiredCount);

    try {
      await requirementsService.upsertRequirement({
        task_id: taskId,
        location_id: locationId,
        timeslot_id: timeslotId,
        required_count: validRequiredCount,
      });
      if (taskId === currentTaskId) {
        await loadTaskRequirements(); 
      }
      toast({ title: "Success", description: "Requirement updated." });
    } catch (e: any) {
      const errorMessage = e instanceof Error ? e.message : "Failed to update requirement";
      toast({ title: "Error Updating Requirement", description: errorMessage, variant: "destructive" });
      throw e; 
    }
  };

  const requirementRows = React.useMemo((): RequirementRow[] => {
    if (!currentTaskId || locations.length === 0 || timeslots.length === 0) {
      return [];
    }
    const currentTask = tasks.find(t => t.id === currentTaskId);
    return locations.flatMap(loc =>
      timeslots.map(ts => {
        const existingReq = requirements.find(
          r => r.location_id === loc.id && r.timeslot_id === ts.id
        ); 
        return {
          task_id: currentTaskId,
          location_id: loc.id,
          timeslot_id: ts.id,
          required_count: existingReq?.required_count || 0,
          id: existingReq?.id,
          created_at: existingReq?.created_at,
          updated_at: existingReq?.updated_at,
          task_name: currentTask?.name || 'N/A',
          location_name: loc.name,
          timeslot_name: ts.name,
        };
      })
    );
  }, [requirements, tasks, locations, timeslots, currentTaskId]);

  return {
    tasks,
    locations,
    timeslots,
    requirementRows,
    loading: loadingInitial || loadingRequirements, 
    loadingInitial, 
    loadingRequirements,
    error, 
    currentTaskId,
    setCurrentTaskId,
    updateRequirementCount,
    refreshRequirements: loadTaskRequirements,
  };
}
export type RequirementsData = ReturnType<typeof useRequirementsData>;
