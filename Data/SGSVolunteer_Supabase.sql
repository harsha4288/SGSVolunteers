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
DROP TABLE IF EXISTS public.volunteer_qr_codes CASCADE;
DROP TABLE IF EXISTS public.tshirt_issuances CASCADE;
DROP TABLE IF EXISTS public.tshirt_inventory CASCADE;
DROP TABLE IF EXISTS public.tshirt_sizes CASCADE;
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
    tshirt_size_preference TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteers ADD CONSTRAINT unique_volunteer_person UNIQUE (email, first_name, last_name);
CREATE INDEX idx_volunteers_email_on_volunteers ON public.volunteers(email);
CREATE INDEX idx_volunteers_profile_id_on_volunteers ON public.volunteers(profile_id);
COMMENT ON TABLE public.volunteers IS 'Stores details for each individual volunteer from Google Form.';
COMMENT ON COLUMN public.volunteers.requested_tshirt_quantity IS 'Number of T-shirts initially allocated/requested by the volunteer as per Google Form.';
COMMENT ON COLUMN public.volunteers.tshirt_size_preference IS 'Preferred T-shirt size for the volunteer (e.g., S, M, L, XL, XXL).';

-- ---------------------------------------------------------------------------
-- Create `time_slots` Table
-- ---------------------------------------------------------------------------
CREATE TABLE public.time_slots (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    event_id BIGINT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    slot_name TEXT NOT NULL UNIQUE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_time_slots_slot_name ON public.time_slots(slot_name);
COMMENT ON TABLE public.time_slots IS 'Defines specific time slots for volunteer activities.';
COMMENT ON COLUMN public.time_slots.slot_name IS 'Short name used for assignments (e.g., "8th PM", "9th AM").';
COMMENT ON COLUMN public.time_slots.description IS 'Full descriptive name of the time slot (e.g., "8th July (Tuesday) - Evening").';

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
-- Create trigger to automatically assign Volunteer role to new profiles
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION assign_default_volunteer_role()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert the Volunteer role (ID: 3) for the new profile
    INSERT INTO public.profile_roles (profile_id, role_id, assigned_at)
    VALUES (NEW.id, 3, NOW());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on the profiles table
CREATE TRIGGER trg_assign_default_volunteer_role
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION assign_default_volunteer_role();

-- Assign Volunteer role to all existing profiles that don't have any role
INSERT INTO public.profile_roles (profile_id, role_id, assigned_at)
SELECT
    p.id,
    3, -- Volunteer role ID
    NOW()
FROM
    public.profiles p
WHERE
    NOT EXISTS (
        SELECT 1
        FROM public.profile_roles pr
        WHERE pr.profile_id = p.id
    );

-- Assign specific roles to key users
-- Assign Admin role to datta.rajesh@gmail.com
INSERT INTO public.profile_roles (profile_id, role_id, assigned_at)
SELECT
    p.id,
    1, -- Admin role ID
    NOW()
FROM
    public.profiles p
WHERE
    p.email = 'datta.rajesh@gmail.com'
AND
    NOT EXISTS (
        SELECT 1
        FROM public.profile_roles pr
        WHERE pr.profile_id = p.id AND pr.role_id = 1
    );

-- Assign Team Lead role to harshayarlagadda2@gmail.com
INSERT INTO public.profile_roles (profile_id, role_id, assigned_at)
SELECT
    p.id,
    2, -- Team Lead role ID
    NOW()
FROM
    public.profiles p
WHERE
    p.email = 'harshayarlagadda2@gmail.com'
AND
    NOT EXISTS (
        SELECT 1
        FROM public.profile_roles pr
        WHERE pr.profile_id = p.id AND pr.role_id = 2
    );

-- ---------------------------------------------------------------------------
-- Create `tshirt_sizes` Table
-- ---------------------------------------------------------------------------
CREATE TABLE public.tshirt_sizes (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    event_id BIGINT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    size_name TEXT NOT NULL,
    sort_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, size_name)
);
ALTER TABLE public.tshirt_sizes ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_tshirt_sizes_event_id ON public.tshirt_sizes(event_id);
COMMENT ON TABLE public.tshirt_sizes IS 'Standardizes T-shirt sizes available for events.';

-- Seed standard T-shirt sizes for the default event (ID: 1)
INSERT INTO public.tshirt_sizes (event_id, size_name, sort_order)
VALUES
    (1, 'XS', 1),
    (1, 'S', 2),
    (1, 'M', 3),
    (1, 'L', 4),
    (1, 'XL', 5),
    (1, 'XXL', 6),
    (1, '3XL', 7)
ON CONFLICT (event_id, size_name) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Create `tshirt_inventory` Table
-- ---------------------------------------------------------------------------
CREATE TABLE public.tshirt_inventory (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    event_id BIGINT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    size TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    tshirt_size_id BIGINT REFERENCES public.tshirt_sizes(id) ON DELETE RESTRICT,
    quantity_initial INTEGER NOT NULL DEFAULT 0,
    quantity_on_hand INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.tshirt_inventory ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_tshirt_inventory_event_id ON public.tshirt_inventory(event_id);
CREATE INDEX idx_tshirt_inventory_size ON public.tshirt_inventory(size);
CREATE INDEX idx_tshirt_inventory_tshirt_size_id ON public.tshirt_inventory(tshirt_size_id);
COMMENT ON TABLE public.tshirt_inventory IS 'Tracks T-shirt inventory by size for events.';
COMMENT ON COLUMN public.tshirt_inventory.tshirt_size_id IS 'References the standardized T-shirt size.';
COMMENT ON COLUMN public.tshirt_inventory.quantity_initial IS 'Initial quantity of T-shirts.';
COMMENT ON COLUMN public.tshirt_inventory.quantity_on_hand IS 'Current quantity of T-shirts available.';

-- ---------------------------------------------------------------------------
-- Create `volunteer_qr_codes` Table
-- ---------------------------------------------------------------------------
CREATE TABLE public.volunteer_qr_codes (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    volunteer_id UUID NOT NULL REFERENCES public.volunteers(id) ON DELETE CASCADE,
    event_id BIGINT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    qr_code_data TEXT NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.volunteer_qr_codes ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_volunteer_qr_codes_volunteer_id ON public.volunteer_qr_codes(volunteer_id);
CREATE INDEX idx_volunteer_qr_codes_event_id ON public.volunteer_qr_codes(event_id);
COMMENT ON TABLE public.volunteer_qr_codes IS 'Stores QR codes generated for volunteers for T-shirt issuance.';

-- ---------------------------------------------------------------------------
-- Create `tshirt_issuances` Table
-- ---------------------------------------------------------------------------
CREATE TABLE public.tshirt_issuances (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    volunteer_id UUID NOT NULL REFERENCES public.volunteers(id) ON DELETE CASCADE,
    event_id BIGINT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    tshirt_inventory_id BIGINT NOT NULL REFERENCES public.tshirt_inventory(id) ON DELETE RESTRICT,
    issued_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    size TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.tshirt_issuances ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_tshirt_issuances_volunteer_id ON public.tshirt_issuances(volunteer_id);
CREATE INDEX idx_tshirt_issuances_event_id ON public.tshirt_issuances(event_id);
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
-- Create functions for QR code generation and validation
-- ---------------------------------------------------------------------------

-- Function to generate QR code data for a volunteer
CREATE OR REPLACE FUNCTION generate_volunteer_qr_code(p_volunteer_id UUID, p_event_id BIGINT)
RETURNS TEXT AS $$
DECLARE
    v_qr_code_data TEXT;
    v_volunteer_exists BOOLEAN;
BEGIN
    -- Check if volunteer exists
    SELECT EXISTS(SELECT 1 FROM public.volunteers WHERE id = p_volunteer_id) INTO v_volunteer_exists;

    IF NOT v_volunteer_exists THEN
        RAISE EXCEPTION 'Volunteer with ID % does not exist', p_volunteer_id;
    END IF;

    -- Generate QR code data (volunteer ID + timestamp + random string for uniqueness)
    v_qr_code_data := p_volunteer_id || '|' || extract(epoch from now()) || '|' || md5(random()::text);

    -- Insert into volunteer_qr_codes table
    INSERT INTO public.volunteer_qr_codes (volunteer_id, event_id, qr_code_data)
    VALUES (p_volunteer_id, p_event_id, v_qr_code_data);

    RETURN v_qr_code_data;
END;
$$ LANGUAGE plpgsql;

-- Function to validate QR code data
CREATE OR REPLACE FUNCTION validate_volunteer_qr_code(p_qr_code_data TEXT)
RETURNS TABLE (
    volunteer_id UUID,
    event_id BIGINT,
    is_valid BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_volunteer_id UUID;
    v_event_id BIGINT;
    v_is_used BOOLEAN;
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- Get QR code record
    SELECT
        qr.volunteer_id,
        qr.event_id,
        qr.is_used,
        qr.expires_at
    INTO
        v_volunteer_id,
        v_event_id,
        v_is_used,
        v_expires_at
    FROM
        public.volunteer_qr_codes qr
    WHERE
        qr.qr_code_data = p_qr_code_data;

    -- Check if QR code exists
    IF v_volunteer_id IS NULL THEN
        RETURN QUERY SELECT
            NULL::UUID,
            NULL::BIGINT,
            FALSE,
            'QR code not found';
        RETURN;
    END IF;

    -- Check if QR code is already used
    IF v_is_used THEN
        RETURN QUERY SELECT
            v_volunteer_id,
            v_event_id,
            FALSE,
            'QR code already used';
        RETURN;
    END IF;

    -- Check if QR code is expired
    IF v_expires_at IS NOT NULL AND v_expires_at < NOW() THEN
        RETURN QUERY SELECT
            v_volunteer_id,
            v_event_id,
            FALSE,
            'QR code expired';
        RETURN;
    END IF;

    -- QR code is valid
    RETURN QUERY SELECT
        v_volunteer_id,
        v_event_id,
        TRUE,
        'QR code valid';
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- Create T-shirt management tables
-- ---------------------------------------------------------------------------

-- Table for T-shirt sizes
CREATE TABLE IF NOT EXISTS public.tshirt_sizes (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    event_id BIGINT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    size_name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_event_size UNIQUE (event_id, size_name)
);

CREATE INDEX IF NOT EXISTS idx_tshirt_sizes_event_id ON public.tshirt_sizes(event_id);

-- Table for T-shirt inventory
CREATE TABLE IF NOT EXISTS public.tshirt_inventory (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    event_id BIGINT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    tshirt_size_id BIGINT NOT NULL REFERENCES public.tshirt_sizes(id) ON DELETE RESTRICT,
    size TEXT NOT NULL,
    quantity_initial INTEGER NOT NULL DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 0,
    quantity_on_hand INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_event_size_inventory UNIQUE (event_id, tshirt_size_id)
);

CREATE INDEX IF NOT EXISTS idx_tshirt_inventory_event_id ON public.tshirt_inventory(event_id);
CREATE INDEX IF NOT EXISTS idx_tshirt_inventory_tshirt_size_id ON public.tshirt_inventory(tshirt_size_id);

-- Table for T-shirt issuances
CREATE TABLE IF NOT EXISTS public.tshirt_issuances (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    volunteer_id UUID NOT NULL REFERENCES public.volunteers(id) ON DELETE CASCADE,
    event_id BIGINT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    tshirt_inventory_id BIGINT NOT NULL REFERENCES public.tshirt_inventory(id) ON DELETE RESTRICT,
    size TEXT NOT NULL,
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    issued_by_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_tshirt_issuances_volunteer_id ON public.tshirt_issuances(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_tshirt_issuances_event_id ON public.tshirt_issuances(event_id);
CREATE INDEX IF NOT EXISTS idx_tshirt_issuances_tshirt_inventory_id ON public.tshirt_issuances(tshirt_inventory_id);

-- Table for volunteer T-shirt preferences
CREATE TABLE IF NOT EXISTS public.volunteer_tshirt_preferences (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    volunteer_id UUID NOT NULL REFERENCES public.volunteers(id) ON DELETE CASCADE,
    event_id BIGINT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    tshirt_size_id BIGINT NOT NULL REFERENCES public.tshirt_sizes(id) ON DELETE RESTRICT,
    preference_order INTEGER NOT NULL DEFAULT 1,
    is_fulfilled BOOLEAN NOT NULL DEFAULT FALSE,
    fulfilled_by_issuance_id BIGINT REFERENCES public.tshirt_issuances(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_volunteer_size_preference UNIQUE (volunteer_id, event_id, tshirt_size_id)
);

CREATE INDEX IF NOT EXISTS idx_volunteer_tshirt_preferences_volunteer_id ON public.volunteer_tshirt_preferences(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_tshirt_preferences_event_id ON public.volunteer_tshirt_preferences(event_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_tshirt_preferences_tshirt_size_id ON public.volunteer_tshirt_preferences(tshirt_size_id);

-- Table for volunteer QR codes
CREATE TABLE IF NOT EXISTS public.volunteer_qr_codes (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    volunteer_id UUID NOT NULL REFERENCES public.volunteers(id) ON DELETE CASCADE,
    event_id BIGINT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_volunteer_event_qr UNIQUE (volunteer_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_volunteer_qr_codes_volunteer_id ON public.volunteer_qr_codes(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_qr_codes_event_id ON public.volunteer_qr_codes(event_id);

-- Add requested_tshirt_quantity column to volunteers table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'volunteers' AND column_name = 'requested_tshirt_quantity'
    ) THEN
        ALTER TABLE public.volunteers ADD COLUMN requested_tshirt_quantity INTEGER DEFAULT 1;
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Create T-shirt management functions
-- ---------------------------------------------------------------------------

-- Function to issue a T-shirt with inventory management
CREATE OR REPLACE FUNCTION public.issue_tshirt(
  p_volunteer_id UUID,
  p_event_id BIGINT,
  p_size TEXT,
  p_issued_by_profile_id UUID
) RETURNS VOID AS $$
DECLARE
  v_inventory_id BIGINT;
  v_quantity INTEGER;
BEGIN
  -- Check if volunteer already has a T-shirt for this event
  IF EXISTS (
    SELECT 1 FROM public.tshirt_issuances
    WHERE volunteer_id = p_volunteer_id AND event_id = p_event_id
  ) THEN
    RAISE EXCEPTION 'Volunteer already has a T-shirt for this event';
  END IF;

  -- Get inventory ID and check quantity
  SELECT id, quantity INTO v_inventory_id, v_quantity
  FROM public.tshirt_inventory
  WHERE event_id = p_event_id AND size = p_size;

  IF v_inventory_id IS NULL THEN
    RAISE EXCEPTION 'No inventory found for size %', p_size;
  END IF;

  IF v_quantity <= 0 THEN
    RAISE EXCEPTION 'No T-shirts available for size %', p_size;
  END IF;

  -- Begin transaction
  BEGIN
    -- Decrease inventory
    UPDATE public.tshirt_inventory
    SET quantity = quantity - 1,
        quantity_on_hand = quantity_on_hand - 1
    WHERE id = v_inventory_id;

    -- Record issuance
    INSERT INTO public.tshirt_issuances (
      volunteer_id,
      event_id,
      tshirt_inventory_id,
      issued_by_profile_id,
      size
    ) VALUES (
      p_volunteer_id,
      p_event_id,
      v_inventory_id,
      p_issued_by_profile_id,
      p_size
    );
  EXCEPTION
    WHEN OTHERS THEN
      RAISE;
  END;
END;
$$ LANGUAGE plpgsql;

-- Function to get detailed T-shirt issuance report
CREATE OR REPLACE FUNCTION public.get_tshirt_issuance_report(
  p_event_id BIGINT
) RETURNS TABLE (
  id BIGINT,
  volunteer_id UUID,
  volunteer_name TEXT,
  volunteer_email TEXT,
  size TEXT,
  issued_at TIMESTAMPTZ,
  issued_by TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ti.id,
    ti.volunteer_id,
    CONCAT(v.first_name, ' ', v.last_name) AS volunteer_name,
    v.email AS volunteer_email,
    ti.size,
    ti.issued_at,
    CONCAT(p.display_name, ' (', p.email, ')') AS issued_by
  FROM
    public.tshirt_issuances ti
    JOIN public.volunteers v ON ti.volunteer_id = v.id
    JOIN public.profiles p ON ti.issued_by_profile_id = p.id
  WHERE
    ti.event_id = p_event_id
  ORDER BY
    ti.issued_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get T-shirt preference summary
CREATE OR REPLACE FUNCTION public.get_tshirt_preference_summary()
RETURNS TABLE (
  size TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(tshirt_size_preference, 'No Preference') AS size,
    COUNT(*) AS count
  FROM
    public.volunteers
  GROUP BY
    COALESCE(tshirt_size_preference, 'No Preference')
  ORDER BY
    CASE
      WHEN COALESCE(tshirt_size_preference, 'No Preference') = 'No Preference' THEN 'ZZZZ'
      ELSE COALESCE(tshirt_size_preference, 'No Preference')
    END;
END;
$$ LANGUAGE plpgsql;

-- Function to get volunteer's remaining T-shirt allocation
CREATE OR REPLACE FUNCTION public.get_volunteer_tshirt_allocation(
  p_volunteer_id UUID,
  p_event_id BIGINT
) RETURNS INTEGER AS $$
DECLARE
  v_total_allocation INTEGER;
  v_used_allocation INTEGER;
BEGIN
  -- Get total allocation from volunteer record
  SELECT COALESCE(requested_tshirt_quantity, 1) INTO v_total_allocation
  FROM public.volunteers
  WHERE id = p_volunteer_id;

  IF v_total_allocation IS NULL THEN
    RETURN 0;
  END IF;

  -- Count issued T-shirts
  SELECT COUNT(*) INTO v_used_allocation
  FROM public.tshirt_issuances
  WHERE volunteer_id = p_volunteer_id AND event_id = p_event_id;

  -- Return remaining allocation
  RETURN GREATEST(0, v_total_allocation - v_used_allocation);
END;
$$ LANGUAGE plpgsql;

-- Function to set volunteer's T-shirt preferences
CREATE OR REPLACE FUNCTION public.set_volunteer_tshirt_preferences(
  p_volunteer_id UUID,
  p_event_id BIGINT,
  p_preferences JSONB
) RETURNS VOID AS $$
DECLARE
  v_allocation INTEGER;
  v_preference JSONB;
BEGIN
  -- Get volunteer's remaining allocation
  v_allocation := public.get_volunteer_tshirt_allocation(p_volunteer_id, p_event_id);

  -- Validate preferences count
  IF jsonb_array_length(p_preferences) > v_allocation THEN
    RAISE EXCEPTION 'Number of preferences (%) exceeds allocation (%)', jsonb_array_length(p_preferences), v_allocation;
  END IF;

  -- Begin transaction
  BEGIN
    -- Delete existing unfulfilled preferences
    DELETE FROM public.volunteer_tshirt_preferences
    WHERE volunteer_id = p_volunteer_id
      AND event_id = p_event_id
      AND is_fulfilled = FALSE;

    -- Insert new preferences
    FOR v_preference IN SELECT * FROM jsonb_array_elements(p_preferences)
    LOOP
      INSERT INTO public.volunteer_tshirt_preferences (
        volunteer_id,
        event_id,
        tshirt_size_id,
        preference_order,
        is_fulfilled
      ) VALUES (
        p_volunteer_id,
        p_event_id,
        (v_preference->>'size_id')::BIGINT,
        (v_preference->>'preference_order')::INTEGER,
        FALSE
      );
    END LOOP;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE;
  END;
END;
$$ LANGUAGE plpgsql;

-- Enhanced function to issue a T-shirt with allocation tracking
CREATE OR REPLACE FUNCTION public.issue_tshirt_v2(
  p_volunteer_id UUID,
  p_event_id BIGINT,
  p_size TEXT,
  p_issued_by_profile_id UUID
) RETURNS VOID AS $$
DECLARE
  v_inventory_id BIGINT;
  v_quantity INTEGER;
  v_allocation INTEGER;
  v_size_id BIGINT;
  v_issuance_id BIGINT;
BEGIN
  -- Check volunteer's remaining allocation
  v_allocation := public.get_volunteer_tshirt_allocation(p_volunteer_id, p_event_id);

  IF v_allocation <= 0 THEN
    RAISE EXCEPTION 'Volunteer has no remaining T-shirt allocation';
  END IF;

  -- Get size ID
  SELECT id INTO v_size_id
  FROM public.tshirt_sizes
  WHERE event_id = p_event_id AND size_name = p_size;

  IF v_size_id IS NULL THEN
    RAISE EXCEPTION 'Invalid size: %', p_size;
  END IF;

  -- Get inventory ID and check quantity
  SELECT id, quantity INTO v_inventory_id, v_quantity
  FROM public.tshirt_inventory
  WHERE event_id = p_event_id AND tshirt_size_id = v_size_id;

  IF v_inventory_id IS NULL THEN
    RAISE EXCEPTION 'No inventory found for size %', p_size;
  END IF;

  IF v_quantity <= 0 THEN
    RAISE EXCEPTION 'No T-shirts available for size %', p_size;
  END IF;

  -- Begin transaction
  BEGIN
    -- Decrease inventory
    UPDATE public.tshirt_inventory
    SET quantity = quantity - 1,
        quantity_on_hand = quantity_on_hand - 1
    WHERE id = v_inventory_id;

    -- Record issuance
    INSERT INTO public.tshirt_issuances (
      volunteer_id,
      event_id,
      tshirt_inventory_id,
      issued_by_profile_id,
      size
    ) VALUES (
      p_volunteer_id,
      p_event_id,
      v_inventory_id,
      p_issued_by_profile_id,
      p_size
    ) RETURNING id INTO v_issuance_id;

    -- Update any matching preference to mark as fulfilled
    UPDATE public.volunteer_tshirt_preferences
    SET is_fulfilled = TRUE,
        fulfilled_by_issuance_id = v_issuance_id
    WHERE volunteer_id = p_volunteer_id
      AND event_id = p_event_id
      AND tshirt_size_id = v_size_id
      AND is_fulfilled = FALSE;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE;
  END;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
SELECT 'SGSVolunteers Supabase Schema script finished.';
-- ---------------------------------------------------------------------------