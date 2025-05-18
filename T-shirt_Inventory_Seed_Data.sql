-- T-shirt Inventory Seed Data

-- First, make sure we have the tshirt_sizes data
-- This should be idempotent due to the ON CONFLICT clause
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

-- Add necessary columns to the tshirt_inventory table if they don't exist
DO $$
BEGIN
    -- Check if quantity_initial column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tshirt_inventory'
        AND column_name = 'quantity_initial'
    ) THEN
        ALTER TABLE public.tshirt_inventory
        ADD COLUMN quantity_initial INTEGER NOT NULL DEFAULT 0;

        -- Set quantity_initial to the same as quantity for existing records
        UPDATE public.tshirt_inventory SET quantity_initial = quantity;
    END IF;

    -- Check if quantity_on_hand column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tshirt_inventory'
        AND column_name = 'quantity_on_hand'
    ) THEN
        ALTER TABLE public.tshirt_inventory
        ADD COLUMN quantity_on_hand INTEGER NOT NULL DEFAULT 0;

        -- Set quantity_on_hand to the same as quantity for existing records
        UPDATE public.tshirt_inventory SET quantity_on_hand = quantity;
    END IF;
END $$;

-- Now, let's add some dummy inventory data
-- First, let's get the IDs of the tshirt_sizes we just inserted
DO $$
DECLARE
    v_xs_id BIGINT;
    v_s_id BIGINT;
    v_m_id BIGINT;
    v_l_id BIGINT;
    v_xl_id BIGINT;
    v_xxl_id BIGINT;
    v_3xl_id BIGINT;
BEGIN
    -- Get the IDs of each size
    SELECT id INTO v_xs_id FROM public.tshirt_sizes WHERE event_id = 1 AND size_name = 'XS';
    SELECT id INTO v_s_id FROM public.tshirt_sizes WHERE event_id = 1 AND size_name = 'S';
    SELECT id INTO v_m_id FROM public.tshirt_sizes WHERE event_id = 1 AND size_name = 'M';
    SELECT id INTO v_l_id FROM public.tshirt_sizes WHERE event_id = 1 AND size_name = 'L';
    SELECT id INTO v_xl_id FROM public.tshirt_sizes WHERE event_id = 1 AND size_name = 'XL';
    SELECT id INTO v_xxl_id FROM public.tshirt_sizes WHERE event_id = 1 AND size_name = 'XXL';
    SELECT id INTO v_3xl_id FROM public.tshirt_sizes WHERE event_id = 1 AND size_name = '3XL';

    -- Check if we already have inventory data for these sizes
    -- If not, insert new inventory data
    IF NOT EXISTS (SELECT 1 FROM public.tshirt_inventory WHERE tshirt_size_id = v_xs_id AND event_id = 1) THEN
        INSERT INTO public.tshirt_inventory (event_id, size, quantity, tshirt_size_id, quantity_initial, quantity_on_hand)
        VALUES (1, 'XS', 50, v_xs_id, 50, 50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.tshirt_inventory WHERE tshirt_size_id = v_s_id AND event_id = 1) THEN
        INSERT INTO public.tshirt_inventory (event_id, size, quantity, tshirt_size_id, quantity_initial, quantity_on_hand)
        VALUES (1, 'S', 100, v_s_id, 100, 100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.tshirt_inventory WHERE tshirt_size_id = v_m_id AND event_id = 1) THEN
        INSERT INTO public.tshirt_inventory (event_id, size, quantity, tshirt_size_id, quantity_initial, quantity_on_hand)
        VALUES (1, 'M', 150, v_m_id, 150, 150);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.tshirt_inventory WHERE tshirt_size_id = v_l_id AND event_id = 1) THEN
        INSERT INTO public.tshirt_inventory (event_id, size, quantity, tshirt_size_id, quantity_initial, quantity_on_hand)
        VALUES (1, 'L', 150, v_l_id, 150, 150);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.tshirt_inventory WHERE tshirt_size_id = v_xl_id AND event_id = 1) THEN
        INSERT INTO public.tshirt_inventory (event_id, size, quantity, tshirt_size_id, quantity_initial, quantity_on_hand)
        VALUES (1, 'XL', 100, v_xl_id, 100, 100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.tshirt_inventory WHERE tshirt_size_id = v_xxl_id AND event_id = 1) THEN
        INSERT INTO public.tshirt_inventory (event_id, size, quantity, tshirt_size_id, quantity_initial, quantity_on_hand)
        VALUES (1, 'XXL', 50, v_xxl_id, 50, 50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.tshirt_inventory WHERE tshirt_size_id = v_3xl_id AND event_id = 1) THEN
        INSERT INTO public.tshirt_inventory (event_id, size, quantity, tshirt_size_id, quantity_initial, quantity_on_hand)
        VALUES (1, '3XL', 25, v_3xl_id, 25, 25);
    END IF;

    -- If the inventory already exists but doesn't have the tshirt_size_id set, update it
    UPDATE public.tshirt_inventory
    SET tshirt_size_id = v_xs_id
    WHERE event_id = 1 AND size = 'XS' AND (tshirt_size_id IS NULL OR tshirt_size_id != v_xs_id);

    UPDATE public.tshirt_inventory
    SET tshirt_size_id = v_s_id
    WHERE event_id = 1 AND size = 'S' AND (tshirt_size_id IS NULL OR tshirt_size_id != v_s_id);

    UPDATE public.tshirt_inventory
    SET tshirt_size_id = v_m_id
    WHERE event_id = 1 AND size = 'M' AND (tshirt_size_id IS NULL OR tshirt_size_id != v_m_id);

    UPDATE public.tshirt_inventory
    SET tshirt_size_id = v_l_id
    WHERE event_id = 1 AND size = 'L' AND (tshirt_size_id IS NULL OR tshirt_size_id != v_l_id);

    UPDATE public.tshirt_inventory
    SET tshirt_size_id = v_xl_id
    WHERE event_id = 1 AND size = 'XL' AND (tshirt_size_id IS NULL OR tshirt_size_id != v_xl_id);

    UPDATE public.tshirt_inventory
    SET tshirt_size_id = v_xxl_id
    WHERE event_id = 1 AND size = 'XXL' AND (tshirt_size_id IS NULL OR tshirt_size_id != v_xxl_id);

    UPDATE public.tshirt_inventory
    SET tshirt_size_id = v_3xl_id
    WHERE event_id = 1 AND size = '3XL' AND (tshirt_size_id IS NULL OR tshirt_size_id != v_3xl_id);

END $$;

-- Update volunteers with random T-shirt size preferences for testing
-- This is optional and should only be run in development/testing environments
DO $$
DECLARE
    v_volunteer_id UUID;
    v_sizes TEXT[] := ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
    v_random_size TEXT;
BEGIN
    -- Only update volunteers that don't already have a preference
    FOR v_volunteer_id IN
        SELECT id FROM public.volunteers
        WHERE tshirt_size_preference IS NULL
        LIMIT 100 -- Limit to 100 volunteers for safety
    LOOP
        -- Select a random size
        v_random_size := v_sizes[1 + floor(random() * array_length(v_sizes, 1))::integer];

        -- Update the volunteer
        UPDATE public.volunteers
        SET tshirt_size_preference = v_random_size
        WHERE id = v_volunteer_id;
    END LOOP;
END $$;
