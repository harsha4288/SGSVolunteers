-- Function to issue a T-shirt with inventory management
CREATE OR REPLACE FUNCTION public.issue_tshirt(
  p_volunteer_id TEXT,
  p_event_id INTEGER,
  p_size TEXT,
  p_issued_by_profile_id TEXT
) RETURNS VOID AS $$
DECLARE
  v_inventory_id INTEGER;
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
    SET quantity = quantity - 1
    WHERE id = v_inventory_id;

    -- Record issuance
    INSERT INTO public.tshirt_issuances (
      volunteer_id,
      event_id,
      size,
      issued_at,
      issued_by_profile_id
    ) VALUES (
      p_volunteer_id,
      p_event_id,
      p_size,
      NOW(),
      p_issued_by_profile_id
    );
  EXCEPTION
    WHEN OTHERS THEN
      RAISE;
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
  -- Get total allocation
  SELECT COALESCE(requested_tshirt_quantity, 1)
  INTO v_total_allocation
  FROM public.volunteers
  WHERE id = p_volunteer_id;

  -- Get used allocation
  SELECT COUNT(*)
  INTO v_used_allocation
  FROM public.tshirt_issuances
  WHERE volunteer_id = p_volunteer_id
    AND event_id = p_event_id;

  -- Return remaining allocation
  RETURN v_total_allocation - v_used_allocation;
END;
$$ LANGUAGE plpgsql;

-- Function to set volunteer T-shirt preferences
CREATE OR REPLACE FUNCTION public.set_volunteer_tshirt_preferences(
  p_volunteer_id UUID,
  p_event_id BIGINT,
  p_preferences JSONB -- Array of {size_id, preference_order}
) RETURNS VOID AS $$
DECLARE
  v_total_allocation INTEGER;
  v_preference JSONB;
BEGIN
  -- Get total allocation
  SELECT COALESCE(requested_tshirt_quantity, 1)
  INTO v_total_allocation
  FROM public.volunteers
  WHERE id = p_volunteer_id;

  -- Check if preferences exceed allocation
  IF jsonb_array_length(p_preferences) > v_total_allocation THEN
    RAISE EXCEPTION 'Number of preferences exceeds allocation limit of %', v_total_allocation;
  END IF;

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
      preference_order
    ) VALUES (
      p_volunteer_id,
      p_event_id,
      (v_preference->>'size_id')::BIGINT,
      (v_preference->>'preference_order')::INTEGER
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to issue a T-shirt with inventory management and preference tracking
CREATE OR REPLACE FUNCTION public.issue_tshirt_v2(
  p_volunteer_id UUID,
  p_event_id BIGINT,
  p_size TEXT,
  p_issued_by_profile_id UUID
) RETURNS VOID AS $$
DECLARE
  v_inventory_id BIGINT;
  v_quantity INTEGER;
  v_tshirt_size_id BIGINT;
  v_issuance_id BIGINT;
  v_preference_id BIGINT;
  v_remaining_allocation INTEGER;
BEGIN
  -- Check remaining allocation
  SELECT COALESCE(requested_tshirt_quantity, 1) -
         (SELECT COUNT(*) FROM public.tshirt_issuances
          WHERE volunteer_id = p_volunteer_id AND event_id = p_event_id)
  INTO v_remaining_allocation
  FROM public.volunteers
  WHERE id = p_volunteer_id;

  IF v_remaining_allocation <= 0 THEN
    RAISE EXCEPTION 'Volunteer has no remaining T-shirt allocation';
  END IF;

  -- Get inventory ID and check quantity
  SELECT i.id, i.quantity, i.tshirt_size_id
  INTO v_inventory_id, v_quantity, v_tshirt_size_id
  FROM public.tshirt_inventory i
  JOIN public.tshirt_sizes s ON i.tshirt_size_id = s.id
  WHERE i.event_id = p_event_id AND s.size_name = p_size;

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

    -- Check if this fulfills a preference
    SELECT id INTO v_preference_id
    FROM public.volunteer_tshirt_preferences
    WHERE volunteer_id = p_volunteer_id
      AND event_id = p_event_id
      AND tshirt_size_id = v_tshirt_size_id
      AND is_fulfilled = FALSE
    LIMIT 1;

    -- If preference exists, mark it as fulfilled
    IF v_preference_id IS NOT NULL THEN
      UPDATE public.volunteer_tshirt_preferences
      SET is_fulfilled = TRUE,
          fulfilled_by_issuance_id = v_issuance_id,
          updated_at = NOW()
      WHERE id = v_preference_id;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE;
  END;
END;
$$ LANGUAGE plpgsql;

-- Function to get detailed T-shirt issuance report
CREATE OR REPLACE FUNCTION public.get_tshirt_issuance_report(
  p_event_id INTEGER
) RETURNS TABLE (
  id INTEGER,
  volunteer_id TEXT,
  volunteer_name TEXT,
  volunteer_email TEXT,
  size TEXT,
  issued_at TIMESTAMP WITH TIME ZONE,
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
    CONCAT(p.first_name, ' ', p.last_name) AS issued_by
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
