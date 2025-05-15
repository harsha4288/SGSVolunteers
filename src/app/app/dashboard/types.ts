// Dashboard component types

export interface Event {
  id: number;
  event_name: string;
  start_date: string;
  end_date: string;
  description?: string;
}

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
}

export interface Volunteer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  profile_id: string;
  event_id: number;
}

export interface TimeSlot {
  id: number;
  slot_name: string;
  start_time: string;
  end_time: string;
  event_id: number;
}

export interface SevaCategory {
  id: number;
  category_name: string;
  description: string | null;
}

export interface VolunteerCommitment {
  id: number;
  volunteer_id: string;
  time_slot_id: number;
  commitment_type: 'PROMISED_AVAILABILITY' | 'ASSIGNED_TASK';
  seva_category_id: number | null;
  task_notes: string | null;
  // We'll add a field to track check-in status, but it won't be from the database
  is_checked_in?: boolean;
  volunteer: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  time_slot: {
    slot_name: string;
    start_time: string;
    end_time: string;
  };
  seva_category: {
    id: number;
    category_name: string;
  } | null;
}

export interface UserRole {
  id: number;
  role_name: string;
  description: string | null;
}

export interface DashboardStats {
  totalVolunteers: number;
  totalAssignments: number;
  checkedIn: number;
  sevaCategories: number;
}

export interface FilterOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface ActiveFilter {
  id: string;
  label: string;
  value: string;
}

export interface VolunteerCheckIn {
  id: number;
  volunteer_id: string;
  event_id: number;
  recorded_by_profile_id?: string;
  check_in_time: string;
  check_out_time?: string;
  location?: string;
  created_at?: string;
  updated_at?: string;
}
