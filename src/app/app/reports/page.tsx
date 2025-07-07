// src/app/app/reports/page.tsx
"use client";

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart2, FileText, CheckSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { ReportFilters } from './components/report-filters';
import { RequirementsVsAssignmentsView } from './components/views/requirements-vs-assignments-view';
import { RequirementsByLocationView } from './components/views/requirements-by-location-view';
import { AssignmentsVsAttendanceView } from './components/views/assignments-vs-attendance-view';

import type { ReportFilters as ReportFiltersType } from './types';
import { createClient } from '@/lib/supabase/client-ssr';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = React.useState<string>('requirements_vs_assignments');
  const [filters, setFilters] = React.useState<ReportFiltersType>({});
  const [isFilterExpanded, setIsFilterExpanded] = React.useState(false);

  // State for filter options
  const [sevaCategories, setSevaCategories] = React.useState<Array<{ id: number, category_name: string }>>([]);
  const [timeslots, setTimeslots] = React.useState<Array<{ id: number, slot_name: string }>>([]);
  const [locations, setLocations] = React.useState<Array<{ id: number, name: string }>>([]);
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
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Fixed Header */}
      <div className="flex-none bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 border-b">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-accent" />
            <h1 className="text-lg font-semibold">Volunteer Reports</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className="flex items-center gap-2"
          >
            {isFilterExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Filters
          </Button>
        </div>
      </div>

      {/* Collapsible Filters */}
      <div
        className={cn(
          "flex-none overflow-hidden transition-all duration-200 ease-in-out border-b",
          isFilterExpanded ? "h-auto py-4" : "h-0"
        )}
      >
        <div className="container">
          <ReportFilters
            initialFilters={filters}
            onApplyFilters={handleApplyFilters}
            sevaCategories={sevaCategories}
            timeslots={timeslots}
            locations={locations}
            isLoadingOptions={loadingFilterOptions}
          />
        </div>
      </div>

      {/* Main Content Area with Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="h-full flex flex-col"
        >
          {/* Tab List */}
          <div className="flex-none border-b bg-muted/40">
            <div className="container">
              <TabsList className="h-10">
                <TabsTrigger value="requirements_vs_assignments" className="text-xs">
                  <BarChart2 className="h-3.5 w-3.5 mr-1.5" /> Variance
                </TabsTrigger>
                <TabsTrigger value="requirements_by_location" className="text-xs">
                  <FileText className="h-3.5 w-3.5 mr-1.5" /> Location
                </TabsTrigger>
                <TabsTrigger value="assignments_vs_attendance" className="text-xs">
                  <CheckSquare className="h-3.5 w-3.5 mr-1.5" /> Attendance
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full container py-4">
              <TabsContent value="requirements_vs_assignments" className="mt-0 h-full">
                <RequirementsVsAssignmentsView filters={filters} />
              </TabsContent>
              <TabsContent value="requirements_by_location" className="mt-0 h-full">
                <RequirementsByLocationView filters={filters} />
              </TabsContent>
              <TabsContent value="assignments_vs_attendance" className="mt-0 h-full">
                <AssignmentsVsAttendanceView filters={filters} />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}