#!/usr/bin/env python3
"""
Simple script to run SQL queries and display results
"""

import subprocess
import sys

def run_psql_query(query):
    """Run a PostgreSQL query using psql command"""
    try:
        # Run the query using psql
        result = subprocess.run([
            'psql', 
            '-h', 'localhost',
            '-U', 'postgres',
            '-d', 'sgs_volunteers_db',
            '-c', query
        ], capture_output=True, text=True, input='postgres\n')
        
        if result.returncode == 0:
            return result.stdout
        else:
            return f"ERROR: {result.stderr}"
    except Exception as e:
        return f"EXCEPTION: {e}"

def main():
    # Basic queries to debug the issue
    queries = [
        # 1. Overall data summary
        ("Overall Data Summary", """
        SELECT COUNT(*) as total_records,
               MIN(year) as min_year,
               MAX(year) as max_year,
               COUNT(DISTINCT year) as unique_years
        FROM volunteer_data_historical;
        """),
        
        # 2. Records by year
        ("Records by Year", """
        SELECT year, COUNT(*) as record_count
        FROM volunteer_data_historical
        GROUP BY year
        ORDER BY year;
        """),
        
        # 3. 2025 records
        ("2025 Records Count", """
        SELECT COUNT(*) as count_2025
        FROM volunteer_data_historical
        WHERE year = 2025;
        """),
        
        # 4. Previous years records
        ("Previous Years Records Count", """
        SELECT COUNT(*) as count_before_2025
        FROM volunteer_data_historical
        WHERE year < 2025;
        """),
        
        # 5. Test the get_new_volunteers function
        ("Get New Volunteers Count", """
        SELECT COUNT(*) as new_volunteers_count
        FROM get_new_volunteers(2025, 0.8, 0.8, ARRAY['%']);
        """),
        
        # 6. Sample 2025 data
        ("Sample 2025 Data", """
        SELECT first_name, last_name, email, phone, seva, year
        FROM volunteer_data_historical
        WHERE year = 2025
        LIMIT 5;
        """),
        
        # 7. Sample previous years data
        ("Sample Previous Years Data", """
        SELECT first_name, last_name, email, phone, seva, year
        FROM volunteer_data_historical
        WHERE year < 2025
        ORDER BY year DESC
        LIMIT 5;
        """),
    ]
    
    print("DEBUGGING get_new_volunteers FUNCTION")
    print("=" * 60)
    
    for title, query in queries:
        print(f"\n{title}")
        print("-" * 40)
        result = run_psql_query(query)
        print(result)
        print()

if __name__ == "__main__":
    main()