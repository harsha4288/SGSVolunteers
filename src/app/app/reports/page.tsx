// src/app/app/reports/page.tsx
"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart2, FileText, CheckSquare } from 'lucide-react'; // Icons for reports

import { ReportFilters } from './components/report-filters';
import { RequirementsVsAssignmentsView } from './components/views/requirements-vs-assignments-view';
import { RequirementsByLocationView } from './components/views/requirements-by-location-view';
import { AssignmentsVsAttendanceView } from './components/views/assignments-vs-attendance-view';

import type { ReportFilters as ReportFiltersType } from './types';
import { createClient } from '@/lib/supabase/client';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = React.useState<string>('requirements_vs_assignments');
  const [filters, setFilters] = React.useState<ReportFiltersType>({});

  // State for filter options
  const [sevaCategories, setSevaCategories] = React.useState<Array<{id: number, category_name: string}>>([]);
  const [timeslots, setTimeslots] = React.useState<Array<{id: number, slot_name: string}>>([]);
  const [locations, setLocations] = React.useState<Array<{id: number, name: string}>>([]);
  const [loadingFilterOptions, setLoadingFilterOptions] = React.useState(true);

  React.useEffect(() => {
    const fetchOptions = async () => {
      setLoadingFilterOptions(true);
      try {
        const supabase = createClient();

        const [categoriesResult, timeslotsResult, locationsResult] = await Promise.all([
          supabase.from('seva_categories').select('id, category_name').order('category_name'),
          supabase.from('time_slots').select('id, slot_name').order('start_time'),
          supabase.from('locations').select('id, name').order('name')
        ]);

        if (categoriesResult.data) setSevaCategories(categoriesResult.data);
        if (timeslotsResult.data) setTimeslots(timeslotsResult.data);
        if (locationsResult.data) setLocations(locationsResult.data);
      } catch (error) {
        console.warn('Failed to fetch filter options:', error);
      } finally {
        setLoadingFilterOptions(false);
      }
    };
    fetchOptions();
  }, []);

  const handleApplyFilters = (newFilters: ReportFiltersType) => {
    setFilters(newFilters);
  };

  return (
    <div className="container mx-auto py-3 px-2 space-y-4">
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-accent flex-shrink-0" />
            <div>
              <CardTitle>Volunteer Reports</CardTitle>
              <CardDescription>
                Analyze volunteer requirements, assignments, and attendance data. Use filters to refine your view.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <ReportFilters
        initialFilters={filters}
        onApplyFilters={handleApplyFilters}
        sevaCategories={sevaCategories}
        timeslots={timeslots}
        locations={locations}
        isLoadingOptions={loadingFilterOptions}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:max-w-2xl">
          <TabsTrigger value="requirements_vs_assignments" className="text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2">
            <BarChart2 className="h-3.5 w-3.5 mr-1.5 sm:mr-2"/> Variance (Reqs vs Asgn)
          </TabsTrigger>
          <TabsTrigger value="requirements_by_location" className="text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2">
            <FileText className="h-3.5 w-3.5 mr-1.5 sm:mr-2"/> Location Breakdown
          </TabsTrigger>
          <TabsTrigger value="assignments_vs_attendance" className="text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2">
            <CheckSquare className="h-3.5 w-3.5 mr-1.5 sm:mr-2"/> Attendance Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requirements_vs_assignments">
          <Card>
            <CardHeader>
              <CardTitle>Requirements vs. Assignments Variance</CardTitle>
              <CardDescription>
                Compares total volunteers required against those actually assigned for each Seva Category and Timeslot.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RequirementsVsAssignmentsView filters={filters} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requirements_by_location">
          <Card>
            <CardHeader>
              <CardTitle>Requirements Breakdown by Location</CardTitle>
              <CardDescription>
                Shows detailed volunteer counts required for each Seva Category, at specific Locations and Timeslots.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RequirementsByLocationView filters={filters} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments_vs_attendance">
          <Card>
            <CardHeader>
              <CardTitle>Assignments vs. Actual Attendance</CardTitle>
              <CardDescription>
                Compares the number of volunteers assigned to tasks against actual check-in data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AssignmentsVsAttendanceView filters={filters} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
