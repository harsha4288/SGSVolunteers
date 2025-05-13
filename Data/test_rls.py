import psycopg2
import json

# Database connection details
host = "db.itnuxwdxpzdjlfwlvjyz.supabase.co"
port = 5432
database = "postgres"
user = "postgres"
password = "W6gTwafhvfJ8.4?"

conn_str = f"postgresql://{user}:{password}@{host}:{port}/{database}"

def check_table_rls(cursor, table_name):
    """Check if RLS is enabled for a table and what policies exist"""
    print(f"\n--- Checking RLS for table: {table_name} ---")
    
    # Check if RLS is enabled
    cursor.execute(f"""
        SELECT relrowsecurity 
        FROM pg_class 
        WHERE relname = '{table_name}' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    """)
    result = cursor.fetchone()
    
    if not result:
        print(f"Table {table_name} not found")
        return
    
    rls_enabled = result[0]
    print(f"RLS enabled: {rls_enabled}")
    
    # Check policies
    cursor.execute(f"""
        SELECT polname, polpermissive, polroles::text, polcmd, polqual::text
        FROM pg_policy
        WHERE polrelid = (SELECT oid FROM pg_class WHERE relname = '{table_name}' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'))
    """)
    
    policies = cursor.fetchall()
    if not policies:
        print("No policies defined for this table")
    else:
        print(f"Found {len(policies)} policies:")
        for policy in policies:
            print(f"  - Name: {policy[0]}")
            print(f"    Permissive: {policy[1]}")
            print(f"    Roles: {policy[2]}")
            print(f"    Command: {policy[3]}")
            print(f"    Using expression: {policy[4]}")
            print("")

def test_table_access(cursor, table_name):
    """Test if we can access data in the table"""
    print(f"\n--- Testing access to table: {table_name} ---")
    try:
        cursor.execute(f"SELECT * FROM public.{table_name} LIMIT 5")
        rows = cursor.fetchall()
        print(f"Successfully retrieved {len(rows)} rows")
        if rows:
            # Get column names
            col_names = [desc[0] for desc in cursor.description]
            # Print first row as JSON
            if len(rows) > 0:
                row_dict = {col_names[i]: value for i, value in enumerate(rows[0])}
                print(f"Sample row: {json.dumps(row_dict, default=str, indent=2)}")
    except Exception as e:
        print(f"Error accessing table: {e}")

def main():
    try:
        print("Connecting to Supabase...")
        conn = psycopg2.connect(conn_str)
        print("✅ Connected successfully!")
        
        cursor = conn.cursor()
        
        # List of tables to check
        tables = [
            "events",
            "profiles",
            "volunteers",
            "time_slots",
            "seva_categories",
            "volunteer_commitments",
            "roles",
            "profile_roles",
            "tshirt_sizes",
            "tshirt_inventory",
            "tshirt_issuances",
            "volunteer_check_ins"
        ]
        
        # Check RLS and test access for each table
        for table in tables:
            check_table_rls(cursor, table)
            test_table_access(cursor, table)
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if 'conn' in locals() and conn:
            conn.close()
            print("\nConnection closed.")

if __name__ == "__main__":
    main()
