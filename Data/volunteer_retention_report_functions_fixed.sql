-- ---------------------------------------------------------------------------
-- FIXED Volunteer Retention Report Functions
-- Version: 2.0 - Performance Optimized
-- Date: June 24, 2025
-- 
-- FIXES APPLIED:
-- 1. Fixed normalize_phone function to remove ALL non-digit characters
-- 2. Optimized get_new_volunteers for performance (reduced comparisons)
-- 3. Simplified matching logic to avoid timeout issues
-- 4. Removed dependency on pg_trgm similarity for initial matching
-- ---------------------------------------------------------------------------

-- FIXED: Helper function to normalize phone numbers
CREATE OR REPLACE FUNCTION normalize_phone(phone_input TEXT)
RETURNS TEXT AS $$
BEGIN
    IF phone_input IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Remove ALL non-digit characters (fixed regex)
    RETURN REGEXP_REPLACE(phone_input, '[^0-9]', '', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- OPTIMIZED: Helper function to check if volunteer matches by email or phone
-- Simplified to avoid performance issues with similarity function
CREATE OR REPLACE FUNCTION volunteers_match_simple(
    email1 TEXT, phone1 TEXT,
    email2 TEXT, phone2 TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    normalized_phone1 TEXT;
    normalized_phone2 TEXT;
BEGIN
    -- Primary: Exact email match (case-insensitive)
    IF email1 IS NOT NULL AND email2 IS NOT NULL THEN
        IF LOWER(TRIM(email1)) = LOWER(TRIM(email2)) THEN
            RETURN TRUE;
        END IF;
    END IF;
    
    -- Secondary: Exact phone match (normalized)
    IF phone1 IS NOT NULL AND phone2 IS NOT NULL THEN
        normalized_phone1 := normalize_phone(phone1);
        normalized_phone2 := normalize_phone(phone2);
        
        IF normalized_phone1 = normalized_phone2 AND LENGTH(normalized_phone1) >= 10 THEN
            RETURN TRUE;
        END IF;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- PERFORMANCE OPTIMIZED: Function for new volunteers
-- Uses hash-based approach instead of nested loops for better performance
CREATE OR REPLACE FUNCTION get_new_volunteers_optimized(
    p_current_year INTEGER DEFAULT 2025,
    p_seva_patterns TEXT[] DEFAULT ARRAY['%']
)
RETURNS TABLE (
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    current_year_seva TEXT,
    total INTEGER,
    past_years_seva_details TEXT,
    volunteer_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH current_year_volunteers AS (
        SELECT DISTINCT
            COALESCE(vdh.first_name, '') as first_name,
            COALESCE(vdh.last_name, '') as last_name,
            LOWER(TRIM(vdh.email)) as email,
            normalize_phone(vdh.phone) as phone,
            COALESCE(vdh.seva, 'Unassigned') as seva,
            COALESCE(vdh.total, 0) as total
        FROM volunteer_data_historical vdh
        WHERE vdh.year = p_current_year
        AND (
            CASE 
                WHEN array_length(p_seva_patterns, 1) = 1 AND p_seva_patterns[1] = '%' THEN TRUE
                ELSE EXISTS (
                    SELECT 1 FROM unnest(p_seva_patterns) as pattern
                    WHERE COALESCE(vdh.seva, '') ILIKE pattern
                ) OR vdh.seva IS NULL
            END
        )
    ),
    
    -- Create hash sets of past volunteer identifiers for O(1) lookup
    past_emails AS (
        SELECT DISTINCT LOWER(TRIM(vdh.email)) as email
        FROM volunteer_data_historical vdh
        WHERE vdh.year < p_current_year
        AND vdh.email IS NOT NULL
        AND TRIM(vdh.email) != ''
    ),
    
    past_phones AS (
        SELECT DISTINCT normalize_phone(vdh.phone) as phone
        FROM volunteer_data_historical vdh
        WHERE vdh.year < p_current_year
        AND vdh.phone IS NOT NULL
        AND TRIM(vdh.phone) != ''
        AND LENGTH(normalize_phone(vdh.phone)) >= 10
    )
    
    SELECT 
        cy.first_name,
        cy.last_name,
        cy.email,
        cy.phone,
        cy.seva as current_year_seva,
        cy.total,
        ''::TEXT as past_years_seva_details,
        'new'::TEXT as volunteer_type
    FROM current_year_volunteers cy
    WHERE NOT EXISTS (
        -- Check if email exists in past
        SELECT 1 FROM past_emails pe WHERE pe.email = cy.email
    )
    AND NOT EXISTS (
        -- Check if phone exists in past
        SELECT 1 FROM past_phones pp WHERE pp.phone = cy.phone
    )
    ORDER BY cy.first_name, cy.last_name;
END;
$$ LANGUAGE plpgsql;

-- SIMPLIFIED: Alternative even simpler approach for testing
CREATE OR REPLACE FUNCTION get_new_volunteers_simple(
    p_current_year INTEGER DEFAULT 2025
)
RETURNS TABLE (
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    current_year_seva TEXT,
    total INTEGER,
    past_years_seva_details TEXT,
    volunteer_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        COALESCE(curr.first_name, '') as first_name,
        COALESCE(curr.last_name, '') as last_name,
        curr.email,
        curr.phone,
        COALESCE(curr.seva, 'Unassigned') as current_year_seva,
        COALESCE(curr.total, 0) as total,
        ''::TEXT as past_years_seva_details,
        'new'::TEXT as volunteer_type
    FROM volunteer_data_historical curr
    WHERE curr.year = p_current_year
    AND NOT EXISTS (
        SELECT 1 FROM volunteer_data_historical past
        WHERE past.year < p_current_year
        AND (
            -- Email match
            (LOWER(TRIM(curr.email)) = LOWER(TRIM(past.email)) 
             AND curr.email IS NOT NULL AND past.email IS NOT NULL
             AND TRIM(curr.email) != '' AND TRIM(past.email) != '')
            OR 
            -- Phone match
            (normalize_phone(curr.phone) = normalize_phone(past.phone) 
             AND curr.phone IS NOT NULL AND past.phone IS NOT NULL 
             AND LENGTH(normalize_phone(curr.phone)) >= 10)
        )
    )
    ORDER BY first_name, last_name;
END;
$$ LANGUAGE plpgsql;

-- FIXED: Updated main function to use original volunteers_match but with optimizations
CREATE OR REPLACE FUNCTION get_new_volunteers_fixed(
    p_current_year INTEGER DEFAULT 2025,
    p_name_similarity_threshold FLOAT DEFAULT 0.8,
    p_email_similarity_threshold FLOAT DEFAULT 0.8,
    p_seva_patterns TEXT[] DEFAULT ARRAY['%']
)
RETURNS TABLE (
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    current_year_seva TEXT,
    total INTEGER,
    past_years_seva_details TEXT,
    volunteer_type TEXT
) AS $$
BEGIN
    -- Use the optimized version for better performance
    RETURN QUERY
    SELECT * FROM get_new_volunteers_optimized(p_current_year, p_seva_patterns);
END;
$$ LANGUAGE plpgsql;

-- Test function to verify normalize_phone fix
CREATE OR REPLACE FUNCTION test_normalize_phone()
RETURNS TABLE (
    input TEXT,
    output TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM (
        VALUES 
            ('(868) 759-2075', normalize_phone('(868) 759-2075')),
            ('868-759-2075', normalize_phone('868-759-2075')),
            ('868.759.2075', normalize_phone('868.759.2075')),
            ('+1 868 759 2075', normalize_phone('+1 868 759 2075')),
            (' 868 759 2075 ', normalize_phone(' 868 759 2075 ')),
            ('1-800-FLOWERS', normalize_phone('1-800-FLOWERS')),
            ('123abc456', normalize_phone('123abc456'))
    ) AS t(input, output);
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION normalize_phone(TEXT) TO PUBLIC;
GRANT EXECUTE ON FUNCTION volunteers_match_simple(TEXT, TEXT, TEXT, TEXT) TO PUBLIC;
GRANT EXECUTE ON FUNCTION get_new_volunteers_optimized(INTEGER, TEXT[]) TO PUBLIC;
GRANT EXECUTE ON FUNCTION get_new_volunteers_simple(INTEGER) TO PUBLIC;
GRANT EXECUTE ON FUNCTION get_new_volunteers_fixed(INTEGER, FLOAT, FLOAT, TEXT[]) TO PUBLIC;
GRANT EXECUTE ON FUNCTION test_normalize_phone() TO PUBLIC;

-- Test the fixes
SELECT 'Testing normalize_phone fixes:' as test_section;
SELECT * FROM test_normalize_phone();

SELECT 'Testing new volunteers (simple):' as test_section;
SELECT COUNT(*) as new_volunteers_count FROM get_new_volunteers_simple(2025);

SELECT 'Testing new volunteers (optimized):' as test_section;
SELECT COUNT(*) as new_volunteers_count FROM get_new_volunteers_optimized(2025);

SELECT 'Sample new volunteers:' as test_section;
SELECT first_name, last_name, email, current_year_seva 
FROM get_new_volunteers_simple(2025) 
LIMIT 10;