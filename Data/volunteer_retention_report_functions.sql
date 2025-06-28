-- ---------------------------------------------------------------------------
-- Volunteer Retention Report Functions
-- Version: 1.0
-- Date: June 24, 2025
-- 
-- This script provides reusable SQL functions for generating volunteer
-- retention reports including returning, new, and inactive volunteers.
-- ---------------------------------------------------------------------------

-- Helper function to normalize phone numbers
CREATE OR REPLACE FUNCTION normalize_phone(phone_input TEXT)
RETURNS TEXT AS $$
BEGIN
    IF phone_input IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Remove spaces, dots, dashes, plus signs
    RETURN REGEXP_REPLACE(phone_input, '[\\s\\.\\-\\+]', '', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Helper function to check if volunteer matches by email or phone
CREATE OR REPLACE FUNCTION volunteers_match(
    email1 TEXT, phone1 TEXT,
    email2 TEXT, phone2 TEXT,
    email_threshold FLOAT DEFAULT 0.8
)
RETURNS BOOLEAN AS $$
DECLARE
    normalized_phone1 TEXT;
    normalized_phone2 TEXT;
BEGIN
    -- Primary: Email match (case-insensitive) based on threshold
    IF email1 IS NOT NULL AND email2 IS NOT NULL THEN
        IF LOWER(TRIM(email1)) = LOWER(TRIM(email2)) THEN
            RETURN TRUE;
        END IF;
        
        -- Fuzzy email matching using similarity if available
        IF similarity(LOWER(TRIM(email1)), LOWER(TRIM(email2))) >= email_threshold THEN
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
    
    -- Return combined results based on report type
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

-- Function for returning volunteers
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
    ),
    
    past_volunteers_with_seva AS (
        SELECT DISTINCT
            LOWER(TRIM(vdh.email)) as email,
            normalize_phone(vdh.phone) as phone,
            vdh.year,
            COALESCE(vdh.seva, 'Unassigned') as seva,
            COALESCE(vdh.first_name, '') as first_name,
            COALESCE(vdh.last_name, '') as last_name
        FROM volunteer_data_historical vdh
        WHERE vdh.year < p_current_year
        AND (
            CASE 
                WHEN array_length(p_seva_patterns, 1) = 1 AND p_seva_patterns[1] = '%' THEN TRUE
                ELSE EXISTS (
                    SELECT 1 FROM unnest(p_seva_patterns) as pattern
                    WHERE COALESCE(vdh.seva, '') ILIKE pattern
                )
            END
        )
    ),
    
    matched_returning AS (
        SELECT DISTINCT
            cy.first_name,
            cy.last_name,
            cy.email,
            cy.phone,
            cy.seva as current_year_seva,
            cy.total,
            STRING_AGG(
                DISTINCT pv.year::TEXT || ' "' || pv.seva || '"', 
                '; ' ORDER BY pv.year::TEXT || ' "' || pv.seva || '"'
            ) as past_years_seva_details
        FROM current_year_volunteers cy
        INNER JOIN past_volunteers_with_seva pv ON (
            volunteers_match(cy.email, cy.phone, pv.email, pv.phone, p_email_similarity_threshold)
        )
        WHERE NOT EXISTS (
            SELECT 1 FROM unnest(p_seva_patterns) as pattern
            WHERE cy.seva ILIKE pattern
        )
        GROUP BY cy.first_name, cy.last_name, cy.email, cy.phone, cy.seva, cy.total
    )
    
    SELECT 
        mr.first_name,
        mr.last_name,
        mr.email,
        mr.phone,
        mr.current_year_seva,
        mr.total,
        mr.past_years_seva_details,
        'returning'::TEXT as volunteer_type
    FROM matched_returning mr
    ORDER BY mr.first_name, mr.last_name;
END;
$$ LANGUAGE plpgsql;

-- Function for new volunteers
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
    
    past_volunteers AS (
        SELECT DISTINCT
            LOWER(TRIM(vdh.email)) as email,
            normalize_phone(vdh.phone) as phone
        FROM volunteer_data_historical vdh
        WHERE vdh.year < p_current_year
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
        SELECT 1 FROM past_volunteers pv 
        WHERE volunteers_match(cy.email, cy.phone, pv.email, pv.phone, p_email_similarity_threshold)
    )
    ORDER BY cy.first_name, cy.last_name;
END;
$$ LANGUAGE plpgsql;

-- Function for inactive volunteers
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
    WITH current_year_volunteers AS (
        SELECT DISTINCT
            LOWER(TRIM(vdh.email)) as email,
            normalize_phone(vdh.phone) as phone
        FROM volunteer_data_historical vdh
        WHERE vdh.year = p_current_year
    ),
    
    past_volunteers_with_seva AS (
        SELECT DISTINCT
            COALESCE(vdh.first_name, '') as first_name,
            COALESCE(vdh.last_name, '') as last_name,
            LOWER(TRIM(vdh.email)) as email,
            normalize_phone(vdh.phone) as phone,
            vdh.year,
            COALESCE(vdh.seva, 'Unassigned') as seva
        FROM volunteer_data_historical vdh
        WHERE vdh.year < p_current_year
        AND (
            CASE 
                WHEN array_length(p_seva_patterns, 1) = 1 AND p_seva_patterns[1] = '%' THEN TRUE
                ELSE EXISTS (
                    SELECT 1 FROM unnest(p_seva_patterns) as pattern
                    WHERE COALESCE(vdh.seva, '') ILIKE pattern
                )
            END
        )
    ),
    
    inactive_volunteers AS (
        SELECT DISTINCT
            pv.first_name,
            pv.last_name,
            pv.email,
            pv.phone,
            STRING_AGG(
                DISTINCT pv.year::TEXT || ' "' || pv.seva || '"', 
                '; ' ORDER BY pv.year::TEXT || ' "' || pv.seva || '"'
            ) as past_years_seva_details
        FROM past_volunteers_with_seva pv
        WHERE NOT EXISTS (
            SELECT 1 FROM current_year_volunteers cy 
            WHERE volunteers_match(pv.email, pv.phone, cy.email, cy.phone, p_email_similarity_threshold)
        )
        GROUP BY pv.first_name, pv.last_name, pv.email, pv.phone
    )
    
    SELECT 
        iv.first_name,
        iv.last_name,
        iv.email,
        iv.phone,
        ''::TEXT as current_year_seva,
        0 as total,
        iv.past_years_seva_details,
        'inactive'::TEXT as volunteer_type
    FROM inactive_volunteers iv
    ORDER BY iv.first_name, iv.last_name;
END;
$$ LANGUAGE plpgsql;

-- Enable pg_trgm extension for similarity function if not already enabled
-- This is required for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_volunteer_data_historical_year 
ON volunteer_data_historical(year);

CREATE INDEX IF NOT EXISTS idx_volunteer_data_historical_email 
ON volunteer_data_historical(LOWER(TRIM(email)));

CREATE INDEX IF NOT EXISTS idx_volunteer_data_historical_seva 
ON volunteer_data_historical(seva);

CREATE INDEX IF NOT EXISTS idx_volunteer_data_historical_year_seva 
ON volunteer_data_historical(year, seva);

-- Grant execute permissions (adjust as needed for your security requirements)
GRANT EXECUTE ON FUNCTION normalize_phone(TEXT) TO PUBLIC;
GRANT EXECUTE ON FUNCTION volunteers_match(TEXT, TEXT, TEXT, TEXT, FLOAT) TO PUBLIC;
GRANT EXECUTE ON FUNCTION get_volunteer_retention_report(INTEGER, FLOAT, FLOAT, TEXT[], TEXT) TO PUBLIC;
GRANT EXECUTE ON FUNCTION get_returning_volunteers(INTEGER, FLOAT, FLOAT, TEXT[]) TO PUBLIC;
GRANT EXECUTE ON FUNCTION get_new_volunteers(INTEGER, FLOAT, FLOAT, TEXT[]) TO PUBLIC;
GRANT EXECUTE ON FUNCTION get_inactive_volunteers(INTEGER, FLOAT, FLOAT, TEXT[]) TO PUBLIC;