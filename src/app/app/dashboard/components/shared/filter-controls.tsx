"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Filter, X, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterControlsProps {
  onSearch: (query: string) => void;
  onFilter: (filterKey: string, value: string) => void;
  onClearFilters: () => void;
  filters: Record<string, FilterOption[]>;
  activeFilters: Record<string, string>;
  searchPlaceholder?: string;
  className?: string;
}

export function FilterControls({
  onSearch,
  onFilter,
  onClearFilters,
  filters,
  activeFilters,
  searchPlaceholder = "Search...",
  className
}: FilterControlsProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query === "") {
      onSearch("");
    }
  };

  const handleFilter = (filterKey: string, value: string) => {
    // Convert "all" to empty string for the parent component
    const actualValue = value === "all" ? "" : value;
    onFilter(filterKey, actualValue);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    onClearFilters();
  };

  const hasActiveFilters = Object.keys(activeFilters).length > 0 || searchQuery.length > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col md:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex">
          <div className="relative flex-1">
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pr-10"
            />
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </form>

        {Object.entries(filters).map(([key, options]) => (
          <div key={key} className="w-full md:w-64">
            <Select
              value={activeFilters[key] || "all"}
              onValueChange={(value) => handleFilter(key, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Filter by ${key}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {key}s</SelectItem>
                {options.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}

        {hasActiveFilters && (
          <Button variant="outline" onClick={handleClearFilters} className="md:w-auto">
            <X className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {searchQuery && activeFilters['search'] && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Search: {searchQuery}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  setSearchQuery("");
                  onSearch("");
                }}
              />
            </Badge>
          )}

          {Object.entries(activeFilters).filter(([key]) => key !== 'search').map(([key, value]) => {
            const option = filters[key]?.find(opt => opt.value === value);
            return option ? (
              <Badge key={key} variant="secondary" className="flex items-center gap-1">
                {key}: {option.label}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilter(key, "all")}
                />
              </Badge>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}
