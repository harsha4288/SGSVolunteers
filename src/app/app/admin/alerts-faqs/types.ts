// src/app/app/admin/alerts-faqs/types.ts
export interface Alert {
  id?: number;
  category?: string | null;
  title: string;
  content?: string | null;
  timeslot_id_filter?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  active?: boolean; // New field
  created_at?: string;
  updated_at?: string;
  // For display
  timeslot_name?: string | null;
}

export interface FAQ {
  id?: number;
  category?: string | null;
  question: string;
  answer: string;
  timeslot_id_filter?: number | null;
  sort_order?: number; // New field
  active?: boolean; // New field
  created_at?: string;
  updated_at?: string;
  // For display
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
