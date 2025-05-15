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
  events: Event[];
  timeSlots: TimeSlot[];
  tasks: Task[];
  selectedEvent: string;
  selectedTimeSlot: string;
  selectedTask: string;
  searchQuery: string;
  onEventChange: (value: string) => void;
  onTimeSlotChange: (value: string) => void;
  onTaskChange: (value: string) => void;
  onSearchChange: (value: string) => void;
}

export function AssignmentsFilters({
  events,
  timeSlots,
  tasks,
  selectedEvent,
  selectedTimeSlot,
  selectedTask,
  searchQuery,
  onEventChange,
  onTimeSlotChange,
  onTaskChange,
  onSearchChange,
}: AssignmentsFiltersProps) {
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Event Filter */}
      <div>
        <label htmlFor="event-filter" className="text-sm font-medium mb-1 block">
          Event
        </label>
        <Select value={selectedEvent} onValueChange={onEventChange}>
          <SelectTrigger id="event-filter" className="w-full">
            <SelectValue placeholder="Select event" />
          </SelectTrigger>
          <SelectContent>
            {events.map((event) => (
              <SelectItem key={event.id} value={event.id.toString()}>
                {event.event_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Time Slot Filter */}
      <div>
        <label htmlFor="time-slot-filter" className="text-sm font-medium mb-1 block">
          Time slot
        </label>
        <Select value={selectedTimeSlot} onValueChange={onTimeSlotChange}>
          <SelectTrigger id="time-slot-filter" className="w-full">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {timeSlots.map((slot) => (
              <SelectItem key={slot.id} value={slot.id.toString()}>
                {slot.slot_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Task Filter */}
      <div>
        <label htmlFor="task-filter" className="text-sm font-medium mb-1 block">
          Task
        </label>
        <Select value={selectedTask} onValueChange={onTaskChange}>
          <SelectTrigger id="task-filter" className="w-full">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {tasks.map((task) => (
              <SelectItem key={task.id} value={task.id.toString()}>
                {task.category_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Search Input */}
      <div>
        <label htmlFor="volunteer-search" className="text-sm font-medium mb-1 block">
          Search volunteers by name or email
        </label>
        <div className="relative">
          <Input
            id="volunteer-search"
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={handleSearchInputChange}
            className="w-full pl-9"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
