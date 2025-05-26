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
  const requirementsData = useRequirementsData({ initialSevaCategoryId: undefined }); // Pass undefined, hook handles default
  const { sevaCategories, loadingInitial, error, currentSevaCategoryId, setCurrentSevaCategoryId } = requirementsData; // Renamed variables

  // Loading state for the entire page, primarily for the Seva Category selector
  if (loadingInitial && sevaCategories.length === 0) { // Renamed tasks
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
            <Skeleton className="h-10 w-full md:w-1/2 lg:w-1/3" /> {/* Seva Category Select Skeleton */}
            <Skeleton className="h-48 w-full" /> {/* Table Skeleton Placeholder */}
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Error state when Seva Categories (essential for page function) fail to load
  if (error && sevaCategories.length === 0 && !loadingInitial) { // Renamed tasks
    return (
      <div className="container mx-auto py-3 px-2">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Page Data</AlertTitle>
          <AlertDescription>
            Failed to load essential Seva Category information: {error}. Please try refreshing the page or contact support if the issue persists. {/* Updated text */}
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
                Define the number of volunteers needed for each Seva Category (Task), at specific locations and timeslots. {/* Updated text */}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {sevaCategories.length > 0 ? ( // Renamed tasks
            <div>
              <label htmlFor="seva-category-select" className="block text-sm font-medium text-muted-foreground mb-1"> {/* Updated htmlFor */}
                Select Seva Category to Configure: {/* Updated text */}
              </label>
              <Select
                value={currentSevaCategoryId?.toString() || ""} // Renamed currentTaskId
                onValueChange={(value) => {
                    const newSevaCategoryId = parseInt(value, 10); // Renamed newTaskId
                    // setCurrentSevaCategoryId will handle undefined if newSevaCategoryId is NaN
                    setCurrentSevaCategoryId(isNaN(newSevaCategoryId) ? undefined : newSevaCategoryId); // Renamed setCurrentTaskId, newTaskId
                }}
                disabled={loadingInitial} // Disable while Seva Categories are still loading initially
              >
                <SelectTrigger id="seva-category-select" className="w-full md:w-1/2 lg:w-1/3"> {/* Updated id */}
                  <SelectValue placeholder="Select a Seva Category..." /> {/* Updated text */}
                </SelectTrigger>
                <SelectContent>
                  {sevaCategories.map((sc) => ( // Renamed tasks to sevaCategories, task to sc
                    <SelectItem key={sc.id} value={sc.id.toString()}>
                      {sc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
             // Only show "No Seva Categories found" if not loading and no error already displayed for Seva Categories
             !loadingInitial && !error && <p className="text-muted-foreground text-center py-4">No Seva Categories found. Please create Seva Categories in the system before configuring requirements.</p> // Updated text
          )}
          
          {/* RequirementsTable handles its own loading/error states based on currentSevaCategoryId */}
          <RequirementsTable requirementsData={requirementsData} />

        </CardContent>
      </Card>
    </div>
  );
}
