-- Comprehensive debugging script for get_new_volunteers function
-- Run each section separately to investigate the issue

-- ============================================================
-- 1. Overall data summary
-- ============================================================
SELECT 'Overall Data Summary' as test_name;
SELECT COUNT(*) as total_records,
       MIN(year) as min_year,
       MAX(year) as max_year,
       COUNT(DISTINCT year) as unique_years
FROM volunteer_data_historical;

-- ============================================================
-- 2. Records count by year
-- ============================================================
SELECT 'Records Count by Year' as test_name;
SELECT year, COUNT(*) as record_count
FROM volunteer_data_historical
GROUP BY year
ORDER BY year;

-- ============================================================
-- 3. 2025 records summary
-- ============================================================
SELECT '2025 Records Summary' as test_name;
SELECT COUNT(*) as count_2025,
       COUNT(DISTINCT email) as unique_emails_2025,
       COUNT(DISTINCT phone) as unique_phones_2025,
       COUNT(DISTINCT CONCAT(first_name, last_name)) as unique_names_2025
FROM volunteer_data_historical
WHERE year = 2025;

-- ============================================================
-- 4. Sample 2025 records
-- ============================================================
SELECT 'Sample 2025 Records' as test_name;
SELECT first_name, last_name, email, phone, seva, total, year
FROM volunteer_data_historical
WHERE year = 2025
ORDER BY first_name, last_name
LIMIT 10;

-- ============================================================
-- 5. Records before 2025 summary
-- ============================================================
SELECT 'Records Before 2025 Summary' as test_name;
SELECT COUNT(*) as count_before_2025,
       COUNT(DISTINCT email) as unique_emails_before_2025,
       COUNT(DISTINCT phone) as unique_phones_before_2025,
       COUNT(DISTINCT CONCAT(first_name, last_name)) as unique_names_before_2025
FROM volunteer_data_historical
WHERE year < 2025;

-- ============================================================
-- 6. Sample records from previous years
-- ============================================================
SELECT 'Sample Records from Previous Years' as test_name;
SELECT first_name, last_name, email, phone, seva, total, year
FROM volunteer_data_historical
WHERE year < 2025
ORDER BY year DESC, first_name, last_name
LIMIT 10;

-- ============================================================
-- 7. Testing current_year_volunteers CTE count
-- ============================================================
SELECT 'Current Year Volunteers CTE Count' as test_name;
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

-- ============================================================
-- 8. Testing past_volunteers CTE count
-- ============================================================
SELECT 'Past Volunteers CTE Count' as test_name;
WITH past_volunteers AS (
    SELECT DISTINCT
        LOWER(TRIM(vdh.email)) as email,
        normalize_phone(vdh.phone) as phone
    FROM volunteer_data_historical vdh
    WHERE vdh.year < 2025
)
SELECT COUNT(*) as past_volunteers_count
FROM past_volunteers;

-- ============================================================
-- 9. Testing volunteers_match function - TRUE case
-- ============================================================
SELECT 'Testing volunteers_match - TRUE case' as test_name;
SELECT volunteers_match('test@example.com', '123-456-7890', 'test@example.com', '1234567890', 0.8) as match_result;

-- ============================================================
-- 10. Testing volunteers_match function - FALSE case
-- ============================================================
SELECT 'Testing volunteers_match - FALSE case' as test_name;
SELECT volunteers_match('test1@example.com', '123-456-7890', 'test2@example.com', '987-654-3210', 0.8) as match_result;

-- ============================================================
-- 11. Testing get_new_volunteers function count
-- ============================================================
SELECT 'Get New Volunteers Function Count' as test_name;
SELECT COUNT(*) as new_volunteers_count
FROM get_new_volunteers(2025, 0.8, 0.8, ARRAY['%']);

-- ============================================================
-- 12. Sample results from get_new_volunteers
-- ============================================================
SELECT 'Sample Results from get_new_volunteers' as test_name;
SELECT *
FROM get_new_volunteers(2025, 0.8, 0.8, ARRAY['%'])
LIMIT 10;

-- ============================================================
-- 13. Check for NULL values in 2025 data
-- ============================================================
SELECT 'NULL Values in 2025 Data' as test_name;
SELECT 
    COUNT(*) as total_2025,
    COUNT(CASE WHEN email IS NULL THEN 1 END) as null_emails,
    COUNT(CASE WHEN phone IS NULL THEN 1 END) as null_phones,
    COUNT(CASE WHEN first_name IS NULL THEN 1 END) as null_first_names,
    COUNT(CASE WHEN seva IS NULL THEN 1 END) as null_seva
FROM volunteer_data_historical
WHERE year = 2025;

-- ============================================================
-- 14. Check for empty values in 2025 data
-- ============================================================
SELECT 'Empty Values in 2025 Data' as test_name;
SELECT 
    COUNT(*) as total_2025,
    COUNT(CASE WHEN TRIM(COALESCE(email, '')) = '' THEN 1 END) as empty_emails,
    COUNT(CASE WHEN TRIM(COALESCE(phone, '')) = '' THEN 1 END) as empty_phones,
    COUNT(CASE WHEN TRIM(COALESCE(first_name, '')) = '' THEN 1 END) as empty_first_names
FROM volunteer_data_historical
WHERE year = 2025;

-- ============================================================
-- 15. Testing normalize_phone function
-- ============================================================
SELECT 'Testing normalize_phone Function' as test_name;
SELECT phone, normalize_phone(phone) as normalized_phone
FROM volunteer_data_historical
WHERE year = 2025 AND phone IS NOT NULL
LIMIT 10;

-- ============================================================
-- 16. Testing email normalization
-- ============================================================
SELECT 'Testing Email Normalization' as test_name;
SELECT email, LOWER(TRIM(email)) as normalized_email
FROM volunteer_data_historical
WHERE year = 2025 AND email IS NOT NULL
LIMIT 10;

-- ============================================================
-- 17. Cross-check: Find any matches between 2025 and previous years
-- ============================================================
SELECT 'Cross-check: Matches between 2025 and previous years' as test_name;
WITH current_year_sample AS (
    SELECT DISTINCT
        first_name, last_name,
        LOWER(TRIM(email)) as email,
        normalize_phone(phone) as phone
    FROM volunteer_data_historical
    WHERE year = 2025
    LIMIT 5
),
past_volunteers AS (
    SELECT DISTINCT
        first_name, last_name,
        LOWER(TRIM(email)) as email,
        normalize_phone(phone) as phone,
        year
    FROM volunteer_data_historical
    WHERE year < 2025
)
SELECT 
    cy.first_name as current_first,
    cy.last_name as current_last,
    cy.email as current_email,
    cy.phone as current_phone,
    pv.first_name as past_first,
    pv.last_name as past_last,
    pv.email as past_email,
    pv.phone as past_phone,
    pv.year as past_year,
    volunteers_match(cy.email, cy.phone, pv.email, pv.phone, 0.8) as is_match
FROM current_year_sample cy
CROSS JOIN past_volunteers pv
WHERE volunteers_match(cy.email, cy.phone, pv.email, pv.phone, 0.8) = TRUE
LIMIT 10;

-- ============================================================
-- 18. Simplified new volunteers check (manual logic)
-- ============================================================
SELECT 'Simplified New Volunteers Check' as test_name;
WITH current_volunteers AS (
    SELECT DISTINCT
        first_name, last_name,
        LOWER(TRIM(email)) as email,
        normalize_phone(phone) as phone,
        seva
    FROM volunteer_data_historical
    WHERE year = 2025
    LIMIT 10
)
SELECT 
    cv.*,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM volunteer_data_historical vdh
            WHERE vdh.year < 2025
            AND (
                (LOWER(TRIM(vdh.email)) = cv.email AND cv.email IS NOT NULL AND cv.email != '')
                OR 
                (normalize_phone(vdh.phone) = cv.phone AND cv.phone IS NOT NULL AND LENGTH(cv.phone) >= 10)
            )
        ) THEN 'RETURNING'
        ELSE 'NEW'
    END as volunteer_status
FROM current_volunteers cv;

-- ============================================================
-- 19. Check if there are any actual new volunteers by manual inspection
-- ============================================================
SELECT 'Manual New Volunteers Check' as test_name;
SELECT 
    v2025.first_name,
    v2025.last_name,
    v2025.email,
    v2025.phone,
    v2025.seva,
    COUNT(vpast.email) as past_matches_by_email,
    COUNT(vpast.phone) as past_matches_by_phone
FROM volunteer_data_historical v2025
LEFT JOIN volunteer_data_historical vpast ON (
    vpast.year < 2025 
    AND (
        LOWER(TRIM(vpast.email)) = LOWER(TRIM(v2025.email))
        OR normalize_phone(vpast.phone) = normalize_phone(v2025.phone)
    )
)
WHERE v2025.year = 2025
GROUP BY v2025.first_name, v2025.last_name, v2025.email, v2025.phone, v2025.seva
HAVING COUNT(vpast.email) = 0 AND COUNT(vpast.phone) = 0
LIMIT 10;

-- ============================================================
-- 20. Final debug: Step through the exact function logic
-- ============================================================
SELECT 'Final Debug: Step through exact function logic' as test_name;
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
final_results AS (
    SELECT 
        cy.first_name,
        cy.last_name,
        cy.email,
        cy.phone,
        cy.seva as current_year_seva,
        cy.total,
        ''::TEXT as past_years_seva_details,
        'new'::TEXT as volunteer_type,
        EXISTS (
            SELECT 1 FROM past_volunteers pv 
            WHERE volunteers_match(cy.email, cy.phone, pv.email, pv.phone, 0.8)
        ) as has_past_match
    FROM current_year_volunteers cy
)
SELECT 
    COUNT(*) as total_current_volunteers,
    COUNT(CASE WHEN has_past_match = FALSE THEN 1 END) as truly_new_volunteers,
    COUNT(CASE WHEN has_past_match = TRUE THEN 1 END) as returning_volunteers
FROM final_results;