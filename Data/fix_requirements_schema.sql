-- SQL File: fix_requirements_schema.sql
-- Description: Corrects database schema for Requirements and Reports modules.
-- 1. Removes location_id from seva_categories.
-- 2. Verifies/creates requirements table with correct structure.
-- 3. Drops old reporting views.
-- 4. Creates new, corrected reporting views.

BEGIN;

-- 0. Create locations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.locations (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed some default locations
INSERT INTO public.locations (name, description) VALUES
    ('Temple', 'Main temple area'),
    ('Event Center', 'Event center building'),
    ('Kitchen', 'Food preparation area'),
    ('Registration', 'Registration and check-in area'),
    ('Parking', 'Parking management area')
ON CONFLICT (name) DO NOTHING;

-- Create alerts table for admin alerts/FAQs module
CREATE TABLE IF NOT EXISTS public.alerts (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title TEXT NOT NULL,
    content TEXT,
    category TEXT,
    timeslot_id_filter BIGINT REFERENCES public.time_slots(id) ON DELETE SET NULL,
    start_date DATE,
    end_date DATE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create FAQs table for admin alerts/FAQs module
CREATE TABLE IF NOT EXISTS public.faqs (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT,
    timeslot_id_filter BIGINT REFERENCES public.time_slots(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add triggers for updated_at columns
DROP TRIGGER IF EXISTS trg_locations_update_updated_at ON public.locations;
CREATE TRIGGER trg_locations_update_updated_at
BEFORE UPDATE ON public.locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_alerts_update_updated_at ON public.alerts;
CREATE TRIGGER trg_alerts_update_updated_at
BEFORE UPDATE ON public.alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_faqs_update_updated_at ON public.faqs;
CREATE TRIGGER trg_faqs_update_updated_at
BEFORE UPDATE ON public.faqs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 1. Remove problematic location_id from seva_categories
ALTER TABLE public.seva_categories DROP COLUMN IF EXISTS location_id;

-- 2. Ensure requirements table structure is correct
CREATE TABLE IF NOT EXISTS public.requirements (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    seva_category_id BIGINT NOT NULL REFERENCES public.seva_categories(id) ON DELETE CASCADE,
    location_id BIGINT NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE, -- Assumes locations table exists
    timeslot_id BIGINT NOT NULL REFERENCES public.time_slots(id) ON DELETE CASCADE, -- Assumes time_slots table exists
    required_count INTEGER NOT NULL DEFAULT 0 CHECK (required_count >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure the unique constraint exists (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.requirements'::regclass AND conname = 'requirements_seva_category_id_location_id_timeslot_id_key'
    ) THEN
        ALTER TABLE public.requirements
        ADD CONSTRAINT requirements_seva_category_id_location_id_timeslot_id_key
        UNIQUE(seva_category_id, location_id, timeslot_id);
    END IF;
END $$;

-- Ensure the update_updated_at_column function and trigger for requirements exist
-- (as they might have been removed if previous files were deleted)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $func$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_requirements_update_updated_at ON public.requirements;
CREATE TRIGGER trg_requirements_update_updated_at
BEFORE UPDATE ON public.requirements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();


-- 3. Drop and recreate views with corrected schema
DROP VIEW IF EXISTS public.vw_seva_timeslot_variance_summary;
DROP VIEW IF EXISTS public.vw_requirement_details;
DROP VIEW IF EXISTS public.vw_assignments_vs_attendance;
DROP VIEW IF EXISTS public.vw_requirements_vs_assignments; -- Dropping to recreate with corrected logic
DROP VIEW IF EXISTS public.vw_requirements_by_location; -- Dropping to recreate

-- 4. Create corrected views

-- View 1: Variance Summary (Requirements vs Assignments)
CREATE OR REPLACE VIEW public.vw_requirements_vs_assignments AS
SELECT
  r.seva_category_id,
  sc.category_name,
  r.timeslot_id,
  ts.slot_name,
  SUM(r.required_count) as total_required,
  COALESCE(asgn.assigned_volunteers_count, 0) as assigned_volunteers,
  (COALESCE(asgn.assigned_volunteers_count, 0) - SUM(r.required_count)) as variance
FROM public.requirements r
JOIN public.seva_categories sc ON r.seva_category_id = sc.id
JOIN public.time_slots ts ON r.timeslot_id = ts.id
LEFT JOIN (
    SELECT
        vc.seva_category_id,
        vc.timeslot_id,
        COUNT(DISTINCT vc.volunteer_id) as assigned_volunteers_count
    FROM public.volunteer_commitments vc
    WHERE vc.commitment_type = 'ASSIGNED_TASK'
    GROUP BY vc.seva_category_id, vc.timeslot_id
) asgn ON r.seva_category_id = asgn.seva_category_id AND r.timeslot_id = asgn.timeslot_id
GROUP BY r.seva_category_id, sc.category_name, r.timeslot_id, ts.slot_name, asgn.assigned_volunteers_count;

COMMENT ON VIEW public.vw_requirements_vs_assignments IS
'Summarizes total required volunteers for a Seva Category/Timeslot across all locations,
and compares against volunteers assigned (commitment_type = ASSIGNED_TASK) to that Seva Category/Timeslot.';

-- View 2: Location Details (Requirements breakdown by location)
CREATE OR REPLACE VIEW public.vw_requirements_by_location AS
SELECT
  r.seva_category_id,
  sc.category_name,
  r.location_id,
  l.name as location_name,
  r.timeslot_id,
  ts.slot_name,
  r.required_count
FROM public.requirements r
JOIN public.seva_categories sc ON r.seva_category_id = sc.id
JOIN public.locations l ON r.location_id = l.id
JOIN public.time_slots ts ON r.timeslot_id = ts.id;

COMMENT ON VIEW public.vw_requirements_by_location IS
'Provides a detailed breakdown of volunteer requirements for each specific Seva Category, Location, and Timeslot.';

-- View 3: Attendance Analysis (re-instating previous Iteration 3 definition)
CREATE OR REPLACE VIEW public.vw_assignments_vs_attendance AS
WITH TaskAssignments AS (
    SELECT
        vc.volunteer_id,
        v.first_name || ' ' || v.last_name AS volunteer_name,
        vc.time_slot_id,
        ts.slot_name AS timeslot_slot_name,
        ts.description AS timeslot_description,
        ts.start_time AS timeslot_start_time,
        ts.end_time AS timeslot_end_time,
        vc.seva_category_id,
        sc.category_name AS task_name
    FROM
        public.volunteer_commitments vc
    JOIN
        public.volunteers v ON vc.volunteer_id = v.id
    JOIN
        public.time_slots ts ON vc.time_slot_id = ts.id
    JOIN
        public.seva_categories sc ON vc.seva_category_id = sc.id
    WHERE
        vc.commitment_type = 'ASSIGNED_TASK'
),
VolunteerAttendance AS (
    SELECT
        vci.volunteer_id,
        e.id AS event_id,
        MIN(vci.check_in_time) AS first_check_in,
        MAX(vci.check_out_time) AS last_check_out
    FROM
        public.volunteer_check_ins vci
    JOIN public.events e ON vci.event_id = e.id
    GROUP BY
        vci.volunteer_id, e.id
)
SELECT
    ta.seva_category_id AS task_id,
    ta.task_name,
    ta.timeslot_slot_name,
    ta.timeslot_description,
    COUNT(DISTINCT ta.volunteer_id) AS assigned_volunteers_count,
    COUNT(DISTINCT CASE
                            WHEN va.volunteer_id IS NOT NULL AND
                                 ts_event.id = va.event_id AND
                                 (va.first_check_in <= ta.timeslot_end_time AND COALESCE(va.last_check_out, va.first_check_in + INTERVAL '24 hour') >= ta.timeslot_start_time)
                            THEN ta.volunteer_id
                            ELSE NULL
                          END) AS actual_attendance_count
FROM
    TaskAssignments ta
JOIN
    public.time_slots ts_event ON ta.time_slot_id = ts_event.id
LEFT JOIN
    VolunteerAttendance va ON ta.volunteer_id = va.volunteer_id AND ts_event.event_id = va.event_id
GROUP BY
    ta.seva_category_id,
    ta.task_name,
    ta.timeslot_slot_name,
    ta.timeslot_description;

COMMENT ON VIEW public.vw_assignments_vs_attendance IS
'Compares volunteers assigned to a Seva Category/Timeslot against actual attendance. Attendance is counted if a volunteer checked-in during any part of the assigned timeslot for the corresponding event.';

COMMIT;
