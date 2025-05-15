// Update the TimeSlot type definition to include the description field
// This should be applied to src/lib/types/supabase.ts

/*
Update the time_slots Row type to include description:

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
*/
