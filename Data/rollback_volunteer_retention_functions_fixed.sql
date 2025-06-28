-- ---------------------------------------------------------------------------
-- Rollback Script for volunteer_retention_report_functions_fixed.sql
-- Version: 2.0
-- Date: June 25, 2025
-- 
-- This script removes all functions created by volunteer_retention_report_functions_fixed.sql
-- ---------------------------------------------------------------------------

-- Drop all functions created in the _fixed.sql file
DROP FUNCTION IF EXISTS test_normalize_phone();
DROP FUNCTION IF EXISTS get_new_volunteers_fixed(INTEGER, FLOAT, FLOAT, TEXT[]);
DROP FUNCTION IF EXISTS get_new_volunteers_simple(INTEGER, FLOAT, FLOAT, TEXT[]);
DROP FUNCTION IF EXISTS get_new_volunteers_optimized(INTEGER, FLOAT, FLOAT, TEXT[]);
DROP FUNCTION IF EXISTS volunteers_match_simple(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS normalize_phone(TEXT);

-- Note: The _fixed.sql file may have created additional indexes or extensions
-- Check the original file for any CREATE INDEX statements and add them here if needed

-- Revoke permissions for the fixed functions
REVOKE ALL ON FUNCTION test_normalize_phone() FROM PUBLIC;
REVOKE ALL ON FUNCTION get_new_volunteers_fixed(INTEGER, FLOAT, FLOAT, TEXT[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION get_new_volunteers_simple(INTEGER, FLOAT, FLOAT, TEXT[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION get_new_volunteers_optimized(INTEGER, FLOAT, FLOAT, TEXT[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION volunteers_match_simple(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION normalize_phone(TEXT) FROM PUBLIC;

-- Verify cleanup by listing any remaining functions from the fixed version
SELECT 
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc 
WHERE proname IN (
    'normalize_phone',
    'volunteers_match_simple', 
    'get_new_volunteers_optimized',
    'get_new_volunteers_simple',
    'get_new_volunteers_fixed',
    'test_normalize_phone'
);

-- Show completion message
SELECT 'Rollback completed. All functions from volunteer_retention_report_functions_fixed.sql have been removed.' AS status;