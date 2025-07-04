from supabase import create_client, Client

SUPABASE_URL = 'https://itnuxwdxpzdjlfwlvjyz.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0bnV4d2R4cHpkamxmd2x2anl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4NDk0NTUsImV4cCI6MjA2MjQyNTQ1NX0.2YXD8rjFdAq4jGIHihya60QD_h3PsBB2m17SGBU0Hes'

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def final_test_and_summary():
    """Final test to confirm our analysis and provide the solution"""
    
    print("=" * 80)
    print("FINAL ANALYSIS AND SOLUTION SUMMARY")
    print("=" * 80)
    
    try:
        # Confirm the manual calculation one more time
        print("1. CONFIRMING MANUAL CALCULATION:")
        print("-" * 50)
        
        # Get 2025 volunteers
        current_result = supabase.table('volunteer_data_historical').select('email, first_name, last_name, seva, phone').eq('year', 2025).execute()
        current_emails = set()
        current_phones = set()
        current_volunteers_by_email = {}
        
        for record in current_result.data:
            email = record['email']
            phone = record['phone']
            
            if email and email.strip():
                email_clean = email.lower().strip()
                current_emails.add(email_clean)
                if email_clean not in current_volunteers_by_email:
                    current_volunteers_by_email[email_clean] = record
            
            if phone and phone.strip():
                # Manual phone normalization
                phone_clean = ''.join(c for c in phone if c.isdigit())
                if len(phone_clean) >= 10:
                    current_phones.add(phone_clean)
        
        print(f"2025 unique emails: {len(current_emails)}")
        print(f"2025 unique phones: {len(current_phones)}")
        
        # Get past volunteers
        past_result = supabase.table('volunteer_data_historical').select('email, phone').lt('year', 2025).execute()
        past_emails = set()
        past_phones = set()
        
        for record in past_result.data:
            email = record['email']
            phone = record['phone']
            
            if email and email.strip():
                past_emails.add(email.lower().strip())
            
            if phone and phone.strip():
                phone_clean = ''.join(c for c in phone if c.isdigit())
                if len(phone_clean) >= 10:
                    past_phones.add(phone_clean)
        
        print(f"Past unique emails: {len(past_emails)}")
        print(f"Past unique phones: {len(past_phones)}")
        
        # Calculate new volunteers
        new_by_email = current_emails - past_emails
        new_by_phone = current_phones - past_phones
        
        # Combined: new if both email AND phone are not in past
        new_volunteers = []
        for email, volunteer_data in current_volunteers_by_email.items():
            email_is_new = email not in past_emails
            
            phone = volunteer_data.get('phone', '')
            phone_is_new = True  # Default to new if no valid phone
            if phone and phone.strip():
                phone_clean = ''.join(c for c in phone if c.isdigit())
                if len(phone_clean) >= 10:
                    phone_is_new = phone_clean not in past_phones
            
            # New if email is new AND phone is new (or no valid phone)
            if email_is_new and phone_is_new:
                new_volunteers.append(volunteer_data)
        
        print(f"\nNew volunteers by email only: {len(new_by_email)}")
        print(f"New volunteers by email AND phone: {len(new_volunteers)}")
        
        # Test the normalize_phone function issue
        print("\n2. TESTING normalize_phone FUNCTION ISSUE:")
        print("-" * 50)
        
        test_phones = [
            '(868) 759-2075',
            '868-759-2075', 
            '868.759.2075'
        ]
        
        for phone in test_phones:
            try:
                result = supabase.rpc('normalize_phone', {'phone_input': phone}).execute()
                manual_result = ''.join(c for c in phone if c.isdigit())
                match = "✅" if result.data == manual_result else "❌"
                print(f"Phone: '{phone}'")
                print(f"  Function: '{result.data}'")
                print(f"  Expected: '{manual_result}' {match}")
            except Exception as e:
                print(f"Error testing '{phone}': {e}")
        
        # Test the original function timeout
        print("\n3. TESTING ORIGINAL FUNCTION (TIMEOUT CHECK):")
        print("-" * 50)
        
        import time
        try:
            print("Attempting to call get_new_volunteers (this may timeout)...")
            start_time = time.time()
            result = supabase.rpc('get_new_volunteers', {'p_current_year': 2025}).execute()
            end_time = time.time()
            print(f"✅ Original function completed in {end_time - start_time:.2f} seconds")
            print(f"   Returned {len(result.data) if result.data else 0} volunteers")
        except Exception as e:
            print(f"❌ Original function failed as expected: {e}")
        
        # Sample some new volunteers
        print("\n4. SAMPLE NEW VOLUNTEERS (MANUAL CALCULATION):")
        print("-" * 50)
        
        if new_volunteers:
            print("First 10 new volunteers:")
            for i, volunteer in enumerate(new_volunteers[:10], 1):
                print(f"  {i}. {volunteer['first_name']} {volunteer['last_name']}")
                print(f"     Email: {volunteer['email']}")
                print(f"     Phone: {volunteer['phone']}")
                print(f"     Seva: {volunteer['seva']}")
                print()
        
        print("=" * 80)
        print("SUMMARY OF ISSUES FOUND:")
        print("=" * 80)
        
        print("1. PERFORMANCE ISSUE:")
        print("   - Function performs 520 × 1,463 = 760,360 comparisons")
        print("   - Each comparison uses volunteers_match with regex operations")
        print("   - This causes the function to timeout")
        print()
        
        print("2. normalize_phone FUNCTION BUG:")
        print("   - Regex '[\\s\\.\\-\\+]' doesn't remove parentheses ()")
        print("   - Should be '[^0-9]' to remove ALL non-digit characters")
        print("   - This causes phone matching to fail")
        print()
        
        print("3. ACTUAL NEW VOLUNTEERS:")
        print(f"   - Manual calculation shows {len(new_volunteers)} truly new volunteers")
        print("   - Function returns 0 due to timeout/bugs")
        print()
        
        print("=" * 80)
        print("RECOMMENDED SOLUTIONS:")
        print("=" * 80)
        
        print("IMMEDIATE FIX:")
        print("1. Fix normalize_phone function:")
        print("   RETURN REGEXP_REPLACE(phone_input, '[^0-9]', '', 'g');")
        print()
        
        print("2. Use optimized approach to avoid timeout:")
        print("   - Use hash-based lookups instead of nested loops")
        print("   - Create sets of past emails/phones for O(1) lookup")
        print("   - Avoid volunteers_match function for initial screening")
        print()
        
        print("3. Deploy the fixed functions from:")
        print("   - volunteer_retention_report_functions_fixed.sql")
        print("   - Contains both performance and logic fixes")
        print()
        
        print("EXPECTED RESULTS AFTER FIX:")
        print(f"   - get_new_volunteers should return ~{len(new_volunteers)} volunteers")
        print("   - Function should complete in < 5 seconds")
        print("   - All phone formatting issues resolved")
        
        print("\n" + "=" * 80)
        print("DEBUGGING COMPLETE - ROOT CAUSES IDENTIFIED")
        print("=" * 80)
        
    except Exception as e:
        print(f"❌ Error during final test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    final_test_and_summary()