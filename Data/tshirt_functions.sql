-- T-shirt related functions
-- Note: This file uses size_cd as the primary identifier for T-shirt sizes
-- The views provide backward compatibility for code that still expects numeric IDs

-- Create a view for backward compatibility with tshirt_sizes
DROP VIEW IF EXISTS public.tshirt_sizes;
CREATE OR REPLACE VIEW public.tshirt_sizes AS
SELECT
    event_id,
    size_cd AS size_name,
    sort_order,
    (event_id * 100 + sort_order)::BIGINT AS id
FROM public.tshirt_inventory;

-- Drop existing functions to allow parameter name changes
DROP FUNCTION IF EXISTS add_tshirt_preference(UUID, BIGINT, VARCHAR, INTEGER);
DROP FUNCTION IF EXISTS issue_tshirt(UUID, BIGINT, VARCHAR, UUID, INTEGER);
DROP FUNCTION IF EXISTS return_tshirt(UUID, BIGINT, VARCHAR);
DROP FUNCTION IF EXISTS return_tshirt(UUID, BIGINT, VARCHAR, INTEGER);

-- Unified function to manage T-shirt records (preferences and issuances)
CREATE OR REPLACE FUNCTION manage_tshirt(
  p_volunteer_id UUID,
  p_event_id BIGINT,
  p_size_cd VARCHAR(5),
  p_status TEXT, -- 'preferred' or 'issued'
  p_quantity INTEGER DEFAULT 1,
  p_issued_by_profile_id UUID DEFAULT NULL,
  p_allow_override BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
  v_tshirt_id UUID;
  v_existing_id UUID;
  v_existing_quantity INTEGER;
  v_available INTEGER;
  v_allocation INTEGER;
  v_current_total INTEGER;
  v_new_total INTEGER;
BEGIN
  -- Validate status
  IF p_status NOT IN ('preferred', 'issued') THEN
    RAISE EXCEPTION 'Invalid status: %. Must be preferred or issued', p_status;
  END IF;

  -- Get volunteer's allocation limit
  SELECT requested_tshirt_quantity INTO v_allocation
  FROM volunteers
  WHERE id = p_volunteer_id;

  IF v_allocation IS NULL THEN
    v_allocation := 1; -- Default allocation
  END IF;

  -- Calculate current total for this volunteer by status (preferences OR issuances, not combined)
  SELECT COALESCE(SUM(quantity), 0) INTO v_current_total
  FROM volunteer_tshirts
  WHERE volunteer_id = p_volunteer_id
    AND event_id = p_event_id
    AND status = p_status;

  -- Calculate what the new total would be for this status
  v_new_total := v_current_total + p_quantity;

  -- Check allocation limit (allow override for admins)
  -- This validates preferences OR issuances separately against volunteer's allocation
  IF v_new_total > v_allocation AND NOT p_allow_override THEN
    RAISE EXCEPTION 'Allocation limit exceeded. Current % total: %, Limit: %, Attempting to add: %',
      p_status, v_current_total, v_allocation, p_quantity;
  END IF;

  -- For issuances, check inventory availability
  IF p_status = 'issued' THEN
    SELECT quantity_on_hand INTO v_available
    FROM tshirt_inventory
    WHERE event_id = p_event_id AND size_cd = p_size_cd;

    IF v_available < p_quantity THEN
      RAISE EXCEPTION 'Not enough inventory for size %', p_size_cd;
    END IF;
  END IF;

  -- Check if record already exists with same status
  SELECT id, quantity INTO v_existing_id, v_existing_quantity
  FROM volunteer_tshirts
  WHERE volunteer_id = p_volunteer_id
    AND event_id = p_event_id
    AND size = p_size_cd
    AND status = p_status;

  IF v_existing_id IS NOT NULL THEN
    -- Update existing record
    UPDATE volunteer_tshirts
    SET quantity = v_existing_quantity + p_quantity,
        issued_by_profile_id = CASE WHEN p_status = 'issued' THEN p_issued_by_profile_id ELSE issued_by_profile_id END,
        issued_at = CASE WHEN p_status = 'issued' AND issued_at IS NULL THEN NOW() ELSE issued_at END,
        updated_at = NOW()
    WHERE id = v_existing_id
    RETURNING id INTO v_tshirt_id;
  ELSE
    -- Insert new record
    INSERT INTO volunteer_tshirts (
      volunteer_id,
      event_id,
      size,
      status,
      quantity,
      issued_by_profile_id,
      issued_at
    )
    VALUES (
      p_volunteer_id,
      p_event_id,
      p_size_cd,
      p_status,
      p_quantity,
      CASE WHEN p_status = 'issued' THEN p_issued_by_profile_id ELSE NULL END,
      CASE WHEN p_status = 'issued' THEN NOW() ELSE NULL END
    )
    RETURNING id INTO v_tshirt_id;
  END IF;

  RETURN v_tshirt_id;
END;
$$ LANGUAGE plpgsql;

-- Convenience function for adding preferences
CREATE OR REPLACE FUNCTION add_tshirt_preference(
  p_volunteer_id UUID,
  p_event_id BIGINT,
  p_size_cd VARCHAR(5),
  p_quantity INTEGER DEFAULT 1,
  p_allow_override BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
BEGIN
  RETURN manage_tshirt(p_volunteer_id, p_event_id, p_size_cd, 'preferred', p_quantity, NULL, p_allow_override);
END;
$$ LANGUAGE plpgsql;

-- Convenience function for issuing T-shirts
CREATE OR REPLACE FUNCTION issue_tshirt(
  p_volunteer_id UUID,
  p_event_id BIGINT,
  p_size_cd VARCHAR(5),
  p_issued_by_profile_id UUID,
  p_quantity INTEGER DEFAULT 1,
  p_allow_override BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
BEGIN
  RETURN manage_tshirt(p_volunteer_id, p_event_id, p_size_cd, 'issued', p_quantity, p_issued_by_profile_id, p_allow_override);
END;
$$ LANGUAGE plpgsql;

-- Unified function to remove/reduce T-shirt records (preferences or issuances)
CREATE OR REPLACE FUNCTION remove_tshirt(
  p_volunteer_id UUID,
  p_event_id BIGINT,
  p_size_cd VARCHAR(5),
  p_status TEXT, -- 'preferred' or 'issued'
  p_quantity INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  v_tshirt_id UUID;
  v_current_quantity INTEGER;
BEGIN
  -- Validate status
  IF p_status NOT IN ('preferred', 'issued') THEN
    RAISE EXCEPTION 'Invalid status: %. Must be preferred or issued', p_status;
  END IF;

  -- Find the T-shirt record to remove/reduce
  SELECT id, quantity INTO v_tshirt_id, v_current_quantity
  FROM volunteer_tshirts
  WHERE volunteer_id = p_volunteer_id
    AND event_id = p_event_id
    AND size = p_size_cd
    AND status = p_status
  ORDER BY CASE WHEN p_status = 'issued' THEN issued_at ELSE created_at END DESC
  LIMIT 1;

  IF v_tshirt_id IS NULL THEN
    RAISE EXCEPTION 'No % T-shirt found for volunteer %', p_status, p_volunteer_id;
  END IF;

  IF p_quantity >= v_current_quantity THEN
    -- Remove the entire record if removing all or more
    DELETE FROM volunteer_tshirts WHERE id = v_tshirt_id;
  ELSE
    -- Reduce the quantity if removing partial
    UPDATE volunteer_tshirts
    SET quantity = quantity - p_quantity,
        updated_at = NOW()
    WHERE id = v_tshirt_id;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Convenience function for returning T-shirts (removing issuances)
CREATE OR REPLACE FUNCTION return_tshirt(
  p_volunteer_id UUID,
  p_event_id BIGINT,
  p_size_cd VARCHAR(5),
  p_quantity INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN remove_tshirt(p_volunteer_id, p_event_id, p_size_cd, 'issued', p_quantity);
END;
$$ LANGUAGE plpgsql;

-- Convenience function for removing preferences
CREATE OR REPLACE FUNCTION remove_tshirt_preference(
  p_volunteer_id UUID,
  p_event_id BIGINT,
  p_size_cd VARCHAR(5),
  p_quantity INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN remove_tshirt(p_volunteer_id, p_event_id, p_size_cd, 'preferred', p_quantity);
END;
$$ LANGUAGE plpgsql;

-- Create views for backward compatibility
-- These views provide compatibility for code that still expects the old schema structure
-- with separate tables for preferences and issuances

-- View for volunteer_tshirt_preferences
-- This view maps to the volunteer_tshirts table with status = 'preferred'
DROP VIEW IF EXISTS public.volunteer_tshirt_preferences;
CREATE OR REPLACE VIEW public.volunteer_tshirt_preferences AS
SELECT
    id,
    volunteer_id,
    event_id,
    NULL::bigint AS tshirt_size_id, -- Keep NULL for backward compatibility
    size,
    quantity,
    FALSE AS is_fulfilled,
    created_at,
    updated_at
FROM public.volunteer_tshirts
WHERE status = 'preferred';

-- View for tshirt_issuances
-- This view maps to the volunteer_tshirts table with status = 'issued'
DROP VIEW IF EXISTS public.tshirt_issuances;
CREATE OR REPLACE VIEW public.tshirt_issuances AS
SELECT
    id,
    volunteer_id,
    event_id,
    NULL::bigint AS tshirt_inventory_id, -- Keep NULL for backward compatibility
    size,
    quantity,
    issued_by_profile_id,
    issued_at,
    issued_at AS created_at,
    issued_at AS updated_at
FROM public.volunteer_tshirts
WHERE status = 'issued';

-- Drop existing trigger function
DROP FUNCTION IF EXISTS update_tshirt_inventory() CASCADE;

-- Trigger function to update inventory when T-shirts are issued or returned
CREATE OR REPLACE FUNCTION update_tshirt_inventory()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT operations (new issuances)
  IF TG_OP = 'INSERT' AND NEW.status = 'issued' THEN
    -- Decrease inventory for new issuances
    UPDATE tshirt_inventory
    SET quantity_on_hand = quantity_on_hand - NEW.quantity
    WHERE event_id = NEW.event_id AND size_cd = NEW.size;
    RETURN NEW;
  END IF;

  -- Handle UPDATE operations (status changes or quantity changes)
  IF TG_OP = 'UPDATE' THEN
    -- If status changed from preferred to issued
    IF OLD.status = 'preferred' AND NEW.status = 'issued' THEN
      UPDATE tshirt_inventory
      SET quantity_on_hand = quantity_on_hand - NEW.quantity
      WHERE event_id = NEW.event_id AND size_cd = NEW.size;
    -- If quantity changed for issued items
    ELSIF OLD.status = 'issued' AND NEW.status = 'issued' AND OLD.quantity != NEW.quantity THEN
      UPDATE tshirt_inventory
      SET quantity_on_hand = quantity_on_hand - (NEW.quantity - OLD.quantity)
      WHERE event_id = NEW.event_id AND size_cd = NEW.size;
    END IF;
    RETURN NEW;
  END IF;

  -- Handle DELETE operations (returns)
  IF TG_OP = 'DELETE' AND OLD.status = 'issued' THEN
    -- Increase inventory when issued items are deleted (returned)
    UPDATE tshirt_inventory
    SET quantity_on_hand = quantity_on_hand + OLD.quantity
    WHERE event_id = OLD.event_id AND size_cd = OLD.size;
    RETURN OLD;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS tshirt_inventory_update_trigger ON volunteer_tshirts;
CREATE TRIGGER tshirt_inventory_update_trigger
AFTER INSERT OR UPDATE OR DELETE ON volunteer_tshirts
FOR EACH ROW
EXECUTE FUNCTION update_tshirt_inventory();

-- Drop existing function
DROP FUNCTION IF EXISTS get_tshirt_counts_by_volunteer(BIGINT);

-- Function to get T-shirt counts by volunteer and size
-- This is the recommended function to use from the frontend
CREATE OR REPLACE FUNCTION get_tshirt_counts_by_volunteer_and_size(p_event_id BIGINT)
RETURNS TABLE (
  volunteer_id UUID,
  volunteer_name TEXT,
  allocation INTEGER,
  status TEXT,
  size_cd VARCHAR(5),
  quantity INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id AS volunteer_id,
    v.first_name || ' ' || v.last_name AS volunteer_name,
    v.requested_tshirt_quantity AS allocation,
    vt.status,
    vt.size AS size_cd,
    SUM(vt.quantity) AS quantity
  FROM
    volunteer_tshirts vt
  JOIN
    volunteers v ON vt.volunteer_id = v.id
  WHERE
    vt.event_id = p_event_id
    AND vt.status IN ('preferred', 'issued')
  GROUP BY
    v.id, volunteer_name, v.requested_tshirt_quantity, vt.status, vt.size
  ORDER BY
    volunteer_name, vt.status, vt.size;
END;
$$ LANGUAGE plpgsql;

-- Function to get all available T-shirt sizes for an event
CREATE OR REPLACE FUNCTION get_tshirt_sizes(p_event_id BIGINT)
RETURNS TABLE (
  size_cd VARCHAR(5),
  size_name VARCHAR(5),
  sort_order INTEGER,
  quantity INTEGER,
  quantity_on_hand INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ti.size_cd,
    ti.size_cd AS size_name,
    ti.sort_order,
    ti.quantity,
    ti.quantity_on_hand
  FROM
    tshirt_inventory ti
  WHERE
    ti.event_id = p_event_id
  ORDER BY
    ti.sort_order;
END;
$$ LANGUAGE plpgsql;

-- Function to get T-shirt counts by volunteer (for backward compatibility)
-- This version uses dynamic SQL to avoid hardcoding T-shirt sizes
CREATE OR REPLACE FUNCTION get_tshirt_counts_by_volunteer(
  p_event_id BIGINT,
  OUT volunteer_name TEXT,
  OUT allocation INTEGER,
  OUT status TEXT,
  OUT total_count INTEGER
)
RETURNS SETOF RECORD AS $$
DECLARE
  v_sql TEXT;
  v_size RECORD;
  v_case_statements TEXT := '';
  v_column_list TEXT := '';
BEGIN
  -- Build dynamic SQL based on available sizes in the inventory
  FOR v_size IN
    SELECT DISTINCT size_cd
    FROM tshirt_inventory
    WHERE event_id = p_event_id
    ORDER BY sort_order
  LOOP
    -- Add a CASE statement for each size
    v_case_statements := v_case_statements ||
      format('SUM(CASE WHEN vt.size = %L THEN vt.quantity ELSE 0 END) AS %I_count, ',
             v_size.size_cd, lower(v_size.size_cd));

    -- Add the column to the column list
    v_column_list := v_column_list || format('%I_count INTEGER, ', lower(v_size.size_cd));
  END LOOP;

  -- Remove trailing comma and space
  v_case_statements := LEFT(v_case_statements, LENGTH(v_case_statements) - 2);
  v_column_list := LEFT(v_column_list, LENGTH(v_column_list) - 2);

  -- Build the complete SQL statement
  v_sql := format('
    SELECT
      v.first_name || '' '' || v.last_name AS volunteer_name,
      v.requested_tshirt_quantity AS allocation,
      vt.status,
      %s,
      SUM(vt.quantity) AS total_count
    FROM
      volunteer_tshirts vt
    JOIN
      volunteers v ON vt.volunteer_id = v.id
    WHERE
      vt.event_id = %L
      AND vt.status IN (''preferred'', ''issued'')
    GROUP BY
      volunteer_name, v.requested_tshirt_quantity, vt.status
    ORDER BY
      volunteer_name, vt.status
  ', v_case_statements, p_event_id);

  -- Execute the dynamic SQL
  RETURN QUERY EXECUTE v_sql;
END;
$$ LANGUAGE plpgsql;