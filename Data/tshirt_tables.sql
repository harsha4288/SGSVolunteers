-- T-shirt related tables
-- Note: This file uses size_cd as the primary identifier for T-shirt sizes
-- No numeric IDs are used for T-shirt sizes to avoid hardcoding
--
-- Schema Overview:
-- 1. tshirt_inventory - Stores available T-shirt sizes and quantities
--    Primary key: (event_id, size_cd)
--
-- 2. volunteer_tshirts - Unified table for both preferences and issuances
--    Uses 'status' field with values: 'preferred', 'issued', 'returned'
--    This replaces the old separate tables (volunteer_tshirt_preferences and tshirt_issuances)
--
-- Backward compatibility is provided through views in tshirt_functions.sql

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

-- Drop existing constraints to avoid conflicts
DO $$
BEGIN
    -- Drop constraints on volunteer_tshirts if they exist
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'volunteer_tshirts_size_event_fkey') THEN
        ALTER TABLE public.volunteer_tshirts DROP CONSTRAINT volunteer_tshirts_size_event_fkey;
    END IF;

    -- No need to drop tshirt_size_id constraint as we've moved to size_cd

    -- Drop constraints on volunteer_tshirt_preferences if they exist
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'volunteer_tshirt_preferences_tshirt_size_id_fkey') THEN
        ALTER TABLE public.volunteer_tshirt_preferences DROP CONSTRAINT volunteer_tshirt_preferences_tshirt_size_id_fkey;
    END IF;

    -- Drop constraints on tshirt_issuances if they exist
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tshirt_issuances_tshirt_inventory_id_fkey') THEN
        ALTER TABLE public.tshirt_issuances DROP CONSTRAINT tshirt_issuances_tshirt_inventory_id_fkey;
    END IF;
END $$;

-- Combined T-shirt inventory table (replaces both tshirt_sizes and tshirt_inventory)
DO $$
BEGIN
    -- Drop old views if they exist (they're now created in tshirt_functions.sql)
    DROP VIEW IF EXISTS public.tshirt_issuances;
    DROP VIEW IF EXISTS public.volunteer_tshirt_preferences;

    -- Drop old tables if they still exist (should have been migrated already)
    DROP TABLE IF EXISTS public.tshirt_issuances_old CASCADE;
    DROP TABLE IF EXISTS public.volunteer_tshirt_preferences_old CASCADE;

    -- Backup existing tshirt_inventory if it exists with size_name
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tshirt_inventory' AND column_name = 'size_name'
    ) THEN
        -- Create backup table if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tshirt_inventory_backup') THEN
            CREATE TABLE public.tshirt_inventory_backup AS
            SELECT * FROM public.tshirt_inventory;

            -- Drop the existing table to recreate with new schema
            DROP TABLE IF EXISTS public.tshirt_inventory CASCADE;
        END IF;
    END IF;

    -- Create the combined table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tshirt_inventory') THEN
        CREATE TABLE public.tshirt_inventory (
            event_id BIGINT NOT NULL,
            size_cd VARCHAR(5) NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 0,
            quantity_on_hand INTEGER NOT NULL DEFAULT 0,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            PRIMARY KEY (event_id, size_cd)
        );

        -- Add foreign key constraint
        ALTER TABLE public.tshirt_inventory
        ADD CONSTRAINT fk_tshirt_inventory_event_id
        FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

        -- Create index
        CREATE INDEX idx_tshirt_inventory_event_id ON public.tshirt_inventory(event_id);

        -- Add check constraint
        ALTER TABLE public.tshirt_inventory
        ADD CONSTRAINT check_tshirt_inventory_quantity
        CHECK (quantity >= 0);

        ALTER TABLE public.tshirt_inventory
        ADD CONSTRAINT check_tshirt_inventory_quantity_on_hand
        CHECK (quantity_on_hand >= 0);

        -- Migrate data from backup if it exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tshirt_inventory_backup') THEN
            INSERT INTO public.tshirt_inventory (event_id, size_cd, quantity, quantity_on_hand, sort_order, created_at, updated_at)
            SELECT event_id, size_name, quantity, quantity_on_hand, sort_order, created_at, updated_at
            FROM public.tshirt_inventory_backup
            ON CONFLICT (event_id, size_cd) DO NOTHING;
        END IF;
    ELSE
        -- If table exists but doesn't have the right structure, recreate it
        BEGIN
            -- Check if the table has the composite primary key
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints
                WHERE table_name = 'tshirt_inventory'
                AND constraint_type = 'PRIMARY KEY'
                AND constraint_name = 'tshirt_inventory_pkey'
            ) THEN
                -- Rename the old table
                ALTER TABLE public.tshirt_inventory RENAME TO tshirt_inventory_old;

                -- Create the new table
                CREATE TABLE public.tshirt_inventory (
                    event_id BIGINT NOT NULL,
                    size_cd VARCHAR(5) NOT NULL,
                    quantity INTEGER NOT NULL DEFAULT 0,
                    quantity_on_hand INTEGER NOT NULL DEFAULT 0,
                    sort_order INTEGER NOT NULL DEFAULT 0,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW(),
                    PRIMARY KEY (event_id, size_cd)
                );

                -- Add foreign key constraint
                ALTER TABLE public.tshirt_inventory
                ADD CONSTRAINT fk_tshirt_inventory_event_id
                FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

                -- Create index
                CREATE INDEX idx_tshirt_inventory_event_id ON public.tshirt_inventory(event_id);

                -- Add check constraint
                ALTER TABLE public.tshirt_inventory
                ADD CONSTRAINT check_tshirt_inventory_quantity
                CHECK (quantity >= 0);

                ALTER TABLE public.tshirt_inventory
                ADD CONSTRAINT check_tshirt_inventory_quantity_on_hand
                CHECK (quantity_on_hand >= 0);
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                -- If there's an error, just create the table from scratch
                DROP TABLE IF EXISTS public.tshirt_inventory CASCADE;

                CREATE TABLE public.tshirt_inventory (
                    event_id BIGINT NOT NULL,
                    size_cd VARCHAR(5) NOT NULL,
                    quantity INTEGER NOT NULL DEFAULT 0,
                    quantity_on_hand INTEGER NOT NULL DEFAULT 0,
                    sort_order INTEGER NOT NULL DEFAULT 0,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW(),
                    PRIMARY KEY (event_id, size_cd)
                );

                -- Add foreign key constraint
                ALTER TABLE public.tshirt_inventory
                ADD CONSTRAINT fk_tshirt_inventory_event_id
                FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

                -- Create index
                CREATE INDEX idx_tshirt_inventory_event_id ON public.tshirt_inventory(event_id);

                -- Add check constraint
                ALTER TABLE public.tshirt_inventory
                ADD CONSTRAINT check_tshirt_inventory_quantity
                CHECK (quantity >= 0);

                ALTER TABLE public.tshirt_inventory
                ADD CONSTRAINT check_tshirt_inventory_quantity_on_hand
                CHECK (quantity_on_hand >= 0);

                -- Migrate data from backup if it exists
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tshirt_inventory_backup') THEN
                    INSERT INTO public.tshirt_inventory (event_id, size_cd, quantity, quantity_on_hand, sort_order, created_at, updated_at)
                    SELECT event_id, size_name, quantity, quantity_on_hand, sort_order, created_at, updated_at
                    FROM public.tshirt_inventory_backup
                    ON CONFLICT (event_id, size_cd) DO NOTHING;
                END IF;
        END;
    END IF;
END $$;

-- Unified volunteer_tshirts table (replaces both volunteer_tshirt_preferences and tshirt_issuances)
DO $$
BEGIN
    -- Create the table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'volunteer_tshirts') THEN
        CREATE TABLE public.volunteer_tshirts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            volunteer_id UUID NOT NULL,
            event_id BIGINT NOT NULL,
            size VARCHAR(5) NOT NULL,
            status TEXT NOT NULL CHECK (status IN ('preferred', 'issued')),
            quantity INTEGER NOT NULL DEFAULT 1,
            issued_by_profile_id UUID,
            issued_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Add foreign key constraints
        ALTER TABLE public.volunteer_tshirts
        ADD CONSTRAINT fk_volunteer_tshirts_volunteer_id
        FOREIGN KEY (volunteer_id) REFERENCES public.volunteers(id) ON DELETE CASCADE;

        ALTER TABLE public.volunteer_tshirts
        ADD CONSTRAINT fk_volunteer_tshirts_event_id
        FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

        ALTER TABLE public.volunteer_tshirts
        ADD CONSTRAINT fk_volunteer_tshirts_issued_by_profile_id
        FOREIGN KEY (issued_by_profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

        ALTER TABLE public.volunteer_tshirts
        ADD CONSTRAINT fk_volunteer_tshirts_size_event
        FOREIGN KEY (event_id, size) REFERENCES public.tshirt_inventory(event_id, size_cd);

        -- Create indexes
        CREATE INDEX idx_volunteer_tshirts_volunteer_id ON public.volunteer_tshirts(volunteer_id);
        CREATE INDEX idx_volunteer_tshirts_event_id ON public.volunteer_tshirts(event_id);
        CREATE INDEX idx_volunteer_tshirts_status ON public.volunteer_tshirts(status);
    ELSE
        -- If the table exists, drop the tshirt_size_id column if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'volunteer_tshirts' AND column_name = 'tshirt_size_id'
        ) THEN
            ALTER TABLE public.volunteer_tshirts DROP COLUMN tshirt_size_id;
        END IF;

        -- Update the foreign key constraint to use size_cd
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'fk_volunteer_tshirts_size_event'
        ) THEN
            ALTER TABLE public.volunteer_tshirts DROP CONSTRAINT fk_volunteer_tshirts_size_event;

            ALTER TABLE public.volunteer_tshirts
            ADD CONSTRAINT fk_volunteer_tshirts_size_event
            FOREIGN KEY (event_id, size) REFERENCES public.tshirt_inventory(event_id, size_cd);
        END IF;
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
        ALTER TABLE public.volunteers ADD COLUMN tshirt_size_preference VARCHAR(5);
    ELSE
        -- If the column exists but is not VARCHAR(5), alter it
        ALTER TABLE public.volunteers ALTER COLUMN tshirt_size_preference TYPE VARCHAR(5);
    END IF;
END $$;

-- Note: The old tables (tshirt_issuances and volunteer_tshirt_preferences) have been dropped,
-- so we don't need to add columns to them anymore.
