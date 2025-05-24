export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Functions: {
      add_tshirt_preference: {
        Args: {
          p_volunteer_id: string;
          p_event_id: number;
          p_size_cd: string;
          p_quantity?: number;
        };
        Returns: string;
      };
      remove_tshirt_preference: {
        Args: {
          p_volunteer_id: string;
          p_event_id: number;
          p_size_cd: string;
        };
        Returns: boolean;
      };
    };
    Tables: {
      events: {
        Row: {
          id: number
          event_name: string
          start_date: string | null
          end_date: string | null
          created_at: string
        }
        Insert: {
          id?: number
          event_name: string
          start_date?: string | null
          end_date?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          event_name?: string
          start_date?: string | null
          end_date?: string | null
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string // UUID
          user_id: string | null // UUID, FK to auth.users.id
          email: string
          display_name: string | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string // UUID
          user_id?: string | null // UUID
          email: string
          display_name?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string // UUID
          user_id?: string | null // UUID
          email?: string
          display_name?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      volunteers: {
        Row: {
          id: string // UUID, PK
          profile_id: string // UUID, FK to public.profiles.id
          email: string
          first_name: string
          last_name: string
          phone: string | null
          gender: string | null
          gm_family: boolean | null // Gita Mahāyajña family
          association_with_mahayajna: string | null
          additional_notes: string | null
          tags: string[] | null // For AI generated tags
          created_at: string
          updated_at: string
          // Fields from old Volunteer type that might be relevant here
          // sevaDates: string (will be derived from commitments)
          location: string | null // Primary location for this volunteer, if general
          tshirt_size_preference: string | null // T-shirt size preference
          requested_tshirt_quantity: number | null // Number of T-shirts requested
          // otherLocation?: string (can be in additional_notes)
          // mahayajnaStudentName?: string (can be in additional_notes or a separate related table if complex)
          // batch?: string (can be in additional_notes)
          // hospitality: "Yes" | "No" | string (could be a boolean field or in notes)
          // allEventDaysFullTime: "Yes" | "No" | string (derived from commitments)
          // volCategory: string (derived from assigned seva categories)
          // totalVolunteering: string (derived from commitments)
          // allDays: "Yes" | "No" | string (derived from commitments)
        }
        Insert: {
          id?: string // UUID
          profile_id: string // UUID
          email: string
          first_name: string
          last_name: string
          phone?: string | null
          gender?: string | null
          gm_family?: boolean | null
          association_with_mahayajna?: string | null
          additional_notes?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
          location?: string | null
          tshirt_size_preference?: string | null
          requested_tshirt_quantity?: number | null
        }
        Update: {
          id?: string // UUID
          profile_id?: string // UUID
          email?: string
          first_name?: string
          last_name?: string
          phone?: string | null
          gender?: string | null
          gm_family?: boolean | null
          association_with_mahayajna?: string | null
          additional_notes?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
          location?: string | null
          tshirt_size_preference?: string | null
          requested_tshirt_quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "volunteers_profile_id_fkey"
            columns: ["profile_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      time_slots: {
        Row: {
          id: number // BIGINT, PK
          event_id: number // BIGINT, FK to public.events.id
          slot_name: string // TEXT, UNIQUE with event_id
          start_time: string // TIMESTAMPTZ
          end_time: string // TIMESTAMPTZ
          description: string | null // TEXT, full descriptive name
          created_at: string
        }
        Insert: {
          id?: number
          event_id: number
          slot_name: string
          start_time: string
          end_time: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          event_id?: number
          slot_name?: string
          start_time?: string
          end_time?: string
          description?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_slots_event_id_fkey"
            columns: ["event_id"]
            referencedRelation: "events"
            referencedColumns: ["id"]
          }
        ]
      }
      seva_categories: {
        Row: {
          id: number // BIGINT, PK
          event_id: number // FK to public.events.id
          category_name: string // TEXT, UNIQUE with event_id
          description: string | null // TEXT
          created_at: string
        }
        Insert: {
          id?: number
          event_id: number
          category_name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          event_id?: number
          category_name?: string
          description?: string | null
          created_at?: string
        }
        Relationships: [
           {
            foreignKeyName: "seva_categories_event_id_fkey"
            columns: ["event_id"]
            referencedRelation: "events"
            referencedColumns: ["id"]
          }
        ]
      }
      volunteer_commitments: {
        Row: {
          id: number // BIGINT, PK
          volunteer_id: string // UUID, FK to public.volunteers.id
          time_slot_id: number // BIGINT, FK to public.time_slots.id
          event_id: number // FK to public.events.id (denormalized for easier filtering)
          commitment_type: "PROMISED_AVAILABILITY" | "ASSIGNED_TASK" // TEXT
          seva_category_id: number | null // BIGINT, FK to public.seva_categories.id
          task_notes: string | null // TEXT
          source_reference: string | null // TEXT
          checked_in_at: string | null // TIMESTAMPTZ, for check-in system
          check_in_notes: string | null // TEXT, notes by team leader during check-in
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          volunteer_id: string
          time_slot_id: number
          event_id: number
          commitment_type: "PROMISED_AVAILABILITY" | "ASSIGNED_TASK"
          seva_category_id?: number | null
          task_notes?: string | null
          source_reference?: string | null
          checked_in_at?: string | null
          check_in_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          volunteer_id?: string
          time_slot_id?: number
          event_id?: number
          commitment_type?: "PROMISED_AVAILABILITY" | "ASSIGNED_TASK"
          seva_category_id?: number | null
          task_notes?: string | null
          source_reference?: string | null
          checked_in_at?: string | null
          check_in_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_commitments_volunteer_id_fkey"
            columns: ["volunteer_id"]
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_commitments_time_slot_id_fkey"
            columns: ["time_slot_id"]
            referencedRelation: "time_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_commitments_seva_category_id_fkey"
            columns: ["seva_category_id"]
            referencedRelation: "seva_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_commitments_event_id_fkey"
            columns: ["event_id"]
            referencedRelation: "events"
            referencedColumns: ["id"]
          }
        ]
      }
      tshirt_sizes: {
        Row: {
          id: number
          event_id: number
          size_name: string // e.g., S, M, L, XL
          sort_order: number | null
          created_at: string
        }
        Insert: {
          id?: number
          event_id: number
          size_name: string
          sort_order?: number | null
          created_at?: string
        }
        Update: {
          id?: number
          event_id?: number
          size_name?: string
          sort_order?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tshirt_sizes_event_id_fkey"
            columns: ["event_id"]
            referencedRelation: "events"
            referencedColumns: ["id"]
          }
        ]
      }
      tshirt_inventory: {
        Row: {
          event_id: number // FK to events
          size_cd: string
          quantity: number
          quantity_on_hand: number
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          event_id: number
          size_cd: string
          quantity: number
          quantity_on_hand: number
          sort_order: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          event_id?: number
          size_cd?: string
          quantity?: number
          quantity_on_hand?: number
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_tshirt_inventory_event_id"
            columns: ["event_id"]
            referencedRelation: "events"
            referencedColumns: ["id"]
          }
        ]
      }
      tshirt_issuances: {
        Row: {
          id: string // UUID
          event_id: number // FK to events
          volunteer_id: string // FK to volunteers
          size: string // T-shirt size code
          issued_at: string // TIMESTAMPTZ
          issued_by_profile_id: string | null // FK to profiles (who scanned/logged it)
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string // UUID
          event_id: number
          volunteer_id: string
          size: string
          issued_at?: string // Defaults to now()
          issued_by_profile_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string // UUID
          event_id?: number
          volunteer_id?: string
          size?: string
          issued_at?: string
          issued_by_profile_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tshirt_issuances_event_id_fkey"
            columns: ["event_id"]
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tshirt_issuances_volunteer_id_fkey"
            columns: ["volunteer_id"]
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tshirt_issuances_issued_by_profile_id_fkey"
            columns: ["issued_by_profile_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      },
      volunteer_tshirts: {
        Row: {
          id: string // UUID
          volunteer_id: string // FK to volunteers
          event_id: number // FK to events
          size: string // T-shirt size code
          status: string // 'preferred', 'issued', or 'returned'
          quantity: number
          issued_by_profile_id: string | null // FK to profiles (who scanned/logged it)
          issued_at: string | null // TIMESTAMPTZ
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string // UUID
          volunteer_id: string
          event_id: number
          size: string
          status: string
          quantity?: number
          issued_by_profile_id?: string | null
          issued_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string // UUID
          volunteer_id?: string
          event_id?: number
          size?: string
          status?: string
          quantity?: number
          issued_by_profile_id?: string | null
          issued_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_volunteer_tshirts_volunteer_id"
            columns: ["volunteer_id"]
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_volunteer_tshirts_event_id"
            columns: ["event_id"]
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_volunteer_tshirts_issued_by_profile_id"
            columns: ["issued_by_profile_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_volunteer_tshirts_size_event"
            columns: ["event_id", "size"]
            referencedRelation: "tshirt_inventory"
            referencedColumns: ["event_id", "size_cd"]
          }
        ]
      }
      roles: {
        Row: {
          id: number;
          role_name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          role_name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          role_name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profile_roles: {
        Row: {
          profile_id: string;
          role_id: number;
          assigned_at: string;
        };
        Insert: {
          profile_id: string;
          role_id: number;
          assigned_at?: string;
        };
        Update: {
          profile_id?: string;
          role_id?: number;
          assigned_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profile_roles_profile_id_fkey",
            columns: ["profile_id"],
            referencedRelation: "profiles",
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_roles_role_id_fkey",
            columns: ["role_id"],
            referencedRelation: "roles",
            referencedColumns: ["id"]
          }
        ];
      };
      volunteer_check_ins: {
        Row: {
          id: number;
          volunteer_id: string;
          event_id: number;
          recorded_by_profile_id: string | null;
          check_in_time: string;
          check_out_time: string | null;
          location: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          volunteer_id: string;
          event_id: number;
          recorded_by_profile_id?: string | null;
          check_in_time: string;
          check_out_time?: string | null;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          volunteer_id?: string;
          event_id?: number;
          recorded_by_profile_id?: string | null;
          check_in_time?: string;
          check_out_time?: string | null;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "volunteer_check_ins_volunteer_id_fkey",
            columns: ["volunteer_id"],
            referencedRelation: "volunteers",
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_check_ins_event_id_fkey",
            columns: ["event_id"],
            referencedRelation: "events",
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_check_ins_recorded_by_profile_id_fkey",
            columns: ["recorded_by_profile_id"],
            referencedRelation: "profiles",
            referencedColumns: ["id"]
          }
        ];
      };
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Individual type exports for easier use
export type SupabaseEvent = Database['public']['Tables']['events']['Row'];
export type InsertSupabaseEvent = Database['public']['Tables']['events']['Insert'];
export type UpdateSupabaseEvent = Database['public']['Tables']['events']['Update'];

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type InsertProfile = Database['public']['Tables']['profiles']['Insert'];
export type UpdateProfile = Database['public']['Tables']['profiles']['Update'];

export type Volunteer = Database['public']['Tables']['volunteers']['Row'];
export type InsertVolunteer = Database['public']['Tables']['volunteers']['Insert'];
export type UpdateVolunteer = Database['public']['Tables']['volunteers']['Update'];

export type TimeSlot = Database['public']['Tables']['time_slots']['Row'];
export type InsertTimeSlot = Database['public']['Tables']['time_slots']['Insert'];
export type UpdateTimeSlot = Database['public']['Tables']['time_slots']['Update'];

export type SevaCategory = Database['public']['Tables']['seva_categories']['Row'];
export type InsertSevaCategory = Database['public']['Tables']['seva_categories']['Insert'];
export type UpdateSevaCategory = Database['public']['Tables']['seva_categories']['Update'];

export type VolunteerCommitment = Database['public']['Tables']['volunteer_commitments']['Row'];
export type InsertVolunteerCommitment = Database['public']['Tables']['volunteer_commitments']['Insert'];
export type UpdateVolunteerCommitment = Database['public']['Tables']['volunteer_commitments']['Update'];

export type TShirtSize = Database['public']['Tables']['tshirt_sizes']['Row'];
export type InsertTShirtSize = Database['public']['Tables']['tshirt_sizes']['Insert'];
export type UpdateTShirtSize = Database['public']['Tables']['tshirt_sizes']['Update'];

export type TShirtInventory = Database['public']['Tables']['tshirt_inventory']['Row'];
export type InsertTShirtInventory = Database['public']['Tables']['tshirt_inventory']['Insert'];
export type UpdateTShirtInventory = Database['public']['Tables']['tshirt_inventory']['Update'];

export type TShirtIssuance = Database['public']['Tables']['tshirt_issuances']['Row'];
export type InsertTShirtIssuance = Database['public']['Tables']['tshirt_issuances']['Insert'];
export type UpdateTShirtIssuance = Database['public']['Tables']['tshirt_issuances']['Update'];

// The NavItem type is not part of the DB schema, so it should be in a different types file or remain where it is.
export interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  external?: boolean;
}
