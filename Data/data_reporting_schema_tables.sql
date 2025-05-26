-- SQL File: data_reporting_schema_tables.sql
-- Description: Defines tables for reporting, requirements, alerts, FAQs,
--              and includes necessary alterations to existing tables.

-- Trigger function to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION public.update_updated_at_column() IS 'Automatically updates the updated_at timestamp on row modification.';

-- Create locations table
CREATE TABLE IF NOT EXISTS public.locations (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    address TEXT,
    event_id BIGINT REFERENCES public.events(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_locations_name ON public.locations(name);
CREATE INDEX IF NOT EXISTS idx_locations_event_id ON public.locations(event_id);
COMMENT ON TABLE public.locations IS 'Stores defined locations for tasks, requirements, etc.';

CREATE TRIGGER trg_locations_update_updated_at
BEFORE UPDATE ON public.locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add a default "Unassigned" location
INSERT INTO public.locations (name, description) 
VALUES ('Unassigned', 'Default location for items not tied to a specific physical spot')
ON CONFLICT (name) DO NOTHING;

-- Alter seva_categories to add a default location_id
-- This assumes seva_categories table already exists.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'seva_categories' AND column_name = 'location_id'
    ) THEN
        ALTER TABLE public.seva_categories
        ADD COLUMN location_id BIGINT REFERENCES public.locations(id) ON DELETE SET NULL;
    END IF;
END $$;

COMMENT ON COLUMN public.seva_categories.location_id IS 'Default/primary location associated with this Seva Category (Task).';
CREATE INDEX IF NOT EXISTS idx_seva_categories_location_id ON public.seva_categories(location_id);

-- Create requirements table
CREATE TABLE IF NOT EXISTS public.requirements (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    seva_category_id BIGINT NOT NULL REFERENCES public.seva_categories(id) ON DELETE CASCADE,
    location_id BIGINT NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    timeslot_id BIGINT NOT NULL REFERENCES public.time_slots(id) ON DELETE CASCADE,
    required_count INTEGER NOT NULL DEFAULT 0 CHECK (required_count >= 0),
    notes TEXT, 
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.requirements ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_requirements_seva_category_id ON public.requirements(seva_category_id);
CREATE INDEX IF NOT EXISTS idx_requirements_location_id ON public.requirements(location_id);
CREATE INDEX IF NOT EXISTS idx_requirements_timeslot_id ON public.requirements(timeslot_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_requirements_seva_location_timeslot_unique 
ON public.requirements(seva_category_id, location_id, timeslot_id);
COMMENT ON TABLE public.requirements IS 'Tracks volunteers required for specific Seva Categories (Tasks), locations, and timeslots.';

CREATE TRIGGER trg_requirements_update_updated_at
BEFORE UPDATE ON public.requirements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create alerts table
CREATE TABLE IF NOT EXISTS public.alerts (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    category VARCHAR(100),
    title VARCHAR(255) NOT NULL,
    content TEXT,
    timeslot_id_filter BIGINT REFERENCES public.time_slots(id) ON DELETE SET NULL,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_alerts_category ON public.alerts(category);
CREATE INDEX IF NOT EXISTS idx_alerts_timeslot_id_filter ON public.alerts(timeslot_id_filter);
CREATE INDEX IF NOT EXISTS idx_alerts_active_dates ON public.alerts(active, start_date, end_date);
COMMENT ON TABLE public.alerts IS 'Stores system-wide alerts for volunteers.';

CREATE TRIGGER trg_alerts_update_updated_at
BEFORE UPDATE ON public.alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create faqs table
CREATE TABLE IF NOT EXISTS public.faqs (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    category VARCHAR(100),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    timeslot_id_filter BIGINT REFERENCES public.time_slots(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_faqs_category ON public.faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_timeslot_id_filter ON public.faqs(timeslot_id_filter);
CREATE INDEX IF NOT EXISTS idx_faqs_active_sort_order ON public.faqs(active, sort_order);
COMMENT ON TABLE public.faqs IS 'Stores frequently asked questions and their answers.';

CREATE TRIGGER trg_faqs_update_updated_at
BEFORE UPDATE ON public.faqs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
