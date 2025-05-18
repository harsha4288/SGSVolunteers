-- T-shirt Issuance Database Changes

-- 1. Add tshirt_size_preference to volunteers table
ALTER TABLE public.volunteers 
ADD COLUMN tshirt_size_preference TEXT;

COMMENT ON COLUMN public.volunteers.tshirt_size_preference IS 'Preferred T-shirt size for the volunteer (e.g., S, M, L, XL, XXL)';

-- 2. Create tshirt_sizes table if it doesn't exist already
-- This table standardizes the available T-shirt sizes
CREATE TABLE IF NOT EXISTS public.tshirt_sizes (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    event_id BIGINT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    size_name TEXT NOT NULL,
    sort_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, size_name)
);

ALTER TABLE public.tshirt_sizes ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_tshirt_sizes_event_id ON public.tshirt_sizes(event_id);
COMMENT ON TABLE public.tshirt_sizes IS 'Standard T-shirt sizes available for events';

-- 3. Update tshirt_inventory table to reference tshirt_sizes
-- First check if tshirt_inventory already has tshirt_size_id column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tshirt_inventory' 
        AND column_name = 'tshirt_size_id'
    ) THEN
        -- Add tshirt_size_id column
        ALTER TABLE public.tshirt_inventory 
        ADD COLUMN tshirt_size_id BIGINT REFERENCES public.tshirt_sizes(id) ON DELETE RESTRICT;
        
        -- Create index for the new column
        CREATE INDEX idx_tshirt_inventory_tshirt_size_id ON public.tshirt_inventory(tshirt_size_id);
        
        -- Add comment
        COMMENT ON COLUMN public.tshirt_inventory.tshirt_size_id IS 'References the standardized T-shirt size';
    END IF;
END $$;

-- 4. Create volunteer_qr_codes table to store generated QR codes
CREATE TABLE IF NOT EXISTS public.volunteer_qr_codes (
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
COMMENT ON TABLE public.volunteer_qr_codes IS 'Stores QR codes generated for volunteers for T-shirt issuance';

-- 5. Seed standard T-shirt sizes for the default event (ID: 1)
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

-- 6. Create a function to generate QR code data for a volunteer
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

-- 7. Create a function to validate QR code data
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
