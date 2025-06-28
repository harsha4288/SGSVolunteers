from supabase import create_client, Client

SUPABASE_URL = 'https://itnuxwdxpzdjlfwlvjyz.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0bnV4d2R4cHpkamxmd2x2anl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4NDk0NTUsImV4cCI6MjA2MjQyNTQ1NX0.2YXD8rjFdAq4jGIHihya60QD_h3PsBB2m17SGBU0Hes'

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def debug_get_new_volunteers():
    """Comprehensive debugging for get_new_volunteers function"""
    
    print("=" * 80)
    print("COMPREHENSIVE DEBUG FOR get_new_volunteers FUNCTION")
    print("=" * 80)
    
    try:
        # Step 1: Basic data checks
        print("\n" + "=" * 60)
        print("STEP 1: BASIC DATA CHECKS")
        print("=" * 60)
        
        # Total records
        total_result = supabase.table('volunteer_data_historical').select('*', count='exact').execute()
        print(f"Total records in volunteer_data_historical: {total_result.count}")
        
        # Records by year - Manual counting
        print("\nRecords by year:")
        all_data = supabase.table('volunteer_data_historical').select('year').execute()
        year_counts = {}
        for record in all_data.data:
            year = record['year']
            year_counts[year] = year_counts.get(year, 0) + 1
        
        for year in sorted(year_counts.keys(), reverse=True):
            print(f"  Year {year}: {year_counts[year]} records")
        
        # 2025 data check
        result_2025 = supabase.table('volunteer_data_historical').select('*', count='exact').eq('year', 2025).execute()
        print(f"\n2025 records: {result_2025.count}")
        
        # Pre-2025 data check
        result_pre_2025 = supabase.table('volunteer_data_historical').select('*', count='exact').lt('year', 2025).execute()
        print(f"Pre-2025 records: {result_pre_2025.count}")
        
        # Step 2: Sample data examination
        print("\n" + "=" * 60)
        print("STEP 2: SAMPLE DATA EXAMINATION")
        print("=" * 60)
        
        # Sample 2025 records
        print("\nSample 2025 records:")
        sample_2025 = supabase.table('volunteer_data_historical').select('year, first_name, last_name, email, phone, seva, total').eq('year', 2025).limit(5).execute()
        if sample_2025.data:
            for i, record in enumerate(sample_2025.data, 1):
                print(f"  {i}. {record['first_name']} {record['last_name']} | {record['email']} | {record['phone']} | {record['seva']}")
        else:
            print("  No 2025 records found!")
        
        # Sample pre-2025 records
        print("\nSample pre-2025 records:")
        sample_pre_2025 = supabase.table('volunteer_data_historical').select('year, first_name, last_name, email, phone, seva, total').lt('year', 2025).limit(5).execute()
        if sample_pre_2025.data:
            for i, record in enumerate(sample_pre_2025.data, 1):
                print(f"  {i}. {record['year']} | {record['first_name']} {record['last_name']} | {record['email']} | {record['phone']} | {record['seva']}")
        else:
            print("  No pre-2025 records found!")
        
        # Step 3: Test get_new_volunteers function directly
        print("\n" + "=" * 60)
        print("STEP 3: TESTING get_new_volunteers FUNCTION")
        print("=" * 60)
        
        # Test the function with default parameters
        try:
            new_volunteers_result = supabase.rpc('get_new_volunteers', {'p_current_year': 2025}).execute()
            print(f"get_new_volunteers function returned: {len(new_volunteers_result.data) if new_volunteers_result.data else 0} records")
            
            if new_volunteers_result.data:
                print("Sample new volunteers:")
                for i, record in enumerate(new_volunteers_result.data[:5], 1):
                    print(f"  {i}. {record['first_name']} {record['last_name']} | {record['email']} | {record['current_year_seva']}")
            else:
                print("No new volunteers found by the function!")
        except Exception as e:
            print(f"Error calling get_new_volunteers function: {e}")
        
        # Step 4: Manual calculation using simple logic
        print("\n" + "=" * 60)
        print("STEP 4: MANUAL CALCULATION (SIMPLE APPROACH)")
        print("=" * 60)
        
        # Get all unique emails from 2025
        current_emails_result = supabase.table('volunteer_data_historical').select('email, first_name, last_name, seva, phone').eq('year', 2025).execute()
        current_volunteers = {}
        for record in current_emails_result.data:
            email = record['email']
            if email and email.strip():
                email_lower = email.lower().strip()
                if email_lower not in current_volunteers:
                    current_volunteers[email_lower] = record
        
        print(f"Unique 2025 volunteers (by email): {len(current_volunteers)}")
        
        # Get all unique emails from pre-2025
        past_emails_result = supabase.table('volunteer_data_historical').select('email').lt('year', 2025).execute()
        past_emails = set()
        for record in past_emails_result.data:
            email = record['email']
            if email and email.strip():
                past_emails.add(email.lower().strip())
        
        print(f"Unique pre-2025 emails: {len(past_emails)}")
        
        # Calculate truly new volunteers (in 2025 but not in past)
        truly_new = []
        for email, volunteer_data in current_volunteers.items():
            if email not in past_emails:
                truly_new.append(volunteer_data)
        
        print(f"Truly new volunteers (manual calculation): {len(truly_new)}")
        
        if truly_new:
            print("Sample truly new volunteers:")
            for i, record in enumerate(truly_new[:10], 1):
                print(f"  {i}. {record['first_name']} {record['last_name']} | {record['email']} | {record['seva']}")
        
        # Step 5: Phone-based matching check
        print("\n" + "=" * 60)
        print("STEP 5: PHONE-BASED MATCHING CHECK")
        print("=" * 60)
        
        # Get all phone numbers from 2025
        current_phones_result = supabase.table('volunteer_data_historical').select('phone, email, first_name, last_name').eq('year', 2025).execute()
        current_phones = {}
        for record in current_phones_result.data:
            phone = record['phone']
            if phone and phone.strip():
                # Simple phone normalization (remove spaces, dashes, dots)
                normalized_phone = ''.join(c for c in phone if c.isdigit())
                if len(normalized_phone) >= 10:
                    current_phones[normalized_phone] = record
        
        print(f"2025 volunteers with valid phones: {len(current_phones)}")
        
        # Get all phone numbers from pre-2025
        past_phones_result = supabase.table('volunteer_data_historical').select('phone').lt('year', 2025).execute()
        past_phones = set()
        for record in past_phones_result.data:
            phone = record['phone']
            if phone and phone.strip():
                normalized_phone = ''.join(c for c in phone if c.isdigit())
                if len(normalized_phone) >= 10:
                    past_phones.add(normalized_phone)
        
        print(f"Pre-2025 unique phone numbers: {len(past_phones)}")
        
        # Check how many 2025 volunteers have matching phones in past
        phone_matches = 0
        for phone in current_phones.keys():
            if phone in past_phones:
                phone_matches += 1
        
        print(f"2025 volunteers with phone matches in past: {phone_matches}")
        
        # Step 6: Combined email+phone analysis
        print("\n" + "=" * 60)
        print("STEP 6: COMBINED EMAIL + PHONE ANALYSIS")
        print("=" * 60)
        
        new_by_email_and_phone = []
        for email, volunteer_data in current_volunteers.items():
            # Check if email exists in past
            email_in_past = email in past_emails
            
            # Check if phone exists in past
            phone_in_past = False
            phone = volunteer_data.get('phone')
            if phone and phone.strip():
                normalized_phone = ''.join(c for c in phone if c.isdigit())
                if len(normalized_phone) >= 10:
                    phone_in_past = normalized_phone in past_phones
            
            # If neither email nor phone found in past, consider as new
            if not email_in_past and not phone_in_past:
                new_by_email_and_phone.append(volunteer_data)
        
        print(f"New volunteers (email AND phone check): {len(new_by_email_and_phone)}")
        
        if new_by_email_and_phone:
            print("Sample new volunteers (email+phone check):")
            for i, record in enumerate(new_by_email_and_phone[:10], 1):
                print(f"  {i}. {record['first_name']} {record['last_name']} | {record['email']} | {record['phone']} | {record['seva']}")
        
        # Step 7: Data quality issues
        print("\n" + "=" * 60)
        print("STEP 7: DATA QUALITY ANALYSIS")
        print("=" * 60)
        
        # Check for NULL/empty emails and phones in 2025
        null_email_2025 = 0
        null_phone_2025 = 0
        both_null_2025 = 0
        
        for record in current_emails_result.data:
            email_null = not record['email'] or not record['email'].strip()
            phone_null = not record['phone'] or not record['phone'].strip()
            
            if email_null:
                null_email_2025 += 1
            if phone_null:
                null_phone_2025 += 1
            if email_null and phone_null:
                both_null_2025 += 1
        
        print(f"2025 data quality:")
        print(f"  Total records: {len(current_emails_result.data)}")
        print(f"  NULL/empty emails: {null_email_2025}")
        print(f"  NULL/empty phones: {null_phone_2025}")
        print(f"  Both NULL/empty: {both_null_2025}")
        
        # Check pre-2025 data quality
        null_email_past = 0
        null_phone_past = 0
        both_null_past = 0
        
        all_past_result = supabase.table('volunteer_data_historical').select('email, phone').lt('year', 2025).execute()
        
        for record in all_past_result.data:
            email_null = not record['email'] or not record['email'].strip()
            phone_null = not record['phone'] or not record['phone'].strip()
            
            if email_null:
                null_email_past += 1
            if phone_null:
                null_phone_past += 1
            if email_null and phone_null:
                both_null_past += 1
        
        print(f"\nPre-2025 data quality:")
        print(f"  Total records: {len(all_past_result.data)}")
        print(f"  NULL/empty emails: {null_email_past}")
        print(f"  NULL/empty phones: {null_phone_past}")
        print(f"  Both NULL/empty: {both_null_past}")
        
        # Step 8: Test volunteers_match function manually
        print("\n" + "=" * 60)
        print("STEP 8: TESTING volunteers_match FUNCTION")
        print("=" * 60)
        
        try:
            # Test with identical data
            match_test1 = supabase.rpc('volunteers_match', {
                'email1': 'test@example.com',
                'phone1': '1234567890',
                'email2': 'test@example.com',
                'phone2': '1234567890',
                'email_threshold': 0.8
            }).execute()
            print(f"Identical data match test: {match_test1.data}")
            
            # Test with different data
            match_test2 = supabase.rpc('volunteers_match', {
                'email1': 'test1@example.com',
                'phone1': '1234567890',
                'email2': 'test2@example.com',
                'phone2': '0987654321',
                'email_threshold': 0.8
            }).execute()
            print(f"Different data match test: {match_test2.data}")
            
            # Test with case differences
            match_test3 = supabase.rpc('volunteers_match', {
                'email1': 'test@example.com',
                'phone1': '1234567890',
                'email2': 'TEST@EXAMPLE.COM',
                'phone2': '1234567890',
                'email_threshold': 0.8
            }).execute()
            print(f"Case different match test: {match_test3.data}")
            
        except Exception as e:
            print(f"Error testing volunteers_match function: {e}")
        
        # Summary
        print("\n" + "=" * 60)
        print("SUMMARY")
        print("=" * 60)
        
        print(f"Function result: {len(new_volunteers_result.data) if 'new_volunteers_result' in locals() and new_volunteers_result.data else 0}")
        print(f"Manual email-only calculation: {len(truly_new)}")
        print(f"Manual email+phone calculation: {len(new_by_email_and_phone)}")
        
        if len(truly_new) > 0 and ('new_volunteers_result' not in locals() or not new_volunteers_result.data):
            print("\n🔍 ISSUE IDENTIFIED: Manual calculation finds new volunteers, but function returns 0!")
            print("This suggests there's an issue with the function logic.")
        elif len(truly_new) == 0:
            print("\n✅ Manual calculation also shows 0 new volunteers.")
            print("This suggests all 2025 volunteers have appeared in previous years.")
        
    except Exception as e:
        print(f"❌ Error during debugging: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_get_new_volunteers()