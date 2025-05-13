import psycopg2

host = "db.itnuxwdxpzdjlfwlvjyz.supabase.co"
port = 5432
database = "postgres"
user = "postgres"
password = "W6gTwafhvfJ8.4?"

conn_str = f"postgresql://{user}:{password}@{host}:{port}/{database}"

print("Connecting to Supabase...")
conn = psycopg2.connect(conn_str)
print("✅ Connected successfully!")

conn.close()
print("Connection closed.")
