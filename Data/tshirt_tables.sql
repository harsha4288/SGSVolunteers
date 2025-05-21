-- T-shirt related tables

-- Create events table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.events (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    event_name TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert a default event if none exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.events LIMIT 1) THEN
        INSERT INTO public.events (event_name, start_date, end_date)
        VALUES ('Default Event', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days');
    END IF;
END $$;

-- Table for T-shirt sizes
DO $$
BEGIN
    -- Create the table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tshirt_sizes') THEN
        CREATE TABLE public.tshirt_sizes (
            id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
            event_id BIGINT NOT NULL,
            size_name TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Add foreign key constraint
        ALTER TABLE public.tshirt_sizes
        ADD CONSTRAINT fk_tshirt_sizes_event_id
        FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

        -- Add unique constraint
        ALTER TABLE public.tshirt_sizes
        ADD CONSTRAINT unique_event_size UNIQUE (event_id, size_name);

        -- Create index
        CREATE INDEX idx_tshirt_sizes_event_id ON public.tshirt_sizes(event_id);
    END IF;
END $$;

-- Table for T-shirt inventory
DO $$
BEGIN
    -- Create the table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tshirt_inventory') THEN
        CREATE TABLE public.tshirt_inventory (
            id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
            event_id BIGINT NOT NULL,
            tshirt_size_id BIGINT NOT NULL,
            size TEXT NOT NULL,
            quantity_initial INTEGER NOT NULL DEFAULT 0,
            quantity INTEGER NOT NULL DEFAULT 0,
            quantity_on_hand INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Add foreign key constraints
        ALTER TABLE public.tshirt_inventory
        ADD CONSTRAINT fk_tshirt_inventory_event_id
        FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

        ALTER TABLE public.tshirt_inventory
        ADD CONSTRAINT fk_tshirt_inventory_tshirt_size_id
        FOREIGN KEY (tshirt_size_id) REFERENCES public.tshirt_sizes(id) ON DELETE RESTRICT;

        -- Add unique constraint
        ALTER TABLE public.tshirt_inventory
        ADD CONSTRAINT unique_event_size_inventory UNIQUE (event_id, tshirt_size_id);

        -- Create indexes
        CREATE INDEX idx_tshirt_inventory_event_id ON public.tshirt_inventory(event_id);
        CREATE INDEX idx_tshirt_inventory_tshirt_size_id ON public.tshirt_inventory(tshirt_size_id);
    END IF;
END $$;

-- Table for T-shirt issuances
DO $$
BEGIN
    -- Create the table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tshirt_issuances') THEN
        CREATE TABLE public.tshirt_issuances (
            id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
            volunteer_id UUID NOT NULL,
            event_id BIGINT NOT NULL,
            tshirt_inventory_id BIGINT NOT NULL,
            size TEXT NOT NULL,
            issued_at TIMESTAMPTZ DEFAULT NOW(),
            issued_by_profile_id UUID NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1
        );

        -- Add foreign key constraints
        ALTER TABLE public.tshirt_issuances
        ADD CONSTRAINT fk_tshirt_issuances_volunteer_id
        FOREIGN KEY (volunteer_id) REFERENCES public.volunteers(id) ON DELETE CASCADE;

        ALTER TABLE public.tshirt_issuances
        ADD CONSTRAINT fk_tshirt_issuances_event_id
        FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

        ALTER TABLE public.tshirt_issuances
        ADD CONSTRAINT fk_tshirt_issuances_tshirt_inventory_id
        FOREIGN KEY (tshirt_inventory_id) REFERENCES public.tshirt_inventory(id) ON DELETE RESTRICT;

        ALTER TABLE public.tshirt_issuances
        ADD CONSTRAINT fk_tshirt_issuances_issued_by_profile_id
        FOREIGN KEY (issued_by_profile_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;

        -- Create indexes
        CREATE INDEX idx_tshirt_issuances_volunteer_id ON public.tshirt_issuances(volunteer_id);
        CREATE INDEX idx_tshirt_issuances_event_id ON public.tshirt_issuances(event_id);
        CREATE INDEX idx_tshirt_issuances_tshirt_inventory_id ON public.tshirt_issuances(tshirt_inventory_id);
    END IF;
END $$;

-- Table for volunteer T-shirt preferences
DO $$
BEGIN
    -- Create the table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'volunteer_tshirt_preferences') THEN
        CREATE TABLE public.volunteer_tshirt_preferences (
            id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
            volunteer_id UUID NOT NULL,
            event_id BIGINT NOT NULL,
            tshirt_size_id BIGINT NOT NULL,
            preference_order INTEGER NOT NULL DEFAULT 1,
            is_fulfilled BOOLEAN NOT NULL DEFAULT FALSE,
            fulfilled_by_issuance_id BIGINT,
            quantity INTEGER NOT NULL DEFAULT 1,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Add foreign key constraints
        ALTER TABLE public.volunteer_tshirt_preferences
        ADD CONSTRAINT fk_volunteer_tshirt_preferences_volunteer_id
        FOREIGN KEY (volunteer_id) REFERENCES public.volunteers(id) ON DELETE CASCADE;

        ALTER TABLE public.volunteer_tshirt_preferences
        ADD CONSTRAINT fk_volunteer_tshirt_preferences_event_id
        FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

        ALTER TABLE public.volunteer_tshirt_preferences
        ADD CONSTRAINT fk_volunteer_tshirt_preferences_tshirt_size_id
        FOREIGN KEY (tshirt_size_id) REFERENCES public.tshirt_sizes(id) ON DELETE RESTRICT;

        ALTER TABLE public.volunteer_tshirt_preferences
        ADD CONSTRAINT fk_volunteer_tshirt_preferences_fulfilled_by_issuance_id
        FOREIGN KEY (fulfilled_by_issuance_id) REFERENCES public.tshirt_issuances(id) ON DELETE SET NULL;

        -- Add unique constraint
        ALTER TABLE public.volunteer_tshirt_preferences
        ADD CONSTRAINT unique_volunteer_size_preference UNIQUE (volunteer_id, event_id, tshirt_size_id);

        -- Create indexes
        CREATE INDEX idx_volunteer_tshirt_preferences_volunteer_id ON public.volunteer_tshirt_preferences(volunteer_id);
        CREATE INDEX idx_volunteer_tshirt_preferences_event_id ON public.volunteer_tshirt_preferences(event_id);
        CREATE INDEX idx_volunteer_tshirt_preferences_tshirt_size_id ON public.volunteer_tshirt_preferences(tshirt_size_id);
    END IF;
END $$;

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

-- Add quantity field to tshirt_issuances table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'tshirt_issuances' AND column_name = 'quantity'
    ) THEN
        ALTER TABLE public.tshirt_issuances ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1;
        COMMENT ON COLUMN public.tshirt_issuances.quantity IS 'Number of T-shirts issued in this transaction';
    END IF;
END $$;

-- Add quantity field to volunteer_tshirt_preferences table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'volunteer_tshirt_preferences' AND column_name = 'quantity'
    ) THEN
        ALTER TABLE public.volunteer_tshirt_preferences ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1;
        COMMENT ON COLUMN public.volunteer_tshirt_preferences.quantity IS 'Number of T-shirts of this size preferred by the volunteer';
    END IF;
END $$;
