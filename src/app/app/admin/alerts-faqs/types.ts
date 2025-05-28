// src/app/app/admin/alerts-faqs/types.ts
export interface Alert {
  id?: number;
  title: string;
  content?: string | null;
  category?: string | null;
  time_slot_id_filter?: number | null;  // For form handling
  timeslot_id_filter?: number | null;   // From database
  start_date?: string | null;
  end_date?: string | null;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
  // For display
  time_slot?: { slot_name: string } | null;
  timeslot_name?: string | null;
}

export interface FAQ {
  id?: number;
  question: string;
  answer: string;
  category?: string | null;
  time_slot_id_filter?: number | null;  // For form handling
  timeslot_id_filter?: number | null;   // From database
  sort_order?: number;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
  // For display
  time_slot?: { slot_name: string } | null;
  timeslot_name?: string | null;
}

// For form handling - AlertFAQFormValues should cover all fields from both, including new ones.
// It's already Partial, so optional new fields are fine.
export type AlertFAQFormValues = Partial<Alert & FAQ>;

// Timeslot type for populating select dropdown
export interface Timeslot {
  id: number;
  name: string;
}
