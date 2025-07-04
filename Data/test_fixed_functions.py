from supabase import create_client, Client

SUPABASE_URL = 'https://itnuxwdxpzdjlfwlvjyz.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0bnV4d2R4cHpkamxmd2x2anl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4NDk0NTUsImV4cCI6MjA2MjQyNTQ1NX0.2YXD8rjFdAq4jGIHihya60QD_h3PsBB2m17SGBU0Hes'

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def test_fixed_functions():
    """Test the fixed volunteer retention functions"""
    
    print("=" * 80)
    print("TESTING FIXED VOLUNTEER RETENTION FUNCTIONS")
    print("=" * 80)
    
    try:
        # First, we need to deploy the fixed functions
        print("Deploying fixed functions...")
        print("Note: You need to run the SQL file first to deploy the functions")
        
        # Test 1: Test the fixed normalize_phone function
        print("\n1. TESTING FIXED normalize_phone FUNCTION:")
        print("-" * 50)
        
        try:
            result = supabase.rpc('test_normalize_phone').execute()
            if result.data:
                print("normalize_phone test results:")
                for row in result.data:
                    print(f"  Input: '{row['input']}' -> Output: '{row['output']}'")
            else:
                print("No results from test_normalize_phone - function may not be deployed yet")
        except Exception as e:
            print(f"Error testing normalize_phone: {e}")
            print("The fixed functions may not be deployed yet. Please run the SQL file first.")
        
        # Test 2: Test the simple new volunteers function
        print("\n2. TESTING get_new_volunteers_simple FUNCTION:")
        print("-" * 50)
        
        try:
            result = supabase.rpc('get_new_volunteers_simple', {'p_current_year': 2025}).execute()
            if result.data:
                print(f"get_new_volunteers_simple returned: {len(result.data)} volunteers")
                print("Sample results:")
                for i, volunteer in enumerate(result.data[:5], 1):
                    print(f"  {i}. {volunteer['first_name']} {volunteer['last_name']} | {volunteer['email']} | {volunteer['current_year_seva']}")
            else:
                print("No results from get_new_volunteers_simple")
        except Exception as e:
            print(f"Error testing get_new_volunteers_simple: {e}")
        
        # Test 3: Test the optimized new volunteers function
        print("\n3. TESTING get_new_volunteers_optimized FUNCTION:")
        print("-" * 50)
        
        try:
            result = supabase.rpc('get_new_volunteers_optimized', {'p_current_year': 2025}).execute()
            if result.data:
                print(f"get_new_volunteers_optimized returned: {len(result.data)} volunteers")
                print("Sample results:")
                for i, volunteer in enumerate(result.data[:5], 1):
                    print(f"  {i}. {volunteer['first_name']} {volunteer['last_name']} | {volunteer['email']} | {volunteer['current_year_seva']}")
            else:
                print("No results from get_new_volunteers_optimized")
        except Exception as e:
            print(f"Error testing get_new_volunteers_optimized: {e}")
        
        # Test 4: Compare with manual calculation
        print("\n4. COMPARING WITH MANUAL CALCULATION:")
        print("-" * 50)
        
        # Manual calculation (from our earlier debugging)
        current_emails_result = supabase.table('volunteer_data_historical').select('email, first_name, last_name, seva, phone').eq('year', 2025).execute()
        current_volunteers = {}
        for record in current_emails_result.data:
            email = record['email']
            if email and email.strip():
                email_lower = email.lower().strip()
                if email_lower not in current_volunteers:
                    current_volunteers[email_lower] = record
        
        past_emails_result = supabase.table('volunteer_data_historical').select('email').lt('year', 2025).execute()
        past_emails = set()
        for record in past_emails_result.data:
            email = record['email']
            if email and email.strip():
                past_emails.add(email.lower().strip())
        
        # Calculate truly new volunteers (in 2025 but not in past)
        truly_new_manual = []
        for email, volunteer_data in current_volunteers.items():
            if email not in past_emails:
                truly_new_manual.append(volunteer_data)
        
        print(f"Manual calculation (email-only): {len(truly_new_manual)} new volunteers")
        
        # Test 5: Test volunteers_match_simple function
        print("\n5. TESTING volunteers_match_simple FUNCTION:")
        print("-" * 50)
        
        try:
            test_cases = [
                {
                    'name': 'Different emails and phones',
                    'email1': 'vishalpragg@yahoo.com',
                    'phone1': '8687592075',
                    'email2': '0000aks@gmail.com',
                    'phone2': '7634868985',
                    'expected': False
                },
                {
                    'name': 'Same email',
                    'email1': 'test@example.com',
                    'phone1': '1234567890',
                    'email2': 'test@example.com',
                    'phone2': '0987654321',
                    'expected': True
                },
                {
                    'name': 'Same phone (formatted differently)',
                    'email1': 'test1@example.com',
                    'phone1': '(123) 456-7890',
                    'email2': 'test2@example.com',
                    'phone2': '1234567890',
                    'expected': True
                }
            ]
            
            for test_case in test_cases:
                try:
                    result = supabase.rpc('volunteers_match_simple', {
                        'email1': test_case['email1'],
                        'phone1': test_case['phone1'],
                        'email2': test_case['email2'],
                        'phone2': test_case['phone2']
                    }).execute()
                    
                    actual = result.data
                    expected = test_case['expected']
                    status = "✅ PASS" if actual == expected else "❌ FAIL"
                    
                    print(f"{test_case['name']}: Expected {expected}, Got {actual} {status}")
                    
                except Exception as e:
                    print(f"{test_case['name']}: Error - {e}")
        
        except Exception as e:
            print(f"Error testing volunteers_match_simple: {e}")
        
        # Test 6: Performance comparison
        print("\n6. PERFORMANCE COMPARISON:")
        print("-" * 50)
        
        import time
        
        # Test the simple function performance
        try:
            start_time = time.time()
            result = supabase.rpc('get_new_volunteers_simple', {'p_current_year': 2025}).execute()
            end_time = time.time()
            
            simple_time = end_time - start_time
            simple_count = len(result.data) if result.data else 0
            
            print(f"get_new_volunteers_simple: {simple_count} results in {simple_time:.2f} seconds")
        except Exception as e:
            print(f"get_new_volunteers_simple performance test failed: {e}")
        
        # Test the optimized function performance
        try:
            start_time = time.time()
            result = supabase.rpc('get_new_volunteers_optimized', {'p_current_year': 2025}).execute()
            end_time = time.time()
            
            optimized_time = end_time - start_time
            optimized_count = len(result.data) if result.data else 0
            
            print(f"get_new_volunteers_optimized: {optimized_count} results in {optimized_time:.2f} seconds")
        except Exception as e:
            print(f"get_new_volunteers_optimized performance test failed: {e}")
        
        # Try the original function for comparison (but with short timeout)
        try:
            print("\nTesting original function (may timeout)...")
            start_time = time.time()
            result = supabase.rpc('get_new_volunteers', {'p_current_year': 2025}).execute()
            end_time = time.time()
            
            original_time = end_time - start_time
            original_count = len(result.data) if result.data else 0
            
            print(f"get_new_volunteers (original): {original_count} results in {original_time:.2f} seconds")
        except Exception as e:
            print(f"get_new_volunteers (original) failed as expected: {e}")
        
        print("\n" + "=" * 60)
        print("SUMMARY")
        print("=" * 60)
        
        print(f"Manual calculation (email-only): {len(truly_new_manual)} new volunteers")
        
        if 'simple_count' in locals():
            print(f"Simple function: {simple_count} new volunteers")
        if 'optimized_count' in locals():
            print(f"Optimized function: {optimized_count} new volunteers")
        
        print("\nRecommendation: Use get_new_volunteers_simple or get_new_volunteers_optimized")
        print("Both should provide the correct results without timeout issues.")
        
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_fixed_functions()