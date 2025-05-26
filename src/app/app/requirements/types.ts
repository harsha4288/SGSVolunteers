// src/app/app/requirements/types.ts
export interface Requirement {
  id?: number;
  task_id: number;
  timeslot_id: number;
  location_id: number;
  required_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface Task {
  id: number;
  name: string;
  description?: string;
}

export interface Location {
  id: number;
  name: string;
}

export interface Timeslot {
  id: number;
  name: string; // e.g., "Sat 9am-11am"
  start_time?: string; // Optional, depending on table structure
  end_time?: string;   // Optional, depending on table structure
}

// Combined type for display
export interface RequirementRow extends Requirement {
  task_name?: string;
  location_name?: string;
  timeslot_name?: string;
}
