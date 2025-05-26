// src/app/app/admin/alerts-faqs/types.ts
export interface Alert {
  id?: number;
  category?: string | null;
  title: string;
  content?: string | null;
  timeslot_id_filter?: number | null;
  start_date?: string | null;
  end_date?: string | null;
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
  created_at?: string;
  updated_at?: string;
  // For display
  timeslot_name?: string | null;
}

// For form handling - can be a union or separate types if fields differ greatly
export type AlertFAQFormValues = Partial<Alert & FAQ>;

// Timeslot type for populating select dropdown
export interface Timeslot {
    id: number;
    name: string;
}
