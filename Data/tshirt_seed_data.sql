-- T-shirt seed data for testing

-- Insert T-shirt sizes if they don't exist
DO $$
DECLARE
  v_event_id BIGINT;
  ts RECORD;
BEGIN
  -- Get the first event ID
  SELECT id INTO v_event_id FROM public.events LIMIT 1;

  IF v_event_id IS NOT NULL THEN
    -- Insert T-shirt sizes if they don't exist
    INSERT INTO public.tshirt_sizes (event_id, size_name, sort_order)
    VALUES
      (v_event_id, 'XS', 1),
      (v_event_id, 'S', 2),
      (v_event_id, 'M', 3),
      (v_event_id, 'L', 4),
      (v_event_id, 'XL', 5),
      (v_event_id, '2XL', 6),
      (v_event_id, '3XL', 7)
    ON CONFLICT (event_id, size_name) DO NOTHING;

    -- Insert inventory for each size
    -- First check if the unique constraint exists
    FOR ts IN
      SELECT id, size_name
      FROM public.tshirt_sizes
      WHERE event_id = v_event_id
    LOOP
      -- Check if inventory already exists for this size
      IF NOT EXISTS (
        SELECT 1
        FROM public.tshirt_inventory
        WHERE event_id = v_event_id AND tshirt_size_id = ts.id
      ) THEN
        -- Insert new inventory record
        INSERT INTO public.tshirt_inventory (
          event_id,
          tshirt_size_id,
          size,
          quantity_initial,
          quantity,
          quantity_on_hand
        ) VALUES (
          v_event_id,
          ts.id,
          ts.size_name,
          CASE
            WHEN ts.size_name IN ('S', 'M', 'L') THEN 100
            WHEN ts.size_name IN ('XS', 'XL') THEN 50
            ELSE 25
          END,
          CASE
            WHEN ts.size_name IN ('S', 'M', 'L') THEN 100
            WHEN ts.size_name IN ('XS', 'XL') THEN 50
            ELSE 25
          END,
          CASE
            WHEN ts.size_name IN ('S', 'M', 'L') THEN 100
            WHEN ts.size_name IN ('XS', 'XL') THEN 50
            ELSE 25
          END
        );
      END IF;
    END LOOP;
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
        SELECT id, size_name
        FROM public.tshirt_sizes
        WHERE event_id = v_event_id
        ORDER BY random()
        LIMIT floor(random() * 2) + 1
      LOOP
        -- Random quantity between 1 and 2
        v_quantity := floor(random() * 2) + 1;

        -- Check if preference already exists
        SELECT EXISTS (
          SELECT 1
          FROM public.volunteer_tshirt_preferences
          WHERE volunteer_id = v_volunteer.id
            AND event_id = v_event_id
            AND tshirt_size_id = v_size.id
        ) INTO v_existing_pref;

        IF v_existing_pref THEN
          -- Update existing preference
          UPDATE public.volunteer_tshirt_preferences
          SET quantity = v_quantity,
              updated_at = NOW()
          WHERE volunteer_id = v_volunteer.id
            AND event_id = v_event_id
            AND tshirt_size_id = v_size.id;
        ELSE
          -- Insert new preference
          INSERT INTO public.volunteer_tshirt_preferences (
            volunteer_id,
            event_id,
            tshirt_size_id,
            quantity,
            preference_order,
            is_fulfilled
          ) VALUES (
            v_volunteer.id,
            v_event_id,
            v_size.id,
            v_quantity,
            1,
            FALSE
          );
        END IF;
      END LOOP;
    END LOOP;
  END IF;
END $$;
