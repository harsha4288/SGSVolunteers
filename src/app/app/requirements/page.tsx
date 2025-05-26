// src/app/app/requirements/page.tsx
"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RequirementsTable } from './components/requirements-table';
import { useRequirementsData } from './hooks/use-requirements-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, ListChecks } from 'lucide-react';

export default function RequirementsPage() {
  const requirementsData = useRequirementsData({ initialTaskId: undefined }); // Pass undefined, hook handles default
  const { tasks, loadingInitial, error, currentTaskId, setCurrentTaskId } = requirementsData;

  // Loading state for the entire page, primarily for the task selector
  if (loadingInitial && tasks.length === 0) {
    return (
      <div className="container mx-auto py-3 px-2 space-y-3">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2"> 
              <ListChecks className="h-5 w-5 text-accent flex-shrink-0"/> 
              <div> 
                <Skeleton className="h-6 w-48" /> 
                <Skeleton className="h-4 w-72 mt-1" /> 
              </div> 
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-10 w-full md:w-1/2 lg:w-1/3" /> {/* Task Select Skeleton */}
            <Skeleton className="h-48 w-full" /> {/* Table Skeleton Placeholder */}
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Error state when tasks (essential for page function) fail to load
  if (error && tasks.length === 0 && !loadingInitial) {
    return (
      <div className="container mx-auto py-3 px-2">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Page Data</AlertTitle>
          <AlertDescription>
            Failed to load essential task information: {error}. Please try refreshing the page or contact support if the issue persists.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-3 px-2 space-y-3">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-accent flex-shrink-0" />
            <div>
              <CardTitle>Volunteer Requirements</CardTitle>
              <CardDescription>
                Define the number of volunteers needed for each task, at specific locations and timeslots.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {tasks.length > 0 ? (
            <div>
              <label htmlFor="task-select" className="block text-sm font-medium text-muted-foreground mb-1">
                Select Task to Configure:
              </label>
              <Select
                value={currentTaskId?.toString() || ""}
                onValueChange={(value) => {
                    const newTaskId = parseInt(value, 10);
                    // setCurrentTaskId will handle undefined if newTaskId is NaN
                    setCurrentTaskId(isNaN(newTaskId) ? undefined : newTaskId);
                }}
                disabled={loadingInitial} // Disable while tasks are still loading initially
              >
                <SelectTrigger id="task-select" className="w-full md:w-1/2 lg:w-1/3">
                  <SelectValue placeholder="Select a task..." />
                </SelectTrigger>
                <SelectContent>
                  {tasks.map((task) => (
                    <SelectItem key={task.id} value={task.id.toString()}>
                      {task.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
             // Only show "No tasks found" if not loading and no error already displayed for tasks
             !loadingInitial && !error && <p className="text-muted-foreground text-center py-4">No tasks found. Please create tasks in the system before configuring requirements.</p>
          )}
          
          {/* RequirementsTable handles its own loading/error states based on currentTaskId */}
          <RequirementsTable requirementsData={requirementsData} />

        </CardContent>
      </Card>
    </div>
  );
}
