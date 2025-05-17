"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
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
}: AssignmentsFiltersProps) {
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center w-full">
      {/* Search Input - Leftmost element */}
      <div className="relative md:col-span-5 col-span-1 order-first">
        <Input
          id="volunteer-search"
          type="text"
          placeholder="Search volunteers..."
          value={searchQuery}
          onChange={handleSearchInputChange}
          className="w-full pl-9"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>

      {/* Time Slot Filter */}
      <div className="md:col-span-3 col-span-1">
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
      <div className="md:col-span-3 col-span-1">
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
