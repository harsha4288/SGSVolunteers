import psycopg2
import sys

# Database connection details
host = "db.itnuxwdxpzdjlfwlvjyz.supabase.co"
port = 5432
database = "postgres"
user = "postgres"
password = "W6gTwafhvfJ8.4?"

def run_debug_queries():
    """Run comprehensive debugging queries for get_new_volunteers function"""
    
    try:
        # Connect to database
        conn_str = f"postgresql://{user}:{password}@{host}:{port}/{database}"
        conn = psycopg2.connect(conn_str)
        cur = conn.cursor()
        print("✅ Connected to database successfully!")
        
        # Basic data checks
        print("\n" + "="*60)
        print("BASIC DATA CHECKS")
        print("="*60)
        
        queries = [
            ("Total records", "SELECT COUNT(*) as total_records FROM volunteer_data_historical;"),
            ("Years available", "SELECT year, COUNT(*) as records_count FROM volunteer_data_historical GROUP BY year ORDER BY year DESC;"),
            ("2025 records", "SELECT COUNT(*) as count_2025 FROM volunteer_data_historical WHERE year = 2025;"),
            ("Pre-2025 records", "SELECT COUNT(*) as count_pre_2025 FROM volunteer_data_historical WHERE year < 2025;")
        ]
        
        for name, query in queries:
            print(f"\n--- {name} ---")
            cur.execute(query)
            results = cur.fetchall()
            colnames = [desc[0] for desc in cur.description]
            print(f"Columns: {colnames}")
            for row in results:
                print(row)
        
        # Sample data examination
        print("\n" + "="*60)
        print("SAMPLE DATA EXAMINATION")
        print("="*60)
        
        print("\n--- Sample 2025 records ---")
        cur.execute("""
            SELECT year, first_name, last_name, email, phone, seva, total
            FROM volunteer_data_historical
            WHERE year = 2025
            LIMIT 5;
        """)
        if cur.description:
            results = cur.fetchall()
            colnames = [desc[0] for desc in cur.description]
            print(f"Columns: {colnames}")
            for row in results:
                print(row)
        
        print("\n--- Sample pre-2025 records ---")
        cur.execute("""
            SELECT year, first_name, last_name, email, phone, seva, total
            FROM volunteer_data_historical
            WHERE year < 2025
            LIMIT 5;
        """)
        if cur.description:
            results = cur.fetchall()
            colnames = [desc[0] for desc in cur.description]
            print(f"Columns: {colnames}")
            for row in results:
                print(row)
        
        # Test current_year_volunteers CTE
        print("\n" + "="*60)
        print("TESTING CURRENT_YEAR_VOLUNTEERS CTE")
        print("="*60)
        
        cur.execute("""
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
            SELECT COUNT(*) as current_year_count
            FROM current_year_volunteers;
        """)
        result = cur.fetchone()
        print(f"Current year volunteers count: {result[0]}")
        
        # Test past_volunteers CTE
        print("\n--- Testing past_volunteers CTE ---")
        cur.execute("""
            WITH past_volunteers AS (
                SELECT DISTINCT
                    LOWER(TRIM(vdh.email)) as email,
                    normalize_phone(vdh.phone) as phone
                FROM volunteer_data_historical vdh
                WHERE vdh.year < 2025
            )
            SELECT COUNT(*) as past_volunteers_count
            FROM past_volunteers;
        """)
        result = cur.fetchone()
        print(f"Past volunteers count: {result[0]}")
        
        # Test volunteers_match function
        print("\n" + "="*60)
        print("TESTING VOLUNTEERS_MATCH FUNCTION")
        print("="*60)
        
        test_queries = [
            ("Identical emails", "SELECT volunteers_match('test@example.com', '1234567890', 'test@example.com', '1234567890', 0.8) as should_be_true;"),
            ("Different emails", "SELECT volunteers_match('test1@example.com', '1234567890', 'test2@example.com', '0987654321', 0.8) as should_be_false;"),
            ("Case different", "SELECT volunteers_match('test@example.com', '1234567890', 'TEST@EXAMPLE.COM', '1234567890', 0.8) as should_be_true;")
        ]
        
        for name, query in test_queries:
            print(f"\n--- {name} ---")
            cur.execute(query)
            result = cur.fetchone()
            print(f"Result: {result[0]}")
        
        # Test full get_new_volunteers logic
        print("\n" + "="*60)
        print("TESTING FULL GET_NEW_VOLUNTEERS LOGIC")
        print("="*60)
        
        cur.execute("""
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
            ),
            potential_new AS (
                SELECT 
                    cy.first_name,
                    cy.last_name,
                    cy.email,
                    cy.phone,
                    cy.seva as current_year_seva,
                    cy.total,
                    EXISTS (
                        SELECT 1 FROM past_volunteers pv 
                        WHERE volunteers_match(cy.email, cy.phone, pv.email, pv.phone, 0.8)
                    ) as has_past_match
                FROM current_year_volunteers cy
            )
            SELECT 
                COUNT(*) as total_current_volunteers,
                COUNT(CASE WHEN has_past_match THEN 1 END) as with_past_matches,
                COUNT(CASE WHEN NOT has_past_match THEN 1 END) as truly_new_volunteers
            FROM potential_new;
        """)
        
        result = cur.fetchone()
        print(f"Total current volunteers: {result[0]}")
        print(f"With past matches: {result[1]}")
        print(f"Truly new volunteers: {result[2]}")
        
        # Test actual get_new_volunteers function
        print("\n--- Testing actual get_new_volunteers function ---")
        cur.execute("SELECT COUNT(*) FROM get_new_volunteers(2025);")
        result = cur.fetchone()
        print(f"get_new_volunteers function result count: {result[0]}")
        
        # Show sample new volunteers if any
        if result[0] > 0:
            print("\n--- Sample new volunteers ---")
            cur.execute("SELECT * FROM get_new_volunteers(2025) LIMIT 5;")
            results = cur.fetchall()
            colnames = [desc[0] for desc in cur.description]
            print(f"Columns: {colnames}")
            for row in results:
                print(row)
        
        # Check for data quality issues
        print("\n" + "="*60)
        print("DATA QUALITY CHECKS")
        print("="*60)
        
        # Check for NULL/empty emails and phones in current year
        cur.execute("""
            SELECT 
                COUNT(*) as total_records,
                COUNT(CASE WHEN email IS NULL OR TRIM(email) = '' THEN 1 END) as null_empty_emails,
                COUNT(CASE WHEN phone IS NULL OR TRIM(phone) = '' THEN 1 END) as null_empty_phones,
                COUNT(CASE WHEN (email IS NULL OR TRIM(email) = '') AND (phone IS NULL OR TRIM(phone) = '') THEN 1 END) as both_null_empty
            FROM volunteer_data_historical
            WHERE year = 2025;
        """)
        result = cur.fetchone()
        print(f"2025 data quality - Total: {result[0]}, NULL/empty emails: {result[1]}, NULL/empty phones: {result[2]}, Both NULL/empty: {result[3]}")
        
        # Check for NULL/empty emails and phones in past years
        cur.execute("""
            SELECT 
                COUNT(*) as total_records,
                COUNT(CASE WHEN email IS NULL OR TRIM(email) = '' THEN 1 END) as null_empty_emails,
                COUNT(CASE WHEN phone IS NULL OR TRIM(phone) = '' THEN 1 END) as null_empty_phones,
                COUNT(CASE WHEN (email IS NULL OR TRIM(email) = '') AND (phone IS NULL OR TRIM(phone) = '') THEN 1 END) as both_null_empty
            FROM volunteer_data_historical
            WHERE year < 2025;
        """)
        result = cur.fetchone()
        print(f"Pre-2025 data quality - Total: {result[0]}, NULL/empty emails: {result[1]}, NULL/empty phones: {result[2]}, Both NULL/empty: {result[3]}")
        
        # Simplified approach test
        print("\n" + "="*60)
        print("SIMPLIFIED APPROACH TEST")
        print("="*60)
        
        cur.execute("""
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
        """)
        result = cur.fetchone()
        print(f"Simplified new volunteers count: {result[0]}")
        
        if result[0] > 0:
            print("\n--- Sample simplified new volunteers ---")
            cur.execute("""
                SELECT curr.first_name, curr.last_name, curr.email, curr.phone, curr.seva
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
                LIMIT 5;
            """)
            results = cur.fetchall()
            colnames = [desc[0] for desc in cur.description]
            print(f"Columns: {colnames}")
            for row in results:
                print(row)
        
        print("\n" + "="*60)
        print("DEBUG COMPLETE")
        print("="*60)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if 'conn' in locals():
            conn.close()
            print("Connection closed.")

if __name__ == "__main__":
    run_debug_queries()