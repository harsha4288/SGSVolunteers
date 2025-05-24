-- T-shirt seed data for testing
-- Note: This file uses the new schema with size_cd as the primary identifier for T-shirt sizes

-- Insert T-shirt inventory if it doesn't exist
DO $$
DECLARE
  v_event_id BIGINT;
  v_count INTEGER;
BEGIN
  -- Get the first event ID
  SELECT id INTO v_event_id FROM public.events LIMIT 1;

  -- Check if we already have inventory data
  SELECT COUNT(*) INTO v_count FROM public.tshirt_inventory WHERE event_id = v_event_id;

  -- Only insert seed data if we don't have any inventory yet
  IF v_event_id IS NOT NULL AND v_count = 0 THEN
    -- Insert T-shirt inventory with sizes
    INSERT INTO public.tshirt_inventory (event_id, size_cd, quantity, quantity_on_hand, sort_order)
    VALUES
      (v_event_id, 'XS', 50, 50, 1),
      (v_event_id, 'S', 100, 100, 2),
      (v_event_id, 'M', 150, 150, 3),
      (v_event_id, 'L', 150, 150, 4),
      (v_event_id, 'XL', 100, 100, 5),
      (v_event_id, '2XL', 50, 50, 6),
      (v_event_id, '3XL', 25, 25, 7)
    ON CONFLICT (event_id, size_cd)
    DO UPDATE SET
      quantity = EXCLUDED.quantity,
      quantity_on_hand = EXCLUDED.quantity_on_hand,
      sort_order = EXCLUDED.sort_order;
  END IF;
END $$;

-- Set random T-shirt preferences for volunteers
DO $$
DECLARE
  v_event_id BIGINT;
  v_volunteer RECORD;
  v_size RECORD;
  v_quantity INTEGER;
  v_existing_pref BOOLEAN;
BEGIN
  -- Get the first event ID
  SELECT id INTO v_event_id FROM public.events LIMIT 1;

  IF v_event_id IS NOT NULL THEN
    -- For each volunteer
    FOR v_volunteer IN SELECT id FROM public.volunteers LIMIT 10 LOOP
      -- Set requested quantity between 1 and 3
      UPDATE public.volunteers
      SET requested_tshirt_quantity = floor(random() * 3) + 1
      WHERE id = v_volunteer.id;

      -- For each size (randomly select 1-2 sizes)
      FOR v_size IN
        SELECT size_cd
        FROM public.tshirt_inventory
        WHERE event_id = v_event_id
        ORDER BY random()
        LIMIT floor(random() * 2) + 1
      LOOP
        -- Random quantity between 1 and 2
        v_quantity := floor(random() * 2) + 1;

        -- Check if preference already exists
        SELECT EXISTS (
          SELECT 1
          FROM public.volunteer_tshirts
          WHERE volunteer_id = v_volunteer.id
            AND event_id = v_event_id
            AND size = v_size.size_cd
            AND status = 'preferred'
        ) INTO v_existing_pref;

        IF v_existing_pref THEN
          -- Update existing preference
          UPDATE public.volunteer_tshirts
          SET quantity = v_quantity,
              updated_at = NOW()
          WHERE volunteer_id = v_volunteer.id
            AND event_id = v_event_id
            AND size = v_size.size_cd
            AND status = 'preferred';
        ELSE
          -- Insert new preference using the function
          PERFORM add_tshirt_preference(
            v_volunteer.id,
            v_event_id,
            v_size.size_cd,
            v_quantity
          );
        END IF;
      END LOOP;
    END LOOP;
  END IF;
END $$;

-- Set random T-shirt issuances for volunteers (for testing)
DO $$
DECLARE
  v_event_id BIGINT;
  v_volunteer RECORD;
  v_size RECORD;
  v_profile_id UUID;
  v_quantity INTEGER;
BEGIN
  -- Get the first event ID
  SELECT id INTO v_event_id FROM public.events LIMIT 1;

  -- Get a profile ID for issuance
  SELECT id INTO v_profile_id FROM public.profiles LIMIT 1;

  IF v_event_id IS NOT NULL AND v_profile_id IS NOT NULL THEN
    -- For each volunteer (limit to 5 for testing)
    FOR v_volunteer IN SELECT id FROM public.volunteers LIMIT 5 LOOP
      -- For each size (randomly select 1 size)
      FOR v_size IN
        SELECT size_cd
        FROM public.tshirt_inventory
        WHERE event_id = v_event_id
        ORDER BY random()
        LIMIT 1
      LOOP
        -- Random quantity of 1
        v_quantity := 1;

        -- Issue T-shirt using the function
        PERFORM issue_tshirt(
          v_volunteer.id,
          v_event_id,
          v_size.size_cd,
          v_profile_id,
          v_quantity
        );
      END LOOP;
    END LOOP;
  END IF;
END $$;
