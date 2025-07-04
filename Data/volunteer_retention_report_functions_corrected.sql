    -- ---------------------------------------------------------------------------
    -- Volunteer Retention Report Functions - Corrected Version
    -- Version: 2.0
    -- Date: June 25, 2025
    -- 
    -- This script provides optimized and corrected SQL functions for generating 
    -- volunteer retention reports including returning, new, and inactive volunteers.
    -- 
    -- Key Fixes:
    -- 1. Fixed phone normalization to remove ALL non-digit characters
    -- 2. Optimized performance for large datasets
    -- 3. Simplified matching logic for better reliability
    -- 4. Added proper NULL handling throughout
    -- ---------------------------------------------------------------------------

    -- Enable pg_trgm extension for similarity function if needed
    CREATE EXTENSION IF NOT EXISTS pg_trgm;

    -- Helper function to normalize phone numbers - CORRECTED VERSION
    CREATE OR REPLACE FUNCTION normalize_phone(phone_input TEXT)
    RETURNS TEXT AS $$
    BEGIN
        IF phone_input IS NULL OR TRIM(phone_input) = '' THEN
            RETURN NULL;
        END IF;
        
        -- Remove ALL non-digit characters (including parentheses, spaces, dashes, etc.)
        RETURN REGEXP_REPLACE(TRIM(phone_input), '[^0-9]', '', 'g');
    END;
    $$ LANGUAGE plpgsql IMMUTABLE;

    -- Helper function to check if volunteer matches by email or phone - OPTIMIZED VERSION
    CREATE OR REPLACE FUNCTION volunteers_match(
        email1 TEXT, phone1 TEXT,
        email2 TEXT, phone2 TEXT,
        email_threshold FLOAT DEFAULT 0.8
    )
    RETURNS BOOLEAN AS $$
    DECLARE
        normalized_phone1 TEXT;
        normalized_phone2 TEXT;
        clean_email1 TEXT;
        clean_email2 TEXT;
    BEGIN
        -- Clean and normalize inputs
        clean_email1 := LOWER(TRIM(COALESCE(email1, '')));
        clean_email2 := LOWER(TRIM(COALESCE(email2, '')));
        normalized_phone1 := normalize_phone(phone1);
        normalized_phone2 := normalize_phone(phone2);
        
        -- Primary: Exact email match (case-insensitive)
        IF clean_email1 != '' AND clean_email2 != '' AND clean_email1 = clean_email2 THEN
            RETURN TRUE;
        END IF;
        
        -- Secondary: Exact phone match (normalized, minimum 10 digits)
        IF normalized_phone1 IS NOT NULL AND normalized_phone2 IS NOT NULL 
        AND LENGTH(normalized_phone1) >= 10 AND LENGTH(normalized_phone2) >= 10
        AND normalized_phone1 = normalized_phone2 THEN
            RETURN TRUE;
        END IF;
        
        RETURN FALSE;
    END;
    $$ LANGUAGE plpgsql IMMUTABLE;

    -- OPTIMIZED Function for new volunteers
    CREATE OR REPLACE FUNCTION get_new_volunteers(
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
        RETURN QUERY
        SELECT 
            COALESCE(cy.first_name, '') as first_name,
            COALESCE(cy.last_name, '') as last_name,
            cy.email,
            cy.phone,
            COALESCE(cy.seva, 'Unassigned') as current_year_seva,
            COALESCE(cy.total, 0) as total,
            ''::TEXT as past_years_seva_details,
            'new'::TEXT as volunteer_type
        FROM (
            SELECT DISTINCT
                vdh.first_name,
                vdh.last_name,
                LOWER(TRIM(vdh.email)) as email,
                normalize_phone(vdh.phone) as phone,
                vdh.seva,
                vdh.total
            FROM volunteer_data_historical vdh
            WHERE vdh.year = p_current_year
            AND vdh.email IS NOT NULL
            AND TRIM(vdh.email) != ''
            AND (
                CASE 
                    WHEN array_length(p_seva_patterns, 1) = 1 AND p_seva_patterns[1] = '%' THEN TRUE
                    ELSE (
                        vdh.seva IS NULL OR 
                        EXISTS (
                            SELECT 1 FROM unnest(p_seva_patterns) as pattern
                            WHERE COALESCE(vdh.seva, '') ILIKE pattern
                        )
                    )
                END
            )
        ) cy
        WHERE NOT EXISTS (
            SELECT 1 
            FROM volunteer_data_historical pv
            WHERE pv.year < p_current_year
            AND pv.email IS NOT NULL
            AND TRIM(pv.email) != ''
            AND volunteers_match(cy.email, cy.phone, LOWER(TRIM(pv.email)), normalize_phone(pv.phone), p_email_similarity_threshold)
        )
        ORDER BY cy.first_name, cy.last_name;
    END;
    $$ LANGUAGE plpgsql;

    -- OPTIMIZED Function for returning volunteers
    CREATE OR REPLACE FUNCTION get_returning_volunteers(
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
        RETURN QUERY
        WITH current_volunteers AS (
            SELECT DISTINCT
                COALESCE(vdh.first_name, '') as first_name,
                COALESCE(vdh.last_name, '') as last_name,
                LOWER(TRIM(vdh.email)) as email,
                normalize_phone(vdh.phone) as phone,
                COALESCE(vdh.seva, 'Unassigned') as seva,
                COALESCE(vdh.total, 0) as total
            FROM volunteer_data_historical vdh
            WHERE vdh.year = p_current_year
            AND vdh.email IS NOT NULL
            AND TRIM(vdh.email) != ''
        ),
        
        past_volunteers_filtered AS (
            SELECT DISTINCT
                LOWER(TRIM(vdh.email)) as email,
                normalize_phone(vdh.phone) as phone,
                vdh.year,
                COALESCE(vdh.seva, 'Unassigned') as seva,
                COALESCE(vdh.first_name, '') as first_name,
                COALESCE(vdh.last_name, '') as last_name
            FROM volunteer_data_historical vdh
            WHERE vdh.year < p_current_year
            AND vdh.email IS NOT NULL
            AND TRIM(vdh.email) != ''
            AND (
                CASE 
                    WHEN array_length(p_seva_patterns, 1) = 1 AND p_seva_patterns[1] = '%' THEN TRUE
                    ELSE EXISTS (
                        SELECT 1 FROM unnest(p_seva_patterns) as pattern
                        WHERE COALESCE(vdh.seva, '') ILIKE pattern
                    )
                END
            )
        )
        
        SELECT 
            cv.first_name,
            cv.last_name,
            cv.email,
            cv.phone,
            cv.seva as current_year_seva,
            cv.total,
            STRING_AGG(
                DISTINCT pv.year::TEXT || ' "' || pv.seva || '"', 
                '; ' ORDER BY pv.year::TEXT || ' "' || pv.seva || '"'
            ) as past_years_seva_details,
            'returning'::TEXT as volunteer_type
        FROM current_volunteers cv
        INNER JOIN past_volunteers_filtered pv ON (
            volunteers_match(cv.email, cv.phone, pv.email, pv.phone, p_email_similarity_threshold)
        )
        WHERE NOT EXISTS (
            SELECT 1 FROM unnest(p_seva_patterns) as pattern
            WHERE cv.seva ILIKE pattern
        )
        GROUP BY cv.first_name, cv.last_name, cv.email, cv.phone, cv.seva, cv.total
        ORDER BY cv.first_name, cv.last_name;
    END;
    $$ LANGUAGE plpgsql;

    -- OPTIMIZED Function for inactive volunteers
    CREATE OR REPLACE FUNCTION get_inactive_volunteers(
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
        RETURN QUERY
        WITH current_volunteers AS (
            SELECT DISTINCT
                LOWER(TRIM(vdh.email)) as email,
                normalize_phone(vdh.phone) as phone
            FROM volunteer_data_historical vdh
            WHERE vdh.year = p_current_year
            AND vdh.email IS NOT NULL
            AND TRIM(vdh.email) != ''
        ),
        
        past_volunteers_filtered AS (
            SELECT DISTINCT
                COALESCE(vdh.first_name, '') as first_name,
                COALESCE(vdh.last_name, '') as last_name,
                LOWER(TRIM(vdh.email)) as email,
                normalize_phone(vdh.phone) as phone,
                vdh.year,
                COALESCE(vdh.seva, 'Unassigned') as seva
            FROM volunteer_data_historical vdh
            WHERE vdh.year < p_current_year
            AND vdh.email IS NOT NULL
            AND TRIM(vdh.email) != ''
            AND (
                CASE 
                    WHEN array_length(p_seva_patterns, 1) = 1 AND p_seva_patterns[1] = '%' THEN TRUE
                    ELSE EXISTS (
                        SELECT 1 FROM unnest(p_seva_patterns) as pattern
                        WHERE COALESCE(vdh.seva, '') ILIKE pattern
                    )
                END
            )
        )
        
        SELECT 
            pv.first_name,
            pv.last_name,
            pv.email,
            pv.phone,
            ''::TEXT as current_year_seva,
            0 as total,
            STRING_AGG(
                DISTINCT pv.year::TEXT || ' "' || pv.seva || '"', 
                '; ' ORDER BY pv.year::TEXT || ' "' || pv.seva || '"'
            ) as past_years_seva_details,
            'inactive'::TEXT as volunteer_type
        FROM past_volunteers_filtered pv
        WHERE NOT EXISTS (
            SELECT 1 FROM current_volunteers cv 
            WHERE volunteers_match(pv.email, pv.phone, cv.email, cv.phone, p_email_similarity_threshold)
        )
        GROUP BY pv.first_name, pv.last_name, pv.email, pv.phone
        ORDER BY pv.first_name, pv.last_name;
    END;
    $$ LANGUAGE plpgsql;

    -- Main function for volunteer retention reports
    CREATE OR REPLACE FUNCTION get_volunteer_retention_report(
        p_current_year INTEGER DEFAULT 2025,
        p_name_similarity_threshold FLOAT DEFAULT 0.8,
        p_email_similarity_threshold FLOAT DEFAULT 0.8,
        p_seva_patterns TEXT[] DEFAULT ARRAY['%'],
        p_report_type TEXT DEFAULT 'all' -- 'returning', 'new', 'inactive', 'all'
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
        -- Validate inputs
        IF p_seva_patterns IS NULL OR array_length(p_seva_patterns, 1) IS NULL THEN
            p_seva_patterns := ARRAY['%'];
        END IF;
        
        -- Return results based on report type
        IF p_report_type = 'returning' OR p_report_type = 'all' THEN
            RETURN QUERY
            SELECT * FROM get_returning_volunteers(p_current_year, p_name_similarity_threshold, p_email_similarity_threshold, p_seva_patterns);
        END IF;
        
        IF p_report_type = 'new' OR p_report_type = 'all' THEN
            RETURN QUERY  
            SELECT * FROM get_new_volunteers(p_current_year, p_name_similarity_threshold, p_email_similarity_threshold, p_seva_patterns);
        END IF;
        
        IF p_report_type = 'inactive' OR p_report_type = 'all' THEN
            RETURN QUERY
            SELECT * FROM get_inactive_volunteers(p_current_year, p_name_similarity_threshold, p_email_similarity_threshold, p_seva_patterns);
        END IF;
        
        RETURN;
    END;
    $$ LANGUAGE plpgsql;

    -- Legacy function name for backward compatibility
    CREATE OR REPLACE FUNCTION get_crowd_management_retention_report(
        p_current_year INTEGER DEFAULT 2025,
        p_name_similarity_threshold FLOAT DEFAULT 0.8,
        p_email_similarity_threshold FLOAT DEFAULT 0.8,
        p_seva_patterns TEXT[] DEFAULT ARRAY['Crowd%', 'Crwd%']
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
        SELECT * FROM get_volunteer_retention_report(
            p_current_year, 
            p_name_similarity_threshold, 
            p_email_similarity_threshold, 
            p_seva_patterns,
            'all'
        );
    END;
    $$ LANGUAGE plpgsql;

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_volunteer_data_historical_year 
    ON volunteer_data_historical(year);

    CREATE INDEX IF NOT EXISTS idx_volunteer_data_historical_email_lower 
    ON volunteer_data_historical((LOWER(TRIM(email))));

    CREATE INDEX IF NOT EXISTS idx_volunteer_data_historical_seva 
    ON volunteer_data_historical(seva);

    CREATE INDEX IF NOT EXISTS idx_volunteer_data_historical_year_email 
    ON volunteer_data_historical(year, (LOWER(TRIM(email))));

    -- Grant execute permissions
    GRANT EXECUTE ON FUNCTION normalize_phone(TEXT) TO PUBLIC;
    GRANT EXECUTE ON FUNCTION volunteers_match(TEXT, TEXT, TEXT, TEXT, FLOAT) TO PUBLIC;
    GRANT EXECUTE ON FUNCTION get_volunteer_retention_report(INTEGER, FLOAT, FLOAT, TEXT[], TEXT) TO PUBLIC;
    GRANT EXECUTE ON FUNCTION get_returning_volunteers(INTEGER, FLOAT, FLOAT, TEXT[]) TO PUBLIC;
    GRANT EXECUTE ON FUNCTION get_new_volunteers(INTEGER, FLOAT, FLOAT, TEXT[]) TO PUBLIC;
    GRANT EXECUTE ON FUNCTION get_inactive_volunteers(INTEGER, FLOAT, FLOAT, TEXT[]) TO PUBLIC;
    GRANT EXECUTE ON FUNCTION get_crowd_management_retention_report(INTEGER, FLOAT, FLOAT, TEXT[]) TO PUBLIC;

    -- Test queries (uncomment to run basic tests)
    /*
    -- Test new volunteers
    SELECT 'NEW VOLUNTEERS TEST:' as test_type, COUNT(*) as count FROM get_new_volunteers(2025, 0.8, 0.8, ARRAY['%']);

    -- Test returning volunteers for crowd management
    SELECT 'RETURNING VOLUNTEERS TEST:' as test_type, COUNT(*) as count FROM get_returning_volunteers(2025, 0.8, 0.8, ARRAY['Crowd%', 'Crwd%']);

    -- Test inactive volunteers
    SELECT 'INACTIVE VOLUNTEERS TEST:' as test_type, COUNT(*) as count FROM get_inactive_volunteers(2025, 0.8, 0.8, ARRAY['%']);

    -- Test phone normalization
    SELECT 'PHONE NORMALIZATION TEST:' as test_type, 
        normalize_phone('(847) 502-5885') as normalized,
        normalize_phone('847.502.5885') as normalized2,
        normalize_phone('847-502-5885') as normalized3;
    */