// src/app/app/requirements/components/filters-bar.tsx
"use client";

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ReportFilters } from '../types';

interface FiltersBarProps {
  onFilterChange: (filters: ReportFilters) => void;
  userRole?: string;
}

export function FiltersBar({
  onFilterChange,
  userRole = 'volunteer',
}: FiltersBarProps) {
  const [filters, setFilters] = React.useState<ReportFilters>({
    seva_category_ids: [],
    timeslot_ids: [],
    location_ids: [],
  });

  const [searchTerm, setSearchTerm] = React.useState('');
  const [debouncedSearchTerm] = React.useState('');

  const handleFilterChange = (
    type: keyof ReportFilters,
    value: any
  ) => {
    const newFilters = { ...filters, [type]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const newFilters: ReportFilters = {
      seva_category_ids: [],
      timeslot_ids: [],
      location_ids: [],
    };
    setFilters(newFilters);
    setSearchTerm('');
    onFilterChange(newFilters);
  };

  const hasActiveFilters = Object.values(filters).some(
    (value) => Array.isArray(value) ? value.length > 0 : !!value
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {/* Search Input */}
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search seva categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Filter Selects */}
        <Select
          value={filters.timeslot_ids?.length ? filters.timeslot_ids.join(',') : ''}
          onValueChange={(value) => handleFilterChange('timeslot_ids', value.split(',').map(Number).filter(Boolean))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Timeslot" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Timeslots</SelectLabel>
              <SelectItem value="">All Timeslots</SelectItem>
              {/* Add timeslot options dynamically */}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select
          value={filters.location_ids?.length ? filters.location_ids.join(',') : ''}
          onValueChange={(value) => handleFilterChange('location_ids', value.split(',').map(Number).filter(Boolean))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Locations</SelectLabel>
              <SelectItem value="">All Locations</SelectItem>
              {/* Add location options dynamically */}
            </SelectGroup>
          </SelectContent>
        </Select>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-10"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1.5">
          {filters.seva_category_ids?.map((id) => (
            <Badge
              key={`seva-${id}`}
              variant="secondary"
              className="h-6"
            >
              Seva Category {id}
              <button
                onClick={() => handleFilterChange(
                  'seva_category_ids',
                  filters.seva_category_ids?.filter((i) => i !== id)
                )}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {filters.timeslot_ids?.map((id) => (
            <Badge
              key={`time-${id}`}
              variant="secondary"
              className="h-6"
            >
              Timeslot {id}
              <button
                onClick={() => handleFilterChange(
                  'timeslot_ids',
                  filters.timeslot_ids?.filter((i) => i !== id)
                )}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {filters.location_ids?.map((id) => (
            <Badge
              key={`loc-${id}`}
              variant="secondary"
              className="h-6"
            >
              Location {id}
              <button
                onClick={() => handleFilterChange(
                  'location_ids',
                  filters.location_ids?.filter((i) => i !== id)
                )}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
