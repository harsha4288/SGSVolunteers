-- Drop the previously created table if it exists
DROP TABLE IF EXISTS public.volunteer_availability;

-- Create the new time_slots table
CREATE TABLE public.time_slots (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    event_date DATE NOT NULL,
    start_time TIME, -- Nullable for general slots like 'Full Day'
    end_time TIME,   -- Nullable for general slots like 'Full Day'
    slot_description TEXT NOT NULL UNIQUE, -- e.g., "9th July (Wednesday) - Morning", "8th PM"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- For potential future updates to slot definitions
);

COMMENT ON TABLE public.time_slots IS 'Defines all distinct time slots for the event.';
COMMENT ON COLUMN public.time_slots.slot_description IS 'Unique textual representation of the slot, used for mapping and UI.';

-- Create the new seva_categories table
CREATE TABLE public.seva_categories (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL UNIQUE, -- e.g., "Registration", "Food Distribution"
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.seva_categories IS 'Lists all unique types of services or tasks (seva).';
COMMENT ON COLUMN public.seva_categories.name IS 'The unique name of the seva category.';

-- Create the new volunteer_commitments table
CREATE TABLE public.volunteer_commitments (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    volunteer_uuid UUID NOT NULL,
    time_slot_id BIGINT NOT NULL,
    commitment_type TEXT NOT NULL CHECK (commitment_type IN ('PROMISED_AVAILABILITY', 'ASSIGNED_TASK')),
    assigned_seva_category_id BIGINT, -- Nullable, only for ASSIGNED_TASK
    task_notes TEXT, -- Additional details for a specific assignment
    source_reference TEXT, -- e.g., "Google Form", "Report Data Sheet Row X"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_volunteer
        FOREIGN KEY (volunteer_uuid)
        REFERENCES public.volunteers(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_time_slot
        FOREIGN KEY (time_slot_id)
        REFERENCES public.time_slots(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_seva_category
        FOREIGN KEY (assigned_seva_category_id)
        REFERENCES public.seva_categories(id)
        ON DELETE SET NULL, -- Or ON DELETE RESTRICT depending on desired behavior
    CONSTRAINT unique_volunteer_slot_task UNIQUE (volunteer_uuid, time_slot_id, assigned_seva_category_id)
);

COMMENT ON TABLE public.volunteer_commitments IS 'Links volunteers to time slots for promised availability or task assignments.';
COMMENT ON COLUMN public.volunteer_commitments.commitment_type IS 'Indicates if this is a promised availability or an assigned task.';
COMMENT ON COLUMN public.volunteer_commitments.assigned_seva_category_id IS 'Links to the seva_categories table if this is an assigned task.';

-- Enable Row Level Security (if you plan to use it, consistent with other tables)
ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seva_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_commitments ENABLE ROW LEVEL SECURITY;
-- Note: You will need to create RLS policies for these tables to control access.

-- Create indexes for performance
CREATE INDEX idx_volunteer_commitments_volunteer_uuid ON public.volunteer_commitments(volunteer_uuid);
CREATE INDEX idx_volunteer_commitments_time_slot_id ON public.volunteer_commitments(time_slot_id);
CREATE INDEX idx_volunteer_commitments_assigned_seva_id ON public.volunteer_commitments(assigned_seva_category_id);
CREATE INDEX idx_time_slots_slot_description ON public.time_slots(slot_description);
CREATE INDEX idx_seva_categories_name ON public.seva_categories(name);
