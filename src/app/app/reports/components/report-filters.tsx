// src/app/app/reports/components/report-filters.tsx
"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, FilterX } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar"; // Assuming this is your calendar component
import { cn } from "@/lib/utils";
import { format } from "date-fns";

import type { ReportFilters } from '../types'; // Assuming types.ts is in the parent directory
// Mock data for filter options - in a real app, these would come from props or a context/store
// For example, fetched in page.tsx and passed down.
interface FilterOption { value: string | number; label: string; }
const MOCK_SEVA_CATEGORIES: FilterOption[] = [
  { value: 1, label: "Parking Management" }, { value: 2, label: "Catering Support" }, { value: 3, label: "Info Desk" }
];
const MOCK_TIMESLOTS: FilterOption[] = [
  { value: 1, label: "Sat Morning (9am-12pm)" }, { value: 2, label: "Sat Afternoon (1pm-4pm)" }, { value: 3, label: "Sun Morning (9am-12pm)" }
];
const MOCK_LOCATIONS: FilterOption[] = [
  { value: 1, label: "Main Hall" }, { value: 2, label: "Dining Area" }, { value: 3, label: "Parking Lot A" }
];


interface ReportFiltersProps {
  initialFilters?: ReportFilters;
  onApplyFilters: (filters: ReportFilters) => void;
  // Props to supply options for dropdowns, e.g.:
  // sevaCategories: Array<{ id: number; name: string }>;
  // timeslots: Array<{ id: number; name: string }>;
  // locations: Array<{ id: number; name: string }>;
  // isLoadingOptions?: boolean;
}

export function ReportFilters({
  initialFilters = {},
  onApplyFilters,
  // sevaCategories = MOCK_SEVA_CATEGORIES, // Use mock data for now
  // timeslots = MOCK_TIMESLOTS,
  // locations = MOCK_LOCATIONS,
}: ReportFiltersProps) {
  const [selectedSevaCategoryIds, setSelectedSevaCategoryIds] = React.useState<number[]>(initialFilters.sevaCategoryIds || []);
  const [selectedTimeslotIds, setSelectedTimeslotIds] = React.useState<number[]>(initialFilters.timeslotIds || []);
  const [selectedLocationIds, setSelectedLocationIds] = React.useState<number[]>(initialFilters.locationIds || []);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(initialFilters.dateRange || undefined);
  
  // For multi-select popovers
  const [openSevaCategoryPicker, setOpenSevaCategoryPicker] = React.useState(false);
  const [openTimeslotPicker, setOpenTimeslotPicker] = React.useState(false);
  const [openLocationPicker, setOpenLocationPicker] = React.useState(false);

  const handleApply = () => {
    onApplyFilters({
      sevaCategoryIds: selectedSevaCategoryIds.length > 0 ? selectedSevaCategoryIds : null,
      timeslotIds: selectedTimeslotIds.length > 0 ? selectedTimeslotIds : null,
      locationIds: selectedLocationIds.length > 0 ? selectedLocationIds : null,
      dateRange: dateRange?.from || dateRange?.to ? dateRange : null,
    });
  };

  const handleReset = () => {
    setSelectedSevaCategoryIds([]);
    setSelectedTimeslotIds([]);
    setSelectedLocationIds([]);
    setDateRange(undefined);
    onApplyFilters({}); // Apply empty filters
  };
  
  const renderMultiSelectPopover = (
    label: string,
    options: FilterOption[],
    selectedValues: number[],
    setSelectedValues: React.Dispatch<React.SetStateAction<number[]>>,
    openState: boolean,
    setOpenState: React.Dispatch<React.SetStateAction<boolean>>
  ) => (
    <Popover open={openState} onOpenChange={setOpenState}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={openState} className="w-[200px] justify-between text-xs h-9">
          {selectedValues.length > 0
            ? `${selectedValues.length} ${label}(s) selected`
            : `Select ${label}(s)...`}
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder={`Search ${label}...`} className="h-8 text-xs" />
          <CommandList>
            <CommandEmpty>No {label.toLowerCase()} found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    const numericValue = Number(option.value);
                    setSelectedValues(
                      selectedValues.includes(numericValue)
                        ? selectedValues.filter((v) => v !== numericValue)
                        : [...selectedValues, numericValue]
                    );
                  }}
                  className="text-xs"
                >
                  <Check className={cn("mr-2 h-3 w-3", selectedValues.includes(Number(option.value)) ? "opacity-100" : "opacity-0")} />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );


  return (
    <Card className="mb-4">
      <CardHeader className="pb-3 pt-4">
        <CardTitle className="text-lg">Report Filters</CardTitle>
        <CardDescription className="text-xs">Refine the data displayed in the reports below.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2 pb-4">
        {/* Date Range Picker - Placeholder */}
        <Popover>
            <PopoverTrigger asChild>
                <Button
                id="date"
                variant={"outline"}
                className={cn(
                    "w-[260px] justify-start text-left font-normal h-9 text-xs",
                    !dateRange && "text-muted-foreground"
                )}
                >
                {dateRange?.from ? (
                    dateRange.to ? (
                    <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                    </>
                    ) : (
                    format(dateRange.from, "LLL dd, y")
                    )
                ) : (
                    <span>Pick a date range</span>
                )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                />
            </PopoverContent>
        </Popover>

        {renderMultiSelectPopover("Seva Category", MOCK_SEVA_CATEGORIES, selectedSevaCategoryIds, setSelectedSevaCategoryIds, openSevaCategoryPicker, setOpenSevaCategoryPicker)}
        {renderMultiSelectPopover("Timeslot", MOCK_TIMESLOTS, selectedTimeslotIds, setSelectedTimeslotIds, openTimeslotPicker, setOpenTimeslotPicker)}
        {renderMultiSelectPopover("Location", MOCK_LOCATIONS, selectedLocationIds, setSelectedLocationIds, openLocationPicker, setOpenLocationPicker)}
        
        <Button onClick={handleApply} size="sm" className="h-9 text-xs px-3">Apply Filters</Button>
        <Button onClick={handleReset} variant="ghost" size="sm" className="h-9 text-xs px-3">
            <FilterX className="h-3 w-3 mr-1" /> Reset
        </Button>
      </CardContent>
    </Card>
  );
}
