-- ---------------------------------------------------------------------------
-- Rollback Script for Volunteer Retention Report Functions
-- Version: 1.0
-- Date: June 24, 2025
-- 
-- This script removes all functions, indexes, and extensions created by
-- volunteer_retention_report_functions.sql
-- ---------------------------------------------------------------------------

-- Drop all functions in reverse order of dependencies
DROP FUNCTION IF EXISTS get_inactive_volunteers(INTEGER, FLOAT, FLOAT, TEXT[]);
DROP FUNCTION IF EXISTS get_new_volunteers(INTEGER, FLOAT, FLOAT, TEXT[]);
DROP FUNCTION IF EXISTS get_returning_volunteers(INTEGER, FLOAT, FLOAT, TEXT[]);
DROP FUNCTION IF EXISTS get_volunteer_retention_report(INTEGER, FLOAT, FLOAT, TEXT[], TEXT);
DROP FUNCTION IF EXISTS volunteers_match(TEXT, TEXT, TEXT, TEXT, FLOAT);
DROP FUNCTION IF EXISTS normalize_phone(TEXT);

-- Drop indexes (only if they were created by our script)
DROP INDEX IF EXISTS idx_volunteer_data_historical_year_seva;
DROP INDEX IF EXISTS idx_volunteer_data_historical_seva;
DROP INDEX IF EXISTS idx_volunteer_data_historical_email;
DROP INDEX IF EXISTS idx_volunteer_data_historical_year;

-- Note: We don't drop pg_trgm extension as it might be used by other parts of the system
-- If you need to remove it and are sure it's safe, uncomment the line below:
-- DROP EXTENSION IF EXISTS pg_trgm;

-- Revoke permissions (optional, as dropping functions removes them anyway)
-- This is just for completeness
REVOKE ALL ON FUNCTION normalize_phone(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION volunteers_match(TEXT, TEXT, TEXT, TEXT, FLOAT) FROM PUBLIC;
REVOKE ALL ON FUNCTION get_volunteer_retention_report(INTEGER, FLOAT, FLOAT, TEXT[], TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION get_returning_volunteers(INTEGER, FLOAT, FLOAT, TEXT[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION get_new_volunteers(INTEGER, FLOAT, FLOAT, TEXT[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION get_inactive_volunteers(INTEGER, FLOAT, FLOAT, TEXT[]) FROM PUBLIC;

-- Verify cleanup by listing any remaining functions with similar names
-- This query will show if any functions still exist (should return empty)
SELECT 
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc 
WHERE proname ILIKE '%volunteer%' 
   OR proname ILIKE '%retention%'
   OR proname = 'normalize_phone'
   OR proname = 'volunteers_match';

-- Show message
SELECT 'Rollback completed. All volunteer retention functions and related objects have been removed.' AS status;