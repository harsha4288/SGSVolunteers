
export interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  external?: boolean;
  adminOnly?: boolean;
}

// All Supabase-related types are now in src/lib/types/supabase.ts
// This file can be used for other UI-specific or non-database types.

// Example of a type that might remain here or go into a more specific file:
export type VolunteerWithCommitments = import('./types/supabase').Volunteer & {
  commitments: import('./types/supabase').VolunteerCommitment[];
  profile: import('./types/supabase').Profile | null;
};

export type TimeSlotWithCommitments = import('./types/supabase').TimeSlot & {
  commitments: (import('./types/supabase').VolunteerCommitment & { volunteer: import('./types/supabase').Volunteer, seva_category: import('./types/supabase').SevaCategory | null })[];
};
