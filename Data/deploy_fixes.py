from supabase import create_client, Client

SUPABASE_URL = 'https://itnuxwdxpzdjlfwlvjyz.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0bnV4d2R4cHpkamxmd2x2anl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4NDk0NTUsImV4cCI6MjA2MjQyNTQ1NX0.2YXD8rjFdAq4jGIHihya60QD_h3PsBB2m17SGBU0Hes'

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def deploy_fixes():
    """Deploy the fixed functions to the database"""
    
    print("=" * 80)
    print("DEPLOYING FIXED FUNCTIONS")
    print("=" * 80)
    
    # Read the SQL file and split into individual statements
    try:
        with open('volunteer_retention_report_functions_fixed.sql', 'r') as f:
            sql_content = f.read()
        
        print("✅ SQL file loaded successfully")
        
        # Split by function definitions and execute each
        functions = [
            """
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
            """,
            
            """
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
            """,
            
            """
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
            """,
            
            """
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
            """
        ]
        
        # Note: Supabase doesn't allow direct SQL execution via the client
        # We'll need to use a different approach
        print("⚠️  Note: Cannot execute raw SQL via Supabase client")
        print("Please run the SQL file manually in your database or use a SQL client")
        print("\nAlternatively, testing with existing functions...")
        
        # Test if the functions are already deployed
        try:
            result = supabase.rpc('test_normalize_phone').execute()
            print("✅ test_normalize_phone function is available")
            
            if result.data:
                print("normalize_phone test results:")
                for row in result.data:
                    print(f"  Input: '{row['input']}' -> Output: '{row['output']}'")
        except Exception as e:
            print(f"❌ test_normalize_phone function not available: {e}")
        
        try:
            result = supabase.rpc('get_new_volunteers_simple', {'p_current_year': 2025}).execute()
            print("✅ get_new_volunteers_simple function is available")
            print(f"   Returned {len(result.data) if result.data else 0} volunteers")
        except Exception as e:
            print(f"❌ get_new_volunteers_simple function not available: {e}")
        
        try:
            result = supabase.rpc('volunteers_match_simple', {
                'email1': 'test@example.com',
                'phone1': '1234567890',
                'email2': 'test@example.com',
                'phone2': '0987654321'
            }).execute()
            print("✅ volunteers_match_simple function is available")
            print(f"   Test result: {result.data}")
        except Exception as e:
            print(f"❌ volunteers_match_simple function not available: {e}")
        
        print("\n" + "=" * 60)
        print("DEPLOYMENT STATUS")
        print("=" * 60)
        print("To deploy the fixes, please:")
        print("1. Copy the contents of 'volunteer_retention_report_functions_fixed.sql'")
        print("2. Run it in your Supabase SQL editor or pgAdmin")
        print("3. Then run the test script to verify the fixes")
        
    except Exception as e:
        print(f"❌ Error during deployment: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    deploy_fixes()