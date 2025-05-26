"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Event, TimeSlot, Task } from "./assignments-dashboard";

interface AssignmentsFiltersProps {
  timeSlots: TimeSlot[];
  tasks: Task[];
  selectedTimeSlot: string;
  selectedTask: string;
  searchQuery: string;
  onTimeSlotChange: (value: string) => void;
  onTaskChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (value: string) => void;
}

export function AssignmentsFilters({
  timeSlots,
  tasks,
  selectedTimeSlot,
  selectedTask,
  searchQuery,
  onTimeSlotChange,
  onTaskChange,
  onSearchChange,
  onSearchSubmit,
}: AssignmentsFiltersProps) {
  const isMobile = useIsMobile();
  const [localSearchQuery, setLocalSearchQuery] = React.useState(searchQuery);

  // Update local search when external search query changes
  React.useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchQuery(value);
    // Only update parent immediately if clearing the search
    if (value === "") {
      onSearchChange(value);
      onSearchSubmit(value);
    } else {
      // For non-empty values, just update the input display
      onSearchChange(value);
    }
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSearchSubmit(localSearchQuery);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearchSubmit();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 w-full">
      {/* Search Input - Leftmost element */}
      <div className="relative flex-1 min-w-[200px] order-first">
        <form onSubmit={handleSearchSubmit} className="flex gap-1">
          <div className="relative flex-1">
            <Input
              id="volunteer-search"
              type="text"
              placeholder="Search volunteers..."
              value={localSearchQuery}
              onChange={handleSearchInputChange}
              onKeyPress={handleKeyPress}
              className={`w-full ${isMobile ? "pr-12" : "pl-9"}`}
            />
            {!isMobile && (
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            )}
          </div>
          {isMobile && (
            <Button
              type="submit"
              size="sm"
              variant="outline"
              className="px-3 flex-shrink-0"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </Button>
          )}
        </form>
      </div>

      {/* Time Slot Filter */}
      <div className="w-[150px] flex-shrink-0">
        <Select value={selectedTimeSlot} onValueChange={onTimeSlotChange}>
          <SelectTrigger id="time-slot-filter" className="w-full">
            <SelectValue placeholder="All Times" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Times</SelectItem>
            {timeSlots.map((slot) => (
              <SelectItem key={slot.id} value={slot.id.toString()}>
                {slot.description || slot.slot_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Task Filter */}
      <div className="w-[150px] flex-shrink-0">
        <Select value={selectedTask} onValueChange={onTaskChange}>
          <SelectTrigger id="task-filter" className="w-full">
            <SelectValue placeholder="All Tasks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tasks</SelectItem>
            {tasks.map((task) => (
              <SelectItem key={task.id} value={task.id.toString()}>
                {task.category_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
