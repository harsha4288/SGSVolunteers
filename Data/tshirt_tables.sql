-- T-shirt related tables

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

-- Add tshirt_size_preference column to volunteers table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'volunteers' AND column_name = 'tshirt_size_preference'
    ) THEN
        ALTER TABLE public.volunteers ADD COLUMN tshirt_size_preference TEXT;
    END IF;
END $$;
