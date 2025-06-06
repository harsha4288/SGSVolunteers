export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      alerts: {
        Row: {
          active: boolean | null
          category: string | null
          content: string | null
          created_at: string | null
          end_date: string | null
          id: number
          start_date: string | null
          timeslot_id_filter: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: never
          start_date?: string | null
          timeslot_id_filter?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: never
          start_date?: string | null
          timeslot_id_filter?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_timeslot_id_filter_fkey"
            columns: ["timeslot_id_filter"]
            isOneToOne: false
            referencedRelation: "time_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          end_date: string | null
          event_name: string
          id: number
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          event_name: string
          id?: never
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          event_name?: string
          id?: never
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          active: boolean | null
          answer: string
          category: string | null
          created_at: string | null
          id: number
          question: string
          sort_order: number | null
          timeslot_id_filter: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          answer: string
          category?: string | null
          created_at?: string | null
          id?: never
          question: string
          sort_order?: number | null
          timeslot_id_filter?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          answer?: string
          category?: string | null
          created_at?: string | null
          id?: never
          question?: string
          sort_order?: number | null
          timeslot_id_filter?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "faqs_timeslot_id_filter_fkey"
            columns: ["timeslot_id_filter"]
            isOneToOne: false
            referencedRelation: "time_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: never
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: never
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profile_roles: {
        Row: {
          assigned_at: string | null
          profile_id: string
          role_id: number
        }
        Insert: {
          assigned_at?: string | null
          profile_id: string
          role_id: number
        }
        Update: {
          assigned_at?: string | null
          profile_id?: string
          role_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "profile_roles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string | null
          display_name: string | null
          email: string
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          email: string
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      requirements: {
        Row: {
          id: number | null
          location_id: number | null
          notes: string | null
          required_count: number | null
          seva_category_id: number | null
          timeslot_id: number | null
        }
        Insert: {
          id?: number | null
          location_id?: number | null
          notes?: string | null
          required_count?: number | null
          seva_category_id?: number | null
          timeslot_id?: number | null
        }
        Update: {
          id?: number | null
          location_id?: number | null
          notes?: string | null
          required_count?: number | null
          seva_category_id?: number | null
          timeslot_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "requirements_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          role_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: never
          role_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: never
          role_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      seva_categories: {
        Row: {
          category_name: string
          created_at: string | null
          description: string | null
          id: number
          updated_at: string | null
        }
        Insert: {
          category_name: string
          created_at?: string | null
          description?: string | null
          id?: never
          updated_at?: string | null
        }
        Update: {
          category_name?: string
          created_at?: string | null
          description?: string | null
          id?: never
          updated_at?: string | null
        }
        Relationships: []
      }
      time_slots: {
        Row: {
          created_at: string | null
          description: string | null
          end_time: string
          event_id: number
          id: number
          slot_name: string
          start_time: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_time: string
          event_id: number
          id?: never
          slot_name: string
          start_time: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_time?: string
          event_id?: number
          id?: never
          slot_name?: string
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_slots_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      tshirt_inventory: {
        Row: {
          created_at: string | null
          event_id: number
          quantity: number
          quantity_on_hand: number
          size_cd: string
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          event_id: number
          quantity?: number
          quantity_on_hand?: number
          size_cd: string
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: number
          quantity?: number
          quantity_on_hand?: number
          size_cd?: string
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_tshirt_inventory_event_id"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      tshirt_inventory_backup: {
        Row: {
          created_at: string | null
          event_id: number | null
          quantity: number | null
          quantity_on_hand: number | null
          size_name: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          event_id?: number | null
          quantity?: number | null
          quantity_on_hand?: number | null
          size_name?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: number | null
          quantity?: number | null
          quantity_on_hand?: number | null
          size_name?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      v_total: {
        Row: {
          coalesce: number | null
        }
        Insert: {
          coalesce?: number | null
        }
        Update: {
          coalesce?: number | null
        }
        Relationships: []
      }
      volunteer_check_ins: {
        Row: {
          check_in_time: string
          check_out_time: string | null
          created_at: string | null
          event_id: number
          id: number
          location: string | null
          recorded_by_profile_id: string | null
          time_slot_id: number | null
          updated_at: string | null
          volunteer_id: string
        }
        Insert: {
          check_in_time: string
          check_out_time?: string | null
          created_at?: string | null
          event_id: number
          id?: never
          location?: string | null
          recorded_by_profile_id?: string | null
          time_slot_id?: number | null
          updated_at?: string | null
          volunteer_id: string
        }
        Update: {
          check_in_time?: string
          check_out_time?: string | null
          created_at?: string | null
          event_id?: number
          id?: never
          location?: string | null
          recorded_by_profile_id?: string | null
          time_slot_id?: number | null
          updated_at?: string | null
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_check_ins_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_check_ins_recorded_by_profile_id_fkey"
            columns: ["recorded_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_check_ins_time_slot_id_fkey"
            columns: ["time_slot_id"]
            isOneToOne: false
            referencedRelation: "time_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_check_ins_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_commitments: {
        Row: {
          commitment_type: string
          created_at: string | null
          id: number
          seva_category_id: number | null
          source_reference: string | null
          task_notes: string | null
          time_slot_id: number
          updated_at: string | null
          volunteer_id: string
        }
        Insert: {
          commitment_type: string
          created_at?: string | null
          id?: never
          seva_category_id?: number | null
          source_reference?: string | null
          task_notes?: string | null
          time_slot_id: number
          updated_at?: string | null
          volunteer_id: string
        }
        Update: {
          commitment_type?: string
          created_at?: string | null
          id?: never
          seva_category_id?: number | null
          source_reference?: string | null
          task_notes?: string | null
          time_slot_id?: number
          updated_at?: string | null
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_commitments_seva_category_id_fkey"
            columns: ["seva_category_id"]
            isOneToOne: false
            referencedRelation: "seva_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_commitments_time_slot_id_fkey"
            columns: ["time_slot_id"]
            isOneToOne: false
            referencedRelation: "time_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_commitments_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_qr_codes: {
        Row: {
          created_at: string | null
          event_id: number
          expires_at: string | null
          generated_at: string | null
          id: number
          is_used: boolean | null
          qr_code_data: string
          updated_at: string | null
          volunteer_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: number
          expires_at?: string | null
          generated_at?: string | null
          id?: never
          is_used?: boolean | null
          qr_code_data: string
          updated_at?: string | null
          volunteer_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: number
          expires_at?: string | null
          generated_at?: string | null
          id?: never
          is_used?: boolean | null
          qr_code_data?: string
          updated_at?: string | null
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_qr_codes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_qr_codes_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_tshirts: {
        Row: {
          created_at: string | null
          event_id: number
          id: string
          issued_at: string | null
          issued_by_profile_id: string | null
          quantity: number
          size: string | null
          status: string
          updated_at: string | null
          volunteer_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: number
          id?: string
          issued_at?: string | null
          issued_by_profile_id?: string | null
          quantity?: number
          size?: string | null
          status: string
          updated_at?: string | null
          volunteer_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: number
          id?: string
          issued_at?: string | null
          issued_by_profile_id?: string | null
          quantity?: number
          size?: string | null
          status?: string
          updated_at?: string | null
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_volunteer_tshirts_size"
            columns: ["event_id", "size"]
            isOneToOne: false
            referencedRelation: "tshirt_inventory"
            referencedColumns: ["event_id", "size_cd"]
          },
          {
            foreignKeyName: "fk_volunteer_tshirts_size"
            columns: ["event_id", "size"]
            isOneToOne: false
            referencedRelation: "tshirt_sizes"
            referencedColumns: ["event_id", "size_name"]
          },
        ]
      }
      volunteers: {
        Row: {
          additional_info: string | null
          association_with_mahayajna: string | null
          created_at: string | null
          email: string
          first_name: string
          gender: string | null
          gm_family: boolean | null
          google_form_submission_timestamp: string | null
          hospitality_needed: boolean | null
          id: string
          last_name: string
          location: string | null
          mahayajna_student_name: string | null
          other_location: string | null
          phone: string | null
          profile_id: string | null
          requested_tshirt_quantity: number | null
          student_batch: string | null
          tshirt_size_preference: string | null
          updated_at: string | null
        }
        Insert: {
          additional_info?: string | null
          association_with_mahayajna?: string | null
          created_at?: string | null
          email: string
          first_name: string
          gender?: string | null
          gm_family?: boolean | null
          google_form_submission_timestamp?: string | null
          hospitality_needed?: boolean | null
          id?: string
          last_name: string
          location?: string | null
          mahayajna_student_name?: string | null
          other_location?: string | null
          phone?: string | null
          profile_id?: string | null
          requested_tshirt_quantity?: number | null
          student_batch?: string | null
          tshirt_size_preference?: string | null
          updated_at?: string | null
        }
        Update: {
          additional_info?: string | null
          association_with_mahayajna?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          gender?: string | null
          gm_family?: boolean | null
          google_form_submission_timestamp?: string | null
          hospitality_needed?: boolean | null
          id?: string
          last_name?: string
          location?: string | null
          mahayajna_student_name?: string | null
          other_location?: string | null
          phone?: string | null
          profile_id?: string | null
          requested_tshirt_quantity?: number | null
          student_batch?: string | null
          tshirt_size_preference?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "volunteers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      tshirt_issuances: {
        Row: {
          created_at: string | null
          event_id: number | null
          id: string | null
          issued_at: string | null
          issued_by_profile_id: string | null
          quantity: number | null
          size: string | null
          tshirt_inventory_id: number | null
          updated_at: string | null
          volunteer_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_id?: number | null
          id?: string | null
          issued_at?: string | null
          issued_by_profile_id?: string | null
          quantity?: number | null
          size?: string | null
          tshirt_inventory_id?: never
          updated_at?: string | null
          volunteer_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: number | null
          id?: string | null
          issued_at?: string | null
          issued_by_profile_id?: string | null
          quantity?: number | null
          size?: string | null
          tshirt_inventory_id?: never
          updated_at?: string | null
          volunteer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_volunteer_tshirts_size"
            columns: ["event_id", "size"]
            isOneToOne: false
            referencedRelation: "tshirt_inventory"
            referencedColumns: ["event_id", "size_cd"]
          },
          {
            foreignKeyName: "fk_volunteer_tshirts_size"
            columns: ["event_id", "size"]
            isOneToOne: false
            referencedRelation: "tshirt_sizes"
            referencedColumns: ["event_id", "size_name"]
          },
        ]
      }
      tshirt_sizes: {
        Row: {
          event_id: number | null
          id: number | null
          size_name: string | null
          sort_order: number | null
        }
        Insert: {
          event_id?: number | null
          id?: never
          size_name?: string | null
          sort_order?: number | null
        }
        Update: {
          event_id?: number | null
          id?: never
          size_name?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_tshirt_inventory_event_id"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_tshirt_preferences: {
        Row: {
          created_at: string | null
          event_id: number | null
          id: string | null
          is_fulfilled: boolean | null
          quantity: number | null
          size: string | null
          tshirt_size_id: number | null
          updated_at: string | null
          volunteer_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_id?: number | null
          id?: string | null
          is_fulfilled?: never
          quantity?: number | null
          size?: string | null
          tshirt_size_id?: never
          updated_at?: string | null
          volunteer_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: number | null
          id?: string | null
          is_fulfilled?: never
          quantity?: number | null
          size?: string | null
          tshirt_size_id?: never
          updated_at?: string | null
          volunteer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_volunteer_tshirts_size"
            columns: ["event_id", "size"]
            isOneToOne: false
            referencedRelation: "tshirt_inventory"
            referencedColumns: ["event", "size_cd"]
          },
          {
            foreignKeyName: "fk_volunteer_tshirts_size"
            columns: ["event_id", "size"]
            isOneToOne: false
            referencedRelation: "tshirt_sizes"
            referencedColumns: ["event_id", "size_name"]
          },
        ]
      }
      vw_assignments_vs_attendance: {
        Row: {
          actual_attendance_count: number | null
          assigned_volunteers_count: number | null
          task_id: number | null
          task_name: string | null
          timeslot_description: string | null
          timeslot_slot_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_commitments_seva_category_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "seva_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_requirements_vs_assignments: {
        Row: {
          assigned_volunteers: number | null
          category_name: string | null
          notes: string | null
          required_count: number | null
          seva_category_id: number | null
          slot_name: string | null
          timeslot_id: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_tshirt_preference: {
        Args: {
          p_volunteer_id: string
          p_event_id: number
          p_size_cd: string
          p_quantity?: number
          p_allow_override?: boolean
        }
        Returns: string
      }
      assign_role_to_user: {
        Args: { p_email: string; p_role_name: string }
        Returns: string
      }
      generate_volunteer_qr_code: {
        Args: { p_volunteer_id: string; p_event_id: number }
        Returns: string
      }
      get_tshirt_counts_by_volunteer: {
        Args: { p_event_id: number } | { p_event_id: number }
        Returns: {
          volunteer_name: string
          allocation: number
          status: string
          xs_count: number
          s_count: number
          m_count: number
          l_count: number
          xl_count: number
          xxl_count: number
          xxxl_count: number
          total_count: number
        }[]
      }
      get_tshirt_counts_by_volunteer_and_size: {
        Args: { p_event_id: number }
        Returns: {
          volunteer_id: string
          volunteer_name: string
          allocation: number
          status: string
          size_cd: string
          quantity: number
        }[]
      }
      get_tshirt_sizes: {
        Args: { p_event_id: number }
        Returns: {
          size_cd: string
          size_name: string
          sort_order: number
          quantity: number
          quantity_on_hand: number
        }[]
      }
      issue_tshirt: {
        Args: {
          p_volunteer_id: string
          p_event_id: number
          p_size_cd: string
          p_issued_by_profile_id: string
          p_quantity?: number
          p_allow_override?: boolean
        }
        Returns: string
      }
      manage_tshirt: {
        Args: {
          p_volunteer_id: string
          p_event_id: number
          p_size_cd: string
          p_status: string
          p_quantity?: number
          p_issued_by_profile_id?: string
          p_allow_override?: boolean
        }
        Returns: string
      }
      migrate_tshirt_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      remove_tshirt: {
        Args: {
          p_volunteer_id: string
          p_event_id: number
          p_size_cd: string
          p_status: string
          p_quantity?: number
        }
        Returns: boolean
      }
      remove_tshirt_preference: {
        Args:
          | { p_volunteer_id: string; p_event_id: number; p_size_cd: string }
          | {
              p_volunteer_id: string
              p_event_id: number
              p_size_cd: string
              p_quantity?: number
            }
        Returns: boolean
      }
      return_tshirt: {
        Args:
          | {
              p_volunteer_id: string
              p_event_id: number
              p_size_cd: string
              p_quantity?: number
            }
          | { p_volunteer_id: string; p_event_id: number; p_size_name: string }
        Returns: boolean
      }
      validate_volunteer_qr_code: {
        Args: { p_qr_code_data: string }
        Returns: {
          volunteer_id: string
          event_id: number
          is_valid: boolean
          message: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
