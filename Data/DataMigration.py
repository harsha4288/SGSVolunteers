import psycopg2
import pandas as pd
from psycopg2.extras import execute_values
import json
from datetime import date, datetime, time, timezone, timedelta # Added timedelta
import re
import uuid # For generating UUIDs

# --- DATABASE CONNECTION DETAILS ---
# These should ideally be environment variables or from a config file
host = "db.itnuxwdxpzdjlfwlvjyz.supabase.co"
port = 5432
database = "postgres"
user = "postgres"
password = "W6gTwafhvfJ8.4?" # Replace with your actual password

conn_str = f"postgresql://{user}:{password}@{host}:{port}/{database}"

# --- FILE SETTINGS ---
EXCEL_PATH = "2025.xlsx"
SHEET_NAME = "Report Data" # As confirmed


# --- EVENT CONFIGURATION ---
EVENT_YEAR = 2025
EVENT_DEFAULT_MONTH = 7 # July
DEFAULT_EVENT_NAME = 'Guru Pournami Gita Utsav 2025'
DEFAULT_EVENT_START_DATE = date(EVENT_YEAR, EVENT_DEFAULT_MONTH, 8)
DEFAULT_EVENT_END_DATE = date(EVENT_YEAR, EVENT_DEFAULT_MONTH, 12)

# Define known time slot patterns and their corresponding start/end times (local, will be made TZ aware)
TIME_DEFINITIONS = {
    "morning": (time(9, 0), time(12, 0)),
    "am": (time(9, 0), time(12, 0)),
    "evening": (time(18, 0), time(21, 0)),
    "pm": (time(13, 0), time(17, 0)),
    "full day": (time(9, 0), time(17, 0)),
    "all day": (time(9, 0), time(17, 0)),
    "full time": (time(9, 0), time(17, 0)), # For "ALL EVENT DAYS ... FULL TIME"
}
# Assuming Chicago time for the event for timezone awareness
EVENT_TIMEZONE = timezone(timedelta(hours=-5)) # CDT (UTC-5) / CST (UTC-6) - adjust if needed

# Exact column names from "Report Data" sheet for task assignments
ASSIGNMENT_COLUMN_NAMES = [
    "All Days", "8th PM", "9th AM", "9th PM", "9th Full",
    "10th AM", "10th PM", "10th Full", "11th AM", "11th PM", "11th Full",
    "12th AM", "12th PM", "12th Full"
]
ALL_DAYS_ASSIGNMENT_SLOT_DESC = "All Event Days (Assignment July 8th-12th)" # For the "All Days" task column

# --- HELPER FUNCTIONS ---

def get_db_connection():
    return psycopg2.connect(conn_str)

def generate_uuid():
    return str(uuid.uuid4())

def parse_slot_description_to_timestamps(slot_desc_key, event_year=EVENT_YEAR, default_month=EVENT_DEFAULT_MONTH, event_tz=EVENT_TIMEZONE):
    """
    Parses a slot description string into a list of (start_datetime_utc, end_datetime_utc, slot_name, slot_description) tuples.
    Handles multi-day keys like "ALL EVENT DAYS..." by returning multiple tuples.
    Returns UTC-aware datetimes.

    slot_name: Short name used for assignments (e.g., "8th PM", "9th AM")
    slot_description: Full descriptive name (e.g., "8th July (Tuesday) - Evening")
    """
    slot_desc_key_lower = slot_desc_key.lower().strip()
    parsed_datetimes = []

    # Handle "ALL EVENT DAYS - July 8th to July 12th - FULL TIME" (from availability JSON)
    if "all event days" in slot_desc_key_lower and "july 8th to july 12th" in slot_desc_key_lower:
        start_day, end_day = 8, 12
        slot_start_time_local, slot_end_time_local = TIME_DEFINITIONS.get("full time", (time(9,0), time(17,0)))
        for day_num in range(start_day, end_day + 1):
            try:
                event_dt_local = date(event_year, default_month, day_num)
                start_dt_local = datetime.combine(event_dt_local, slot_start_time_local)
                end_dt_local = datetime.combine(event_dt_local, slot_end_time_local)
                # Make timezone aware using replace() and then convert to UTC
                start_dt_aware = start_dt_local.replace(tzinfo=event_tz)
                end_dt_aware = end_dt_local.replace(tzinfo=event_tz)
                # Generate short name for this day
                day_suffix = "th" if day_num not in [1, 2, 3] else ["st", "nd", "rd"][day_num-1]
                short_name = f"{day_num}{day_suffix} Full"
                parsed_datetimes.append((
                    start_dt_aware.astimezone(timezone.utc),
                    end_dt_aware.astimezone(timezone.utc),
                    short_name,
                    slot_desc_key  # Use original full description
                ))
            except ValueError as e:
                print(f"Warning: Could not create date for '{slot_desc_key}' (Day: {day_num}): {e}")
        return parsed_datetimes

    # Handle "All Days" (from assignment columns) - maps to a single conceptual slot for the entire event
    if slot_desc_key == ALL_DAYS_ASSIGNMENT_SLOT_DESC or slot_desc_key_lower == "all days": # "all days" is the excel col name
        # This slot spans the entire event duration conceptually for assignments.
        start_dt_local = datetime.combine(DEFAULT_EVENT_START_DATE, time(0,0)) # Event start
        end_dt_local = datetime.combine(DEFAULT_EVENT_END_DATE, time(23,59,59))   # Event end
        start_dt_aware = start_dt_local.replace(tzinfo=event_tz)
        end_dt_aware = end_dt_local.replace(tzinfo=event_tz)
        short_name = "All Days"
        description = ALL_DAYS_ASSIGNMENT_SLOT_DESC
        parsed_datetimes.append((
            start_dt_aware.astimezone(timezone.utc),
            end_dt_aware.astimezone(timezone.utc),
            short_name,
            description
        ))
        return parsed_datetimes

    # Check if this is already a short format assignment column name (e.g., "8th PM", "9th AM")
    is_assignment_column = slot_desc_key in ASSIGNMENT_COLUMN_NAMES

    # General parsing for single day slots (e.g., "9th AM", "10th Full", "8th July (Tuesday) - Evening")
    slot_start_time_local, slot_end_time_local = None, None
    time_period = None

    for keyword, times in TIME_DEFINITIONS.items():
        if keyword in slot_desc_key_lower:
            slot_start_time_local, slot_end_time_local = times
            time_period = keyword
            break

    if slot_start_time_local is None or slot_end_time_local is None: # Default to full day if no specific time part
        slot_start_time_local, slot_end_time_local = TIME_DEFINITIONS.get("full day", (time(9,0), time(17,0)))
        time_period = "full day"

    day_match = re.search(r'(\d+)(?:st|nd|rd|th)?', slot_desc_key)
    if not day_match:
        print(f"Debug: No day number found in slot_desc_key: {slot_desc_key}")
        return []

    day = int(day_match.group(1))

    current_month = default_month
    month_match_search = re.search(r'(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)', slot_desc_key_lower, re.IGNORECASE)
    if month_match_search:
        month_str = month_match_search.group(1)
        month_map = {'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
                     'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12}
        current_month = month_map.get(month_str, default_month)

    try:
        event_dt_local = date(event_year, current_month, day)
        start_dt_local = datetime.combine(event_dt_local, slot_start_time_local)
        end_dt_local = datetime.combine(event_dt_local, slot_end_time_local)
        start_dt_aware = start_dt_local.replace(tzinfo=event_tz)
        end_dt_aware = end_dt_local.replace(tzinfo=event_tz)

        # Generate short name based on the day and time period
        day_suffix = "th" if day not in [1, 2, 3] else ["st", "nd", "rd"][day-1]

        # Map time period to short format (AM, PM, Full)
        time_short = "AM" if time_period in ["morning", "am"] else \
                    "PM" if time_period in ["evening", "pm"] else \
                    "Full" if time_period in ["full day", "all day", "full time"] else \
                    "Full"  # Default

        # Generate standardized short name format regardless of input format
        # This ensures both "8th July (Tuesday) - Evening" and "8th PM" map to the same short name
        standardized_short_name = f"{day}{day_suffix} {time_short}"

        # If this is an assignment column, check if it matches our standardized format
        # If not, we'll use our standardized format anyway to ensure consistency
        if is_assignment_column and slot_desc_key != standardized_short_name:
            print(f"Mapping assignment column '{slot_desc_key}' to standardized name '{standardized_short_name}'")

        # Always use the standardized short name for consistency
        short_name = standardized_short_name

        # For the description, use the full descriptive name if available, otherwise use the short name
        # This ensures the description field contains the most detailed information
        if "july" in slot_desc_key_lower and any(day_part in slot_desc_key_lower for day_part in ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]):
            # This is already a full descriptive name
            description = slot_desc_key
        else:
            # This is a short name, we'll keep the original as the description for now
            # In the time_slots processing, we'll update descriptions with full names when available
            description = slot_desc_key

        parsed_datetimes.append((
            start_dt_aware.astimezone(timezone.utc),
            end_dt_aware.astimezone(timezone.utc),
            short_name,
            description
        ))
    except ValueError as e:
        print(f"Warning: Could not create date for slot_desc_key '{slot_desc_key}' (Day: {day}, Month: {current_month}): {e}")

    return parsed_datetimes


# --- MAIN MIGRATION LOGIC ---
def run_migration():
    conn = None
    try:
        conn = get_db_connection()
        conn.autocommit = False # Use transactions
        cur = conn.cursor()

        print("--- 🏁 Starting Migration ---")

        # 1. Ensure Default Event and get its ID
        print("📅 Ensuring default event exists...")
        cur.execute(
            "INSERT INTO public.events (event_name, start_date, end_date) VALUES (%s, %s, %s) ON CONFLICT (event_name) DO UPDATE SET start_date = EXCLUDED.start_date, end_date = EXCLUDED.end_date RETURNING id;",
            (DEFAULT_EVENT_NAME, DEFAULT_EVENT_START_DATE, DEFAULT_EVENT_END_DATE)
        )
        event_id_result = cur.fetchone()
        if not event_id_result: # If ON CONFLICT DO NOTHING and it existed, fetch it
            cur.execute("SELECT id FROM public.events WHERE event_name = %s;", (DEFAULT_EVENT_NAME,))
            event_id_result = cur.fetchone()
        event_id = event_id_result[0]
        print(f"Event '{DEFAULT_EVENT_NAME}' has ID: {event_id}")

        # 2. Clear existing data from relevant tables
        print("🧹 Clearing target tables (volunteer_commitments, volunteers, profiles, seva_categories, time_slots)...")
        cur.execute("DELETE FROM public.volunteer_commitments;")
        cur.execute("DELETE FROM public.volunteers;")
        cur.execute("DELETE FROM public.profiles;")
        cur.execute("DELETE FROM public.seva_categories;")
        cur.execute("DELETE FROM public.time_slots;")
        print("Clear complete.")

        # 3. Read Excel Data
        print(f"📥 Reading Excel file: {EXCEL_PATH}, Sheet: {SHEET_NAME}...")
        df_excel = pd.read_excel(EXCEL_PATH, sheet_name=SHEET_NAME)
        # Normalize column names from Excel to match expected df keys
        df_excel = df_excel.rename(columns={
            'Timestamp': 'google_form_submission_timestamp',
            'Email Address': 'email',
            'First Name': 'first_name',
            'Last Name': 'last_name',
            'Phone': 'phone',
            'Gender': 'gender',
            'Are you  part of Gita Mahāyajña family ?': 'gm_family',
            'Association with the Mahāyajña Program. (All volunteers should be 18 years and older)': 'association_with_mahayajna',
            'Mahāyajña Student Name (First & Last Name) ': 'mahayajna_student_name',
            'Batch': 'student_batch',
            'Hospitality': 'hospitality_needed',
            'AdditionalInfo': 'additional_info',
            'Location': 'location',
            'Other Location': 'other_location',
            'T-Shirts': 'requested_tshirt_quantity', # Added mapping for T-Shirts column
            # Availability columns (e.g., "9th AM") will be processed separately
        })
        # Convert Yes/No to boolean for relevant fields
        for bool_col in ['gm_family', 'hospitality_needed']:
            if bool_col in df_excel.columns:
                 df_excel[bool_col] = df_excel[bool_col].astype(str).str.strip().str.lower().isin(['yes', 'true', '1', 'y'])


        # Store raw availability JSON keys from Excel columns
        # These are columns like "9th AM", "10th July (Thursday) - Morning", etc.
        availability_json_cols = [c for c in df_excel.columns if any(day_indic in c for day_indic in ['9th','10th','11th','12th', 'July', 'EVENT DAYS'])]
        # Filter out known assignment columns to avoid double processing if names overlap
        availability_json_cols = [c for c in availability_json_cols if c not in ASSIGNMENT_COLUMN_NAMES and c not in df_excel.columns.intersection(['email', 'first_name', 'last_name'])]


        print(f"Found {len(df_excel)} rows in Excel.")

        # 4. Populate `profiles`
        print("👤 Populating `profiles` table...")
        unique_emails = df_excel['email'].dropna().astype(str).str.lower().unique()
        profile_records = []
        for email_val in unique_emails:
            profile_id = generate_uuid()
            # display_name can be derived later or set from first volunteer with this email
            profile_records.append((profile_id, None, email_val.strip())) # id, user_id (NULL), email

        if profile_records:
            execute_values(cur, "INSERT INTO public.profiles (id, user_id, email) VALUES %s ON CONFLICT (email) DO NOTHING;", profile_records)
            print(f"Processed {len(profile_records)} unique emails for `profiles`.")

        # Fetch profile_ids to link to volunteers
        cur.execute("SELECT id, email FROM public.profiles;")
        email_to_profile_id_map = {email_val.lower().strip(): pid for pid, email_val in cur.fetchall()}

        # 5. Populate `volunteers`
        print("👥 Populating `volunteers` table...")
        volunteer_records = []
        # Store raw availability data per volunteer_key for later processing
        volunteer_key_to_raw_availability = {}
        # This map will be populated after inserting/updating and re-fetching
        volunteer_key_to_uuid_map = {}

        for _, row in df_excel.iterrows():
            vol_email = str(row.get('email', '')).lower().strip()
            vol_first_name = str(row.get('first_name', '')).strip()
            vol_last_name = str(row.get('last_name', '')).strip()

            if not vol_email or not vol_first_name or not vol_last_name:
                print(f"Skipping row due to missing email/first/last name: {row.get('email')}, {row.get('first_name')}, {row.get('last_name')}")
                continue

            # We generate a UUID here for the INSERT, but the ON CONFLICT might mean a different UUID is in the DB.
            # The key is to link raw_avail_data to the (email, first, last) key, then use the DB-fetched UUID.
            temp_volunteer_uuid_for_insert = generate_uuid() # This UUID is for the initial INSERT attempt
            profile_id = email_to_profile_id_map.get(vol_email)

            raw_avail_data = {col: bool(row[col]) for col in availability_json_cols if col in row and pd.notna(row[col])}
            volunteer_key = (vol_email, vol_first_name, vol_last_name)
            volunteer_key_to_raw_availability[volunteer_key] = raw_avail_data

            # volunteer_key_to_uuid_map[volunteer_key] = volunteer_uuid # This was problematic

            requested_tshirts_val = row.get('requested_tshirt_quantity')
            try:
                # Attempt to convert to int, default to None if not possible (e.g. NaN, text)
                requested_tshirts_int = int(requested_tshirts_val) if pd.notna(requested_tshirts_val) else None
            except ValueError:
                requested_tshirts_int = None # If conversion to int fails

            volunteer_records.append((
                temp_volunteer_uuid_for_insert, profile_id, vol_email, vol_first_name, vol_last_name,
                str(row.get('phone', '')), str(row.get('gender', '')),
                bool(row.get('gm_family', False)), str(row.get('association_with_mahayajna', '')),
                str(row.get('mahayajna_student_name', '')), str(row.get('student_batch', '')),
                bool(row.get('hospitality_needed', False)), str(row.get('location', '')),
                str(row.get('other_location', '')), str(row.get('additional_info', '')),
                (lambda ts: None if pd.isna(ts) else ts)(pd.to_datetime(row.get('google_form_submission_timestamp'), errors='coerce')),
                requested_tshirts_int # Added requested_tshirt_quantity
            ))

        if volunteer_records:
            execute_values(cur, """
                INSERT INTO public.volunteers (
                    id, profile_id, email, first_name, last_name, phone, gender, gm_family,
                    association_with_mahayajna, mahayajna_student_name, student_batch,
                    hospitality_needed, location, other_location, additional_info,
                    google_form_submission_timestamp, requested_tshirt_quantity
                ) VALUES %s ON CONFLICT (email, first_name, last_name) DO UPDATE SET
                    profile_id = EXCLUDED.profile_id, phone = EXCLUDED.phone, gender = EXCLUDED.gender,
                    gm_family = EXCLUDED.gm_family, association_with_mahayajna = EXCLUDED.association_with_mahayajna,
                    mahayajna_student_name = EXCLUDED.mahayajna_student_name, student_batch = EXCLUDED.student_batch,
                    hospitality_needed = EXCLUDED.hospitality_needed, location = EXCLUDED.location,
                    other_location = EXCLUDED.other_location, additional_info = EXCLUDED.additional_info,
                    google_form_submission_timestamp = EXCLUDED.google_form_submission_timestamp,
                    requested_tshirt_quantity = EXCLUDED.requested_tshirt_quantity,
                    updated_at = NOW();
            """, volunteer_records)
            print(f"Inserted/Updated {len(volunteer_records)} records into `volunteers`.")

        # Re-fetch volunteer UUIDs in case of ON CONFLICT updates
        cur.execute("SELECT id, email, first_name, last_name FROM public.volunteers;")
        volunteer_key_to_uuid_map = {
            (str(em).lower().strip(), str(fn).strip(), str(ln).strip()): vid
            for vid, em, fn, ln in cur.fetchall()
        }


        # 6. Populate `time_slots`
        print("⏳ Populating `time_slots` table...")
        all_slot_desc_keys = set()
        for avail_data in volunteer_key_to_raw_availability.values(): # Corrected variable name here
            for key, is_avail in avail_data.items():
                if is_avail: all_slot_desc_keys.add(key)
        for assign_col_name in ASSIGNMENT_COLUMN_NAMES:
            all_slot_desc_keys.add(assign_col_name) # Add assignment column names as potential slot descriptions

        # Create a mapping to store the best description for each short name
        # This will help us use the full descriptive name when available
        short_name_to_best_description = {}

        # First pass: collect all descriptions for each short name
        for slot_key in all_slot_desc_keys:
            parsed_ts_list = parse_slot_description_to_timestamps(slot_key)
            for _, _, short_name, description in parsed_ts_list:
                # Prefer full descriptive names (those containing "July" and day names)
                desc_lower = description.lower()
                if "july" in desc_lower and any(day_part in desc_lower for day_part in ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]):
                    # This is a full descriptive name, always prefer it
                    short_name_to_best_description[short_name] = description
                elif short_name not in short_name_to_best_description:
                    # Only use short names if we don't have a better description yet
                    short_name_to_best_description[short_name] = description

        print(f"Collected descriptions for {len(short_name_to_best_description)} unique time slots")

        # Second pass: create time slot records with the best descriptions
        time_slot_db_records = []
        processed_db_slot_names = set()

        for slot_key in all_slot_desc_keys:
            parsed_ts_list = parse_slot_description_to_timestamps(slot_key)
            for start_utc, end_utc, short_name, _ in parsed_ts_list:
                if short_name not in processed_db_slot_names:
                    # Use the best description we found for this short name
                    best_description = short_name_to_best_description.get(short_name, short_name)
                    time_slot_db_records.append((event_id, short_name, start_utc, end_utc, best_description))
                    processed_db_slot_names.add(short_name)
                    print(f"Time slot: {short_name} -> Description: {best_description}")

        if time_slot_db_records:
            # Check if description column exists in time_slots table
            cur.execute("""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = 'time_slots'
                AND column_name = 'description';
            """)
            has_description_column = cur.fetchone() is not None

            if has_description_column:
                execute_values(cur, """
                    INSERT INTO public.time_slots (event_id, slot_name, start_time, end_time, description)
                    VALUES %s ON CONFLICT (slot_name) DO UPDATE SET
                    description = EXCLUDED.description,
                    start_time = EXCLUDED.start_time,
                    end_time = EXCLUDED.end_time;
                """, time_slot_db_records)
            else:
                # If description column doesn't exist yet, use the old query
                # This allows backward compatibility until the column is added
                execute_values(cur, """
                    INSERT INTO public.time_slots (event_id, slot_name, start_time, end_time)
                    VALUES %s ON CONFLICT (slot_name) DO UPDATE SET
                    start_time = EXCLUDED.start_time,
                    end_time = EXCLUDED.end_time;
                """, [(event_id, name, start, end) for (event_id, name, start, end, _) in time_slot_db_records])

            print(f"Processed {len(time_slot_db_records)} unique slot descriptions for `time_slots`.")

        cur.execute("SELECT id, slot_name FROM public.time_slots;")
        slot_name_to_id_map = {name: ts_id for ts_id, name in cur.fetchall()}

        # 7. Populate `seva_categories` (Dynamically during task assignment)
        print("🛠️ Preparing for `seva_categories` (will populate dynamically)...")
        seva_category_name_to_id_map = {} # Cache for category_name -> id

        def get_or_create_seva_category_id(cursor, cat_name):
            cat_name_clean = cat_name.strip()
            if cat_name_clean in seva_category_name_to_id_map:
                return seva_category_name_to_id_map[cat_name_clean]
            cursor.execute("SELECT id FROM public.seva_categories WHERE category_name = %s;", (cat_name_clean,))
            result = cursor.fetchone()
            if result:
                seva_category_name_to_id_map[cat_name_clean] = result[0]
                return result[0]
            else:
                cursor.execute("INSERT INTO public.seva_categories (category_name) VALUES (%s) RETURNING id;", (cat_name_clean,))
                cat_id = cursor.fetchone()[0]
                seva_category_name_to_id_map[cat_name_clean] = cat_id
                return cat_id

        # 8. Populate `volunteer_commitments`
        print("📝 Populating `volunteer_commitments` table...")
        commitment_records = []

        # 8a. Promised Availability
        # Iterate using the volunteer_key_to_uuid_map which has the correct DB UUIDs
        for volunteer_key_tuple, db_volunteer_uuid in volunteer_key_to_uuid_map.items():
            raw_avail_data = volunteer_key_to_raw_availability.get(volunteer_key_tuple)
            if raw_avail_data:
                for slot_desc_key, is_selected in raw_avail_data.items():
                    if is_selected:
                        # Get the short name for this slot description
                        parsed_ts_list = parse_slot_description_to_timestamps(slot_desc_key)
                        if parsed_ts_list:
                            # Use the short name to look up the time slot ID
                            _, _, short_name, _ = parsed_ts_list[0]
                            time_slot_id = slot_name_to_id_map.get(short_name)
                            if time_slot_id:
                                commitment_records.append((
                                    db_volunteer_uuid, time_slot_id, 'PROMISED_AVAILABILITY', None,
                                    None, f"Google Form: {slot_desc_key}"
                                ))
                            else:
                                print(f"Warning (Promised Avail): Time slot ID not found for short name '{short_name}' from description '{slot_desc_key}'. Volunteer key: {volunteer_key_tuple}")
                        else:
                            print(f"Warning (Promised Avail): Could not parse time slot description '{slot_desc_key}'. Volunteer key: {volunteer_key_tuple}")

        print(f"Collected {len(commitment_records)} 'PROMISED_AVAILABILITY' records so far.")

        # 8b. Assigned Tasks
        for _, row in df_excel.iterrows():
            vol_email = str(row.get('email', '')).lower().strip()
            vol_first_name = str(row.get('first_name', '')).strip()
            vol_last_name = str(row.get('last_name', '')).strip()

            volunteer_key = (vol_email, vol_first_name, vol_last_name)
            volunteer_uuid = volunteer_key_to_uuid_map.get(volunteer_key)

            if not volunteer_uuid:
                # This volunteer was skipped earlier or not found after re-fetch
                continue

            for assign_col_excel_name in ASSIGNMENT_COLUMN_NAMES: # e.g., "8th PM", "All Days"
                task_description_from_cell = row.get(assign_col_excel_name)
                if pd.notna(task_description_from_cell) and str(task_description_from_cell).strip():
                    task_name_clean = str(task_description_from_cell).strip()
                    seva_cat_id = get_or_create_seva_category_id(cur, task_name_clean)

                    # For assignment columns, we use the short name directly
                    # The short name is the same as the Excel column name for assignment columns
                    time_slot_id = slot_name_to_id_map.get(assign_col_excel_name)

                    if time_slot_id and seva_cat_id:
                        commitment_records.append((
                            volunteer_uuid, time_slot_id, 'ASSIGNED_TASK', seva_cat_id,
                            None, f"Excel Assignment: {assign_col_excel_name}" # task_notes, source_reference
                        ))
                    else:
                        if not time_slot_id: print(f"Warning (Task Assign): Time slot ID not found for assignment column '{assign_col_excel_name}'. Vol: {volunteer_uuid}")
                        # seva_cat_id should always be found due to get_or_create

        if commitment_records:
            print(f"Total commitments to insert (Promised + Assigned): {len(commitment_records)}")
            execute_values(cur, """
                INSERT INTO public.volunteer_commitments (
                    volunteer_id, time_slot_id, commitment_type, seva_category_id,
                    task_notes, source_reference
                ) VALUES %s ON CONFLICT (volunteer_id, time_slot_id, commitment_type, seva_category_id) DO NOTHING;
            """, commitment_records) # Using DO NOTHING for simplicity, assuming first write is correct.
            print(f"Inserted {cur.rowcount} records into `volunteer_commitments`.") # cur.rowcount might be more accurate after execute_values
        else:
            print("ℹ️ No commitment records to insert.")

        conn.commit()
        print("✅ Migration committed successfully!")

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if conn:
            conn.close()
            print("🔒 Connection closed.")

if __name__ == "__main__":
    run_migration()
