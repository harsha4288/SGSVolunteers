-- ---------------------------------------------------------------------------
-- SGSVolunteers Supabase PostgreSQL Schema
-- Version: 1.0
-- Date: May 11, 2025
--
-- This script creates all tables for the Volunteer Management application.
-- It is designed to be run on a clean database or includes DROP statements
-- for a full refresh.
-- ---------------------------------------------------------------------------

-- Drop existing tables in reverse order of dependency to avoid FK issues
DROP TABLE IF EXISTS public.volunteer_commitments CASCADE;
DROP TABLE IF EXISTS public.profile_roles CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;
DROP TABLE IF EXISTS public.volunteer_check_ins CASCADE;
DROP TABLE IF EXISTS public.tshirt_issuances CASCADE;
DROP TABLE IF EXISTS public.tshirt_inventory CASCADE;
DROP TABLE IF EXISTS public.volunteers CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.seva_categories CASCADE;
DROP TABLE IF EXISTS public.time_slots CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;

-- ---------------------------------------------------------------------------
-- Create `events` Table
-- ---------------------------------------------------------------------------
CREATE TABLE public.events (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    event_name TEXT NOT NULL UNIQUE,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.events IS 'Stores event details.';

-- Seed default event
INSERT INTO public.events (event_name, start_date, end_date) 
VALUES ('Gita Mahayajna 2025', '2025-07-08', '2025-07-12') 
ON CONFLICT (event_name) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Create `profiles` Table (App User Accounts)
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE, -- Link to Supabase Auth user, NULLABLE
    email TEXT UNIQUE NOT NULL, -- Login email for the app account
    display_name TEXT, 
    bio TEXT,          
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_profiles_user_id_on_profiles ON public.profiles(user_id);
CREATE INDEX idx_profiles_email_on_profiles ON public.profiles(email);
COMMENT ON TABLE public.profiles IS 'Stores app user account information, linked to Supabase auth.';
COMMENT ON COLUMN public.profiles.user_id IS 'FK to auth.users.id. Can be NULL until user logs in/verified.';

-- ---------------------------------------------------------------------------
-- Create `volunteers` Table (Individual Volunteer Details)
-- ---------------------------------------------------------------------------
CREATE TABLE public.volunteers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, 
    email TEXT NOT NULL, 
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT, 
    gender TEXT,
    gm_family BOOLEAN,
    association_with_mahayajna TEXT,
    mahayajna_student_name TEXT,
    student_batch TEXT,
    hospitality_needed BOOLEAN,
    location TEXT,
    other_location TEXT,
    additional_info TEXT,
    google_form_submission_timestamp TIMESTAMPTZ,
    requested_tshirt_quantity INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteers ADD CONSTRAINT unique_volunteer_person UNIQUE (email, first_name, last_name);
CREATE INDEX idx_volunteers_email_on_volunteers ON public.volunteers(email);
CREATE INDEX idx_volunteers_profile_id_on_volunteers ON public.volunteers(profile_id);
COMMENT ON TABLE public.volunteers IS 'Stores details for each individual volunteer from Google Form.';
COMMENT ON COLUMN public.volunteers.requested_tshirt_quantity IS 'Number of T-shirts initially allocated/requested by the volunteer as per Google Form.';

-- ---------------------------------------------------------------------------
-- Create `time_slots` Table
-- ---------------------------------------------------------------------------
CREATE TABLE public.time_slots (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    event_id BIGINT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    slot_name TEXT NOT NULL UNIQUE, 
    start_time TIMESTAMPTZ NOT NULL, 
    end_time TIMESTAMPTZ NOT NULL,   
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_time_slots_slot_name ON public.time_slots(slot_name);
COMMENT ON TABLE public.time_slots IS 'Defines specific time slots for volunteer activities.';

-- ---------------------------------------------------------------------------
-- Create `seva_categories` Table
-- ---------------------------------------------------------------------------
CREATE TABLE public.seva_categories (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    category_name TEXT NOT NULL UNIQUE, 
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.seva_categories ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_seva_categories_category_name ON public.seva_categories(category_name);
COMMENT ON TABLE public.seva_categories IS 'Defines categories of seva or tasks.';

-- ---------------------------------------------------------------------------
-- Create `roles` Table
-- ---------------------------------------------------------------------------
CREATE TABLE public.roles (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    role_name TEXT NOT NULL UNIQUE, 
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.roles IS 'Defines user roles within the application.';

INSERT INTO public.roles (role_name, description) VALUES
('Admin', 'System Administrator with full access.'),
('Team Lead', 'Leads a specific team or seva category, can manage check-ins/T-shirts for their area.'),
('Volunteer', 'Standard volunteer user.')
ON CONFLICT (role_name) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Create `profile_roles` Junction Table
-- ---------------------------------------------------------------------------
CREATE TABLE public.profile_roles (
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (profile_id, role_id) 
);
ALTER TABLE public.profile_roles ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_profile_roles_profile_id ON public.profile_roles(profile_id);
CREATE INDEX idx_profile_roles_role_id ON public.profile_roles(role_id);
COMMENT ON TABLE public.profile_roles IS 'Assigns roles to user profiles.';

-- ---------------------------------------------------------------------------
-- Create `tshirt_inventory` Table
-- ---------------------------------------------------------------------------
CREATE TABLE public.tshirt_inventory (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    event_id BIGINT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    size TEXT NOT NULL, 
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.tshirt_inventory ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_tshirt_inventory_event_id ON public.tshirt_inventory(event_id);
CREATE INDEX idx_tshirt_inventory_size ON public.tshirt_inventory(size);
COMMENT ON TABLE public.tshirt_inventory IS 'Tracks T-shirt inventory by size for events.';

-- ---------------------------------------------------------------------------
-- Create `tshirt_issuances` Table
-- ---------------------------------------------------------------------------
CREATE TABLE public.tshirt_issuances (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    volunteer_id UUID NOT NULL REFERENCES public.volunteers(id) ON DELETE CASCADE, 
    tshirt_inventory_id BIGINT NOT NULL REFERENCES public.tshirt_inventory(id) ON DELETE RESTRICT,
    issued_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    issuance_date TIMESTAMPTZ DEFAULT NOW(),
    size TEXT, 
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.tshirt_issuances ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_tshirt_issuances_volunteer_id ON public.tshirt_issuances(volunteer_id);
CREATE INDEX idx_tshirt_issuances_tshirt_inventory_id ON public.tshirt_issuances(tshirt_inventory_id);
CREATE INDEX idx_tshirt_issuances_issued_by_profile_id ON public.tshirt_issuances(issued_by_profile_id);
COMMENT ON TABLE public.tshirt_issuances IS 'Tracks T-shirts issued to volunteers.';
COMMENT ON COLUMN public.tshirt_issuances.issued_by_profile_id IS 'Profile ID of the user who recorded the T-shirt issuance.';

-- ---------------------------------------------------------------------------
-- Create `volunteer_check_ins` Table
-- ---------------------------------------------------------------------------
CREATE TABLE public.volunteer_check_ins (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    volunteer_id UUID NOT NULL REFERENCES public.volunteers(id) ON DELETE CASCADE,
    event_id BIGINT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    recorded_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    check_in_time TIMESTAMPTZ NOT NULL,
    check_out_time TIMESTAMPTZ,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.volunteer_check_ins ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_checkins_volunteer_id ON public.volunteer_check_ins(volunteer_id);
CREATE INDEX idx_checkins_event_id ON public.volunteer_check_ins(event_id);
CREATE INDEX idx_checkins_check_in_time ON public.volunteer_check_ins(check_in_time);
CREATE INDEX idx_checkins_recorded_by_profile_id ON public.volunteer_check_ins(recorded_by_profile_id);
COMMENT ON TABLE public.volunteer_check_ins IS 'Tracks actual volunteer check-in and check-out times for events.';
COMMENT ON COLUMN public.volunteer_check_ins.recorded_by_profile_id IS 'Profile ID of the user who recorded the check-in/out.';

-- ---------------------------------------------------------------------------
-- Create `volunteer_commitments` Table
-- ---------------------------------------------------------------------------
CREATE TABLE public.volunteer_commitments (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    volunteer_id UUID NOT NULL REFERENCES public.volunteers(id) ON DELETE CASCADE,
    time_slot_id BIGINT NOT NULL REFERENCES public.time_slots(id) ON DELETE CASCADE,
    commitment_type TEXT NOT NULL CHECK (commitment_type IN ('PROMISED_AVAILABILITY', 'ASSIGNED_TASK')),
    seva_category_id BIGINT REFERENCES public.seva_categories(id) ON DELETE SET NULL, 
    task_notes TEXT,
    source_reference TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_volunteer_commitment_detail UNIQUE (volunteer_id, time_slot_id, commitment_type, seva_category_id)
);
ALTER TABLE public.volunteer_commitments ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_commitments_volunteer_id ON public.volunteer_commitments(volunteer_id);
CREATE INDEX idx_commitments_time_slot_id ON public.volunteer_commitments(time_slot_id);
CREATE INDEX idx_commitments_seva_category_id ON public.volunteer_commitments(seva_category_id);
COMMENT ON TABLE public.volunteer_commitments IS 'Links volunteers to time slots for availability or assigned tasks.';

-- ---------------------------------------------------------------------------
SELECT 'SGSVolunteers Supabase Schema script finished.';
-- ---------------------------------------------------------------------------
