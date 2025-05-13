import psycopg2
import argparse

# Database connection details
host = "db.itnuxwdxpzdjlfwlvjyz.supabase.co"
port = 5432
database = "postgres"
user = "postgres"
password = "W6gTwafhvfJ8.4?"

conn_str = f"postgresql://{user}:{password}@{host}:{port}/{database}"

def get_tables(cursor):
    """Get all tables in the public schema"""
    cursor.execute("""
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    """)
    return [row[0] for row in cursor.fetchall()]

def toggle_rls(cursor, table_name, enable=True):
    """Enable or disable RLS for a table"""
    action = "ENABLE" if enable else "DISABLE"
    try:
        cursor.execute(f"ALTER TABLE public.{table_name} {action} ROW LEVEL SECURITY;")
        return True
    except Exception as e:
        print(f"Error toggling RLS for {table_name}: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Toggle Row Level Security (RLS) for Supabase tables')
    parser.add_argument('--enable', action='store_true', help='Enable RLS (default is to disable)')
    parser.add_argument('--table', type=str, help='Specific table to modify (default is all tables)')
    args = parser.parse_args()
    
    enable_rls = args.enable
    specific_table = args.table
    
    action_word = "Enabling" if enable_rls else "Disabling"
    
    try:
        print(f"Connecting to Supabase...")
        conn = psycopg2.connect(conn_str)
        conn.autocommit = True  # Important for DDL operations
        print("✅ Connected successfully!")
        
        cursor = conn.cursor()
        
        if specific_table:
            tables = [specific_table]
            print(f"{action_word} RLS for table: {specific_table}")
        else:
            tables = get_tables(cursor)
            print(f"{action_word} RLS for all tables in the public schema")
        
        success_count = 0
        for table in tables:
            print(f"  - {table}: ", end="")
            if toggle_rls(cursor, table, enable_rls):
                print("✅ Success")
                success_count += 1
            else:
                print("❌ Failed")
        
        print(f"\n{action_word} RLS completed. {success_count}/{len(tables)} tables processed successfully.")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if 'conn' in locals() and conn:
            conn.close()
            print("Connection closed.")

if __name__ == "__main__":
    main()
