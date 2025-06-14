import pandas as pd
from supabase import create_client, Client
import os
import re

# Supabase connection details
SUPABASE_URL = "https://itnuxwdxpzdjlfwlvjyz.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0bnV4d2R4cHpkamxmd2x2anl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4NDk0NTUsImV4cCI6MjA2MjQyNTQ1NX0.2YXD8rjFdAq4jGIHihya60QD_h3PsBB2m17SGBU0Hes"

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# List of Excel files to process
EXCEL_FILES = [
    "Data/2025.xlsx"
]
SHEET_NAME = "Report Data"

# Define column mapping from Excel to Supabase table fields
COLUMN_MAPPING = {
    "Seva": "seva",
    "Email": "email",
    "First Name": "first_name",
    "Last Name": "last_name",
    "Phone": "phone",
    "Center": "center",
    "Region": "region",
    "Association": "association",
    "Gender": "gender",
    "Total": "total"
}

def load_data_to_supabase():
    print("Starting data migration to Supabase...")

    for file_path in EXCEL_FILES:
        try:
            # Extract year from filename
            file_name = os.path.basename(file_path)
            year_match = re.search(r'(\d{4})\.xlsx', file_name)
            if not year_match:
                print(f"Skipping {file_path}: Could not extract year from filename.")
                continue
            year = int(year_match.group(1))

            print(f"Processing file: {file_path} for year {year}")

            # Read the Excel sheet
            try:
                df = pd.read_excel(file_path, sheet_name=SHEET_NAME)
            except ValueError as ve:
                if "Worksheet named 'Report Data' not found" in str(ve):
                    print(f"Sheet '{SHEET_NAME}' not found in {file_path}. Attempting to list available sheets...")
                    xls = pd.ExcelFile(file_path)
                    available_sheets = xls.sheet_names
                    print(f"Available sheets in {file_path}: {available_sheets}")
                    # Try to find a sheet that is a close match or contains "Report Data"
                    found_sheet = None
                    for s_name in available_sheets:
                        if "report data" in s_name.lower():
                            found_sheet = s_name
                            break
                    if found_sheet:
                        print(f"Found a similar sheet: '{found_sheet}'. Using this sheet instead.")
                        df = pd.read_excel(file_path, sheet_name=found_sheet)
                    else:
                        raise ValueError(f"No suitable sheet found in {file_path}. Available sheets: {available_sheets}")
                else:
                    raise # Re-raise other ValueErrors

            # Rename columns
            df = df.rename(columns=COLUMN_MAPPING)

            # Add the 'year' column
            df['year'] = year

            # Robust cleaning for all columns to handle NaN, inf, -inf, and ensure JSON compliance
            for col in df.columns:
                # Skip 'year' column from this general numeric cleaning as it's already an integer
                if col == 'year':
                    continue

                # Attempt to convert to numeric, coercing errors. This will turn non-numeric into NaN.
                # It will also handle standard float conversions.
                if pd.api.types.is_numeric_dtype(df[col]):
                    # Convert to float first to standardize numeric types
                    df[col] = df[col].astype(float, errors='ignore')
                    # Replace inf and -inf with NaN
                    df[col] = df[col].replace([float('inf'), float('-inf')], float('nan'))
                    # Convert NaN to None
                    df[col] = df[col].apply(lambda x: None if pd.isna(x) else x)
                # For object columns, check if they contain float-like values that might be problematic
                elif df[col].dtype == 'object':
                    df[col] = df[col].apply(lambda x: None if isinstance(x, float) and (pd.isna(x) or x == float('inf') or x == float('-inf')) else x)


            # The 'total' column specific handling for integer conversion
            # This should now be safe as all numeric columns are cleaned.
            df['total'] = df['total'].apply(lambda x: int(x) if pd.notna(x) and isinstance(x, (int, float)) and x == int(x) else (None if pd.isna(x) else x))

            # The final df.where(pd.notna(df), None) is a good safeguard, but should be less necessary now.
            df = df.where(pd.notna(df), None)

            # Select only the columns that exist in our Supabase table
            target_columns = list(COLUMN_MAPPING.values()) + ['year']
            df_to_insert = df[df.columns.intersection(target_columns)]

            # Convert DataFrame to a list of dictionaries (JSON records)
            records = df_to_insert.to_dict(orient='records')

            # Filter out any records where 'email' is missing or empty
            records_to_insert = [
                record for record in records
                if record.get('email') and str(record['email']).strip() != ''
            ]

            if not records_to_insert:
                print(f"No valid records found in {file_path} to insert after filtering.")
                continue

            # Insert data into Supabase using upsert on (email, year)
            response = supabase.table('volunteer_data_historical').insert(records_to_insert).execute()

            inserted_count = 0
            error_details = None
            if response.data:
                inserted_count = len(response.data)
                print(f"Successfully inserted {inserted_count} records from {file_path}.")
            elif response.error:
                error_details = response.error
                print(f"Error inserting data from {file_path}:")
                print(f"  Message: {error_details.get('message', 'N/A')}")
                print(f"  Code: {error_details.get('code', 'N/A')}")
                print(f"  Hint: {error_details.get('hint', 'N/A')}")
                print(f"  Details: {error_details.get('details', 'N/A')}")
                print(f"  No records were inserted from {file_path} due to the error.")

        except FileNotFoundError:
            print(f"Error: Excel file not found at {file_path}. Skipping.")
        except Exception as e:
            print(f"An unexpected error occurred while processing {file_path}: {e}")
            import traceback
            traceback.print_exc()

    print("Data migration process completed.")

if __name__ == "__main__":
    load_data_to_supabase()
