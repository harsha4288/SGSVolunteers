-- ========================================
-- COMPREHENSIVE DEBUG SCRIPT FOR get_new_volunteers FUNCTION
-- Date: June 24, 2025
-- Purpose: Systematically debug why get_new_volunteers returns 0 rows
-- ========================================

-- Step 1: Basic table information and data availability
-- ========================================

-- Check if the table exists and has data
SELECT 'Table exists and total row count' as check_type, COUNT(*) as count
FROM volunteer_data_historical;

-- Check years available in the data
SELECT 'Years available in data' as check_type, year, COUNT(*) as records_count
FROM volunteer_data_historical
GROUP BY year
ORDER BY year DESC;

-- Check if we have 2025 data specifically
SELECT '2025 data check' as check_type, COUNT(*) as count_2025
FROM volunteer_data_historical
WHERE year = 2025;

-- Check if we have pre-2025 data
SELECT 'Pre-2025 data check' as check_type, COUNT(*) as count_pre_2025
FROM volunteer_data_historical
WHERE year < 2025;

-- ========================================
-- Step 2: Sample data examination
-- ========================================

-- Sample 2025 records
SELECT 'Sample 2025 records' as section;
SELECT year, first_name, last_name, email, phone, seva, total
FROM volunteer_data_historical
WHERE year = 2025
LIMIT 10;

-- Sample pre-2025 records
SELECT 'Sample pre-2025 records' as section;
SELECT year, first_name, last_name, email, phone, seva, total
FROM volunteer_data_historical
WHERE year < 2025
LIMIT 10;

-- ========================================
-- Step 3: Test the current_year_volunteers CTE separately
-- ========================================

-- Test current_year_volunteers CTE logic
SELECT 'Testing current_year_volunteers CTE' as section;
WITH current_year_volunteers AS (
    SELECT DISTINCT
        COALESCE(vdh.first_name, '') as first_name,
        COALESCE(vdh.last_name, '') as last_name,
        LOWER(TRIM(vdh.email)) as email,
        normalize_phone(vdh.phone) as phone,
        COALESCE(vdh.seva, 'Unassigned') as seva,
        COALESCE(vdh.total, 0) as total
    FROM volunteer_data_historical vdh
    WHERE vdh.year = 2025
    AND (
        CASE 
            WHEN array_length(ARRAY['%'], 1) = 1 AND ARRAY['%'][1] = '%' THEN TRUE
            ELSE EXISTS (
                SELECT 1 FROM unnest(ARRAY['%']) as pattern
                WHERE COALESCE(vdh.seva, '') ILIKE pattern
            ) OR vdh.seva IS NULL
        END
    )
)
SELECT COUNT(*) as current_year_count
FROM current_year_volunteers;

-- Show actual current year volunteers
WITH current_year_volunteers AS (
    SELECT DISTINCT
        COALESCE(vdh.first_name, '') as first_name,
        COALESCE(vdh.last_name, '') as last_name,
        LOWER(TRIM(vdh.email)) as email,
        normalize_phone(vdh.phone) as phone,
        COALESCE(vdh.seva, 'Unassigned') as seva,
        COALESCE(vdh.total, 0) as total
    FROM volunteer_data_historical vdh
    WHERE vdh.year = 2025
)
SELECT 'First 10 current year volunteers' as section, *
FROM current_year_volunteers
LIMIT 10;

-- ========================================
-- Step 4: Test the past_volunteers CTE separately
-- ========================================

-- Test past_volunteers CTE logic
SELECT 'Testing past_volunteers CTE' as section;
WITH past_volunteers AS (
    SELECT DISTINCT
        LOWER(TRIM(vdh.email)) as email,
        normalize_phone(vdh.phone) as phone
    FROM volunteer_data_historical vdh
    WHERE vdh.year < 2025
)
SELECT COUNT(*) as past_volunteers_count
FROM past_volunteers;

-- Show sample past volunteers
WITH past_volunteers AS (
    SELECT DISTINCT
        LOWER(TRIM(vdh.email)) as email,
        normalize_phone(vdh.phone) as phone,
        MIN(vdh.year) as earliest_year,
        MAX(vdh.year) as latest_year
    FROM volunteer_data_historical vdh
    WHERE vdh.year < 2025
    GROUP BY LOWER(TRIM(vdh.email)), normalize_phone(vdh.phone)
)
SELECT 'First 10 past volunteers' as section, *
FROM past_volunteers
LIMIT 10;

-- ========================================
-- Step 5: Test volunteers_match function with sample data
-- ========================================

-- Test volunteers_match function with identical data
SELECT 'Testing volunteers_match with identical emails' as section,
       volunteers_match('test@example.com', '1234567890', 'test@example.com', '1234567890', 0.8) as should_be_true;

SELECT 'Testing volunteers_match with different emails' as section,
       volunteers_match('test1@example.com', '1234567890', 'test2@example.com', '0987654321', 0.8) as should_be_false;

-- Test with actual data from the database
WITH sample_current AS (
    SELECT DISTINCT
        LOWER(TRIM(email)) as email,
        normalize_phone(phone) as phone
    FROM volunteer_data_historical
    WHERE year = 2025
    LIMIT 5
),
sample_past AS (
    SELECT DISTINCT
        LOWER(TRIM(email)) as email,
        normalize_phone(phone) as phone
    FROM volunteer_data_historical
    WHERE year < 2025
    LIMIT 5
)
SELECT 'Testing volunteers_match with real data' as section,
       sc.email as current_email,
       sc.phone as current_phone,
       sp.email as past_email,
       sp.phone as past_phone,
       volunteers_match(sc.email, sc.phone, sp.email, sp.phone, 0.8) as match_result
FROM sample_current sc
CROSS JOIN sample_past sp
LIMIT 10;

-- ========================================
-- Step 6: Test the full get_new_volunteers logic step by step
-- ========================================

-- Full logic test with detailed output
SELECT 'Full get_new_volunteers logic test' as section;
WITH current_year_volunteers AS (
    SELECT DISTINCT
        COALESCE(vdh.first_name, '') as first_name,
        COALESCE(vdh.last_name, '') as last_name,
        LOWER(TRIM(vdh.email)) as email,
        normalize_phone(vdh.phone) as phone,
        COALESCE(vdh.seva, 'Unassigned') as seva,
        COALESCE(vdh.total, 0) as total
    FROM volunteer_data_historical vdh
    WHERE vdh.year = 2025
    AND (
        CASE 
            WHEN array_length(ARRAY['%'], 1) = 1 AND ARRAY['%'][1] = '%' THEN TRUE
            ELSE EXISTS (
                SELECT 1 FROM unnest(ARRAY['%']) as pattern
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
    WHERE vdh.year < 2025
),
potential_new AS (
    SELECT 
        cy.first_name,
        cy.last_name,
        cy.email,
        cy.phone,
        cy.seva as current_year_seva,
        cy.total,
        ''::TEXT as past_years_seva_details,
        'new'::TEXT as volunteer_type,
        -- Add debugging info
        EXISTS (
            SELECT 1 FROM past_volunteers pv 
            WHERE volunteers_match(cy.email, cy.phone, pv.email, pv.phone, 0.8)
        ) as has_past_match
    FROM current_year_volunteers cy
)
SELECT COUNT(*) as total_current_volunteers,
       COUNT(CASE WHEN has_past_match THEN 1 END) as with_past_matches,
       COUNT(CASE WHEN NOT has_past_match THEN 1 END) as truly_new_volunteers
FROM potential_new;

-- Show the actual volunteers classified as new
WITH current_year_volunteers AS (
    SELECT DISTINCT
        COALESCE(vdh.first_name, '') as first_name,
        COALESCE(vdh.last_name, '') as last_name,
        LOWER(TRIM(vdh.email)) as email,
        normalize_phone(vdh.phone) as phone,
        COALESCE(vdh.seva, 'Unassigned') as seva,
        COALESCE(vdh.total, 0) as total
    FROM volunteer_data_historical vdh
    WHERE vdh.year = 2025
),
past_volunteers AS (
    SELECT DISTINCT
        LOWER(TRIM(vdh.email)) as email,
        normalize_phone(vdh.phone) as phone
    FROM volunteer_data_historical vdh
    WHERE vdh.year < 2025
)
SELECT 'First 10 truly new volunteers' as section,
       cy.first_name,
       cy.last_name,
       cy.email,
       cy.phone,
       cy.seva as current_year_seva,
       cy.total
FROM current_year_volunteers cy
WHERE NOT EXISTS (
    SELECT 1 FROM past_volunteers pv 
    WHERE volunteers_match(cy.email, cy.phone, pv.email, pv.phone, 0.8)
)
LIMIT 10;

-- ========================================
-- Step 7: Check for specific edge cases
-- ========================================

-- Check for NULL or empty emails/phones in current year
SELECT 'Current year NULL/empty check' as section,
       COUNT(*) as total_records,
       COUNT(CASE WHEN email IS NULL OR TRIM(email) = '' THEN 1 END) as null_empty_emails,
       COUNT(CASE WHEN phone IS NULL OR TRIM(phone) = '' THEN 1 END) as null_empty_phones,
       COUNT(CASE WHEN (email IS NULL OR TRIM(email) = '') AND (phone IS NULL OR TRIM(phone) = '') THEN 1 END) as both_null_empty
FROM volunteer_data_historical
WHERE year = 2025;

-- Check for NULL or empty emails/phones in past years
SELECT 'Past years NULL/empty check' as section,
       COUNT(*) as total_records,
       COUNT(CASE WHEN email IS NULL OR TRIM(email) = '' THEN 1 END) as null_empty_emails,
       COUNT(CASE WHEN phone IS NULL OR TRIM(phone) = '' THEN 1 END) as null_empty_phones,
       COUNT(CASE WHEN (email IS NULL OR TRIM(email) = '') AND (phone IS NULL OR TRIM(phone) = '') THEN 1 END) as both_null_empty
FROM volunteer_data_historical
WHERE year < 2025;

-- Check if similarity function is working
SELECT 'Similarity function test' as section,
       similarity('test@example.com', 'test@example.com') as identical_similarity,
       similarity('test@example.com', 'Test@Example.Com') as case_different_similarity,
       similarity('test@example.com', 'different@example.com') as different_similarity;

-- ========================================
-- Step 8: Compare with a simplified approach
-- ========================================

-- Simplified new volunteers check without complex CTE logic
SELECT 'Simplified new volunteers check' as section;

SELECT COUNT(*) as simplified_new_count
FROM volunteer_data_historical curr
WHERE curr.year = 2025
AND NOT EXISTS (
    SELECT 1 FROM volunteer_data_historical past
    WHERE past.year < 2025
    AND (
        (LOWER(TRIM(curr.email)) = LOWER(TRIM(past.email)) AND curr.email IS NOT NULL AND past.email IS NOT NULL)
        OR 
        (normalize_phone(curr.phone) = normalize_phone(past.phone) 
         AND curr.phone IS NOT NULL AND past.phone IS NOT NULL 
         AND LENGTH(normalize_phone(curr.phone)) >= 10)
    )
);

-- Show sample simplified new volunteers
SELECT 'Sample simplified new volunteers' as section,
       curr.first_name, curr.last_name, curr.email, curr.phone, curr.seva
FROM volunteer_data_historical curr
WHERE curr.year = 2025
AND NOT EXISTS (
    SELECT 1 FROM volunteer_data_historical past
    WHERE past.year < 2025
    AND (
        (LOWER(TRIM(curr.email)) = LOWER(TRIM(past.email)) AND curr.email IS NOT NULL AND past.email IS NOT NULL)
        OR 
        (normalize_phone(curr.phone) = normalize_phone(past.phone) 
         AND curr.phone IS NOT NULL AND past.phone IS NOT NULL 
         AND LENGTH(normalize_phone(curr.phone)) >= 10)
    )
)
LIMIT 10;