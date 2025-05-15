"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export interface FilterOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface FilterDropdownProps {
  title: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  isClearable?: boolean;
  placeholder?: string;
}

export function FilterDropdown({
  title,
  options,
  value,
  onChange,
  isClearable = true,
  placeholder = "Select option..."
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  
  const selectedOption = options.find(option => option.value === value);
  
  const handleClear = () => {
    onChange("");
    setOpen(false);
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value && selectedOption ? (
            <div className="flex items-center gap-2">
              {selectedOption.icon && (
                <selectedOption.icon className="h-4 w-4 text-muted-foreground" />
              )}
              <span>{selectedOption.label}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{title}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    onChange(option.value === value ? "" : option.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.icon && (
                    <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  )}
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          {isClearable && value && (
            <div className="p-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground"
                onClick={handleClear}
              >
                <X className="mr-2 h-4 w-4" />
                Clear filter
              </Button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export interface ActiveFiltersProps {
  filters: {
    id: string;
    label: string;
    value: string;
  }[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
}

export function ActiveFilters({ filters, onRemove, onClearAll }: ActiveFiltersProps) {
  if (filters.length === 0) return null;
  
  return (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      <span className="text-sm text-muted-foreground">Active filters:</span>
      {filters.map((filter) => (
        <Badge
          key={filter.id}
          variant="secondary"
          className="flex items-center gap-1"
        >
          {filter.label}: {filter.value}
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 p-0 ml-1"
            onClick={() => onRemove(filter.id)}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Remove {filter.label} filter</span>
          </Button>
        </Badge>
      ))}
      {filters.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={onClearAll}
        >
          Clear all
        </Button>
      )}
    </div>
  );
}
