import pandas as pd
from supabase import create_client, Client
import os
import re
import argparse

# Supabase connection details
SUPABASE_URL = "https://itnuxwdxpzdjlfwlvjyz.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0bnV4d2R4cHpkamxmd2x2anl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4NDk0NTUsImV4cCI6MjA2MjQyNTQ1NX0.2YXD8rjFdAq4jGIHihya60QD_h3PsBB2m17SGBU0Hes"

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Default Excel files to process (can be overridden by parameters)
DEFAULT_EXCEL_FILES = [
    "2025.xlsx"
]
DEFAULT_SHEET_NAME = "Report Data"

# Define column mapping from Excel to Supabase table fields
COLUMN_MAPPING = {
    "Seva": "seva",
    "Email Address": "email",  # Updated from "Email" to "Email Address"
    "First Name": "first_name",
    "Last Name": "last_name",
    "Phone": "phone",
    "Center": "center",
    "Region": "region",
    "Association": "association",
    "Gender": "gender",
    "Total": "total",
    # "Batch": "batch",  # Column exists in Excel but not in database table yet
    "Year": "year"
}

def extract_year_from_filename(filename):
    """Extract year from filename if it contains a 4-digit year (e.g., 2025)"""
    year_match = re.search(r'(20\d{2})', filename)
    if year_match:
        return int(year_match.group(1))
    return None

def load_data_to_supabase(excel_files=None, sheet_name=None):
    print("Starting data migration to Supabase...")
    
    # Use provided parameters or defaults
    files_to_process = excel_files if excel_files else DEFAULT_EXCEL_FILES
    sheet_to_use = sheet_name if sheet_name else DEFAULT_SHEET_NAME
    
    for file_path in files_to_process:
        try:
            file_name = os.path.basename(file_path)
            print(f"Processing file: {file_path}")

            # Read the Excel sheet
            try:
                df = pd.read_excel(file_path, sheet_name=sheet_to_use)
            except ValueError as ve:
                if "Worksheet named" in str(ve) and "not found" in str(ve):
                    print(f"Sheet '{sheet_to_use}' not found in {file_path}. Attempting to list available sheets...")
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

            # Check for 'year' column and auto-populate if missing
            if 'year' not in df.columns:
                print(f"Warning: 'year' column not found in {file_path}.")
                # Try to extract year from filename
                extracted_year = extract_year_from_filename(file_name)
                if extracted_year:
                    print(f"Auto-populating year field with {extracted_year} from filename.")
                    df['year'] = extracted_year
                else:
                    print(f"No year found in filename. Skipping this file.")
                    continue

            # Robust cleaning for all columns to handle NaN, inf, -inf, and ensure JSON compliance
            for col in df.columns:
                # Skip 'year' column from this general numeric cleaning as it's already present
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

            # The 'total' and 'year' columns specific handling for integer conversion
            def safe_int(val):
                if pd.isna(val):
                    return None
                if isinstance(val, int):
                    return val
                if isinstance(val, float):
                    return int(val) if val.is_integer() else None
                if isinstance(val, str):
                    val_strip = val.strip()
                    try:
                        f = float(val_strip)
                        if f.is_integer():
                            return int(f)
                        else:
                            return None
                    except Exception:
                        return None
                return None
            for col in ['total', 'year']:
                if col in df.columns:
                    df[col] = df[col].apply(safe_int)
                    # Explicitly cast to nullable integer dtype to enforce int/None
                    df[col] = pd.to_numeric(df[col], errors='coerce').astype('Int64')

            # The final df.where(pd.notna(df), None) is a good safeguard, but should be less necessary now.
            df = df.replace([float('inf'), float('-inf')], None)
            df = df.where(pd.notna(df), None)

            # Select only the columns that exist in our Supabase table
            target_columns = list(COLUMN_MAPPING.values())
            df_to_insert = df[df.columns.intersection(target_columns)]

            # Convert DataFrame to a list of dictionaries (JSON records)
            records = df_to_insert.to_dict(orient='records')
            # Remove any remaining out-of-range float values from records
            import math
            def clean_json_record(record):
                for k, v in record.items():
                    if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
                        record[k] = None
                return record
            records = [clean_json_record(r) for r in records]

            # Final check: remove any records where 'total' or 'year' is still a string (should not happen)
            cleaned_records = []
            for rec in records:
                if (isinstance(rec.get('total'), str) and rec.get('total')) or (isinstance(rec.get('year'), str) and rec.get('year')):
                    print(f"Warning: Skipping record with invalid integer value: {rec}")
                    continue
                cleaned_records.append(rec)
            records = cleaned_records

            # Filter out any records where 'email' is missing or empty
            records_to_insert = [
                record for record in records
                if record.get('email') and str(record['email']).strip() != ''
            ]

            if not records_to_insert:
                print(f"No valid records found in {file_path} to insert after filtering.")
                continue

            # Insert data into Supabase
            print(f"Attempting to insert {len(records_to_insert)} records...")
            response = supabase.table('volunteer_data_historical').insert(records_to_insert).execute()

            inserted_count = 0
            if response.data:
                inserted_count = len(response.data)
                print(f"Successfully inserted {inserted_count} records from {file_path}.")
                
                # Check year distribution of inserted records
                year_counts = {}
                for record in response.data:
                    year = record.get('year')
                    year_counts[year] = year_counts.get(year, 0) + 1
                print(f"Inserted records by year:")
                for year, count in sorted(year_counts.items()):
                    print(f"  {year}: {count} records")
            else:
                print(f"No data returned from insert operation for {file_path}.")

        except FileNotFoundError:
            print(f"Error: Excel file not found at {file_path}. Skipping.")
        except Exception as e:
            print(f"An unexpected error occurred while processing {file_path}: {e}")
            import traceback
            traceback.print_exc()

    print("Data migration process completed.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Load volunteer data to Supabase')
    parser.add_argument('--file', '-f', type=str, help='Excel file name to process')
    parser.add_argument('--sheet', '-s', type=str, help='Sheet name to process')
    
    args = parser.parse_args()
    
    excel_files = [args.file] if args.file else None
    sheet_name = args.sheet if args.sheet else None
    
    load_data_to_supabase(excel_files=excel_files, sheet_name=sheet_name)
