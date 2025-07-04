from supabase import create_client, Client

SUPABASE_URL = 'https://itnuxwdxpzdjlfwlvjyz.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0bnV4d2R4cHpkamxmd2x2anl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4NDk0NTUsImV4cCI6MjA2MjQyNTQ1NX0.2YXD8rjFdAq4jGIHihya60QD_h3PsBB2m17SGBU0Hes'

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def debug_volunteers_match():
    """Debug the volunteers_match function to identify why it's returning incorrect results"""
    
    print("=" * 80)
    print("DEBUGGING volunteers_match FUNCTION")
    print("=" * 80)
    
    try:
        # Test cases that should return FALSE but are returning TRUE
        test_cases = [
            {
                'name': 'Completely different emails and phones',
                'email1': 'vishalpragg@yahoo.com',
                'phone1': '8687592075',
                'email2': '0000aks@gmail.com',
                'phone2': '7634868985',
                'expected': False
            },
            {
                'name': 'Similar emails but different',
                'email1': 'test@example.com',
                'phone1': '1234567890',
                'email2': 'different@example.com',
                'phone2': '0987654321',
                'expected': False
            },
            {
                'name': 'Identical emails (should be TRUE)',
                'email1': 'test@example.com',
                'phone1': '1234567890',
                'email2': 'test@example.com',
                'phone2': '0987654321',
                'expected': True
            },
            {
                'name': 'Identical phones (should be TRUE)',
                'email1': 'test1@example.com',
                'phone1': '1234567890',
                'email2': 'test2@example.com',
                'phone2': '1234567890',
                'expected': True
            },
            {
                'name': 'NULL email test',
                'email1': None,
                'phone1': '1234567890',
                'email2': 'test@example.com',
                'phone2': '0987654321',
                'expected': False
            },
            {
                'name': 'Empty string email test',
                'email1': '',
                'phone1': '1234567890',
                'email2': 'test@example.com',
                'phone2': '0987654321',
                'expected': False
            }
        ]
        
        print("Testing volunteers_match function with various inputs:")
        print("-" * 60)
        
        for i, test_case in enumerate(test_cases, 1):
            try:
                result = supabase.rpc('volunteers_match', {
                    'email1': test_case['email1'],
                    'phone1': test_case['phone1'],
                    'email2': test_case['email2'],
                    'phone2': test_case['phone2'],
                    'email_threshold': 0.8
                }).execute()
                
                actual = result.data
                expected = test_case['expected']
                status = "✅ PASS" if actual == expected else "❌ FAIL"
                
                print(f"{i}. {test_case['name']}")
                print(f"   Email1: {test_case['email1']}")
                print(f"   Phone1: {test_case['phone1']}")
                print(f"   Email2: {test_case['email2']}")
                print(f"   Phone2: {test_case['phone2']}")
                print(f"   Expected: {expected}, Actual: {actual} {status}")
                print()
                
            except Exception as e:
                print(f"{i}. {test_case['name']} - ERROR: {e}")
                print()
        
        # Test with real data from the database
        print("=" * 60)
        print("TESTING WITH REAL DATABASE DATA")
        print("=" * 60)
        
        # Get a 2025 volunteer that should be "new"
        new_volunteer = supabase.table('volunteer_data_historical').select('email, phone, first_name, last_name').eq('year', 2025).eq('email', 'vishalpragg@yahoo.com').execute()
        
        if new_volunteer.data:
            volunteer = new_volunteer.data[0]
            print(f"Testing with 2025 volunteer: {volunteer['first_name']} {volunteer['last_name']}")
            print(f"Email: {volunteer['email']}, Phone: {volunteer['phone']}")
            
            # Get some past volunteers to test against
            past_volunteers = supabase.table('volunteer_data_historical').select('email, phone, first_name, last_name, year').lt('year', 2025).limit(5).execute()
            
            print(f"\nTesting against {len(past_volunteers.data)} past volunteers:")
            
            for i, past_vol in enumerate(past_volunteers.data, 1):
                try:
                    result = supabase.rpc('volunteers_match', {
                        'email1': volunteer['email'],
                        'phone1': volunteer['phone'],
                        'email2': past_vol['email'],
                        'phone2': past_vol['phone'],
                        'email_threshold': 0.8
                    }).execute()
                    
                    print(f"{i}. {past_vol['first_name']} {past_vol['last_name']} ({past_vol['year']})")
                    print(f"   Email: {past_vol['email']}, Phone: {past_vol['phone']}")
                    print(f"   Match result: {result.data}")
                    print()
                    
                except Exception as e:
                    print(f"{i}. Error testing against {past_vol['first_name']}: {e}")
                    print()
        
        # Test the similarity function directly if available
        print("=" * 60)
        print("TESTING SIMILARITY FUNCTION")
        print("=" * 60)
        
        try:
            # Test similarity function with different strings
            similarity_tests = [
                ('test@example.com', 'test@example.com'),
                ('test@example.com', 'different@example.com'),
                ('vishalpragg@yahoo.com', '0000aks@gmail.com')
            ]
            
            for email1, email2 in similarity_tests:
                try:
                    result = supabase.rpc('similarity', {'text1': email1, 'text2': email2}).execute()
                    print(f"Similarity('{email1}', '{email2}'): {result.data}")
                except Exception as e:
                    print(f"Error testing similarity: {e}")
                    # Try direct SQL query
                    try:
                        query_result = supabase.rpc('exec_sql', {
                            'query': f"SELECT similarity('{email1}', '{email2}') as sim;"
                        }).execute()
                        print(f"Direct similarity('{email1}', '{email2}'): {query_result.data}")
                    except Exception as e2:
                        print(f"Direct similarity test also failed: {e2}")
        
        except Exception as e:
            print(f"Similarity function test error: {e}")
            
        # Test normalize_phone function
        print("=" * 60)
        print("TESTING normalize_phone FUNCTION")
        print("=" * 60)
        
        phone_tests = [
            '(868) 759-2075',
            '8687592075',
            '868-759-2075',
            '868.759.2075',
            '+1 868 759 2075',
            '7634868985'
        ]
        
        for phone in phone_tests:
            try:
                result = supabase.rpc('normalize_phone', {'phone_input': phone}).execute()
                print(f"normalize_phone('{phone}'): '{result.data}'")
            except Exception as e:
                print(f"Error normalizing '{phone}': {e}")
        
        print("\n" + "=" * 60)
        print("DEBUGGING COMPLETE")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Error during debugging: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_volunteers_match()