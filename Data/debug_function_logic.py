from supabase import create_client, Client

SUPABASE_URL = 'https://itnuxwdxpzdjlfwlvjyz.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0bnV4d2R4cHpkamxmd2x2anl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4NDk0NTUsImV4cCI6MjA2MjQyNTQ1NX0.2YXD8rjFdAq4jGIHihya60QD_h3PsBB2m17SGBU0Hes'

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def debug_function_logic():
    """Debug the get_new_volunteers function logic step by step"""
    
    print("=" * 80)
    print("DEBUGGING get_new_volunteers FUNCTION LOGIC")
    print("=" * 80)
    
    try:
        # First, let's check if there's an issue with the normalize_phone function
        print("1. TESTING normalize_phone FUNCTION:")
        print("-" * 40)
        
        test_phones = [
            '(868) 759-2075',  # Should become 8687592075
            '868-759-2075',    # Should become 8687592075
            '868.759.2075',    # Should become 8687592075
            '+1 868 759 2075', # Should become 18687592075
            ' 868 759 2075 ',  # Should become 8687592075
        ]
        
        for phone in test_phones:
            try:
                result = supabase.rpc('normalize_phone', {'phone_input': phone}).execute()
                # Manual normalization for comparison
                manual_normalized = ''.join(c for c in phone if c.isdigit())
                print(f"Phone: '{phone}'")
                print(f"  Function result: '{result.data}'")
                print(f"  Manual result:   '{manual_normalized}'")
                print(f"  Match: {'✅' if result.data == manual_normalized else '❌'}")
                print()
            except Exception as e:
                print(f"Error normalizing '{phone}': {e}")
        
        # Test if pg_trgm extension is available
        print("2. TESTING pg_trgm EXTENSION:")
        print("-" * 40)
        
        try:
            # Try to test similarity function directly
            similarity_result = supabase.rpc('test_similarity', {
                'text1': 'test@example.com',
                'text2': 'test@example.com'
            }).execute()
            print(f"Similarity function test: {similarity_result.data}")
        except Exception as e:
            print(f"pg_trgm extension may not be available: {e}")
            
            # Let's see if we can check extensions
            try:
                # This won't work via RPC but let's try
                extensions_result = supabase.rpc('check_extensions').execute()
                print(f"Extensions: {extensions_result.data}")
            except Exception as e2:
                print(f"Cannot check extensions: {e2}")
        
        # Test the CTEs individually using a simplified approach
        print("3. TESTING CTE LOGIC STEP BY STEP:")
        print("-" * 40)
        
        # Step 3a: Test current_year_volunteers CTE logic
        print("3a. Current year volunteers (simplified):")
        current_year_simple = supabase.table('volunteer_data_historical').select('email, phone, first_name, last_name, seva', count='exact').eq('year', 2025).execute()
        print(f"   Raw 2025 records: {current_year_simple.count}")
        
        # Get distinct emails
        current_emails = set()
        for record in current_year_simple.data:
            email = record['email']
            if email and email.strip():
                current_emails.add(email.lower().strip())
        print(f"   Distinct 2025 emails: {len(current_emails)}")
        
        # Step 3b: Test past_volunteers CTE logic
        print("\n3b. Past volunteers (simplified):")
        past_year_simple = supabase.table('volunteer_data_historical').select('email, phone', count='exact').lt('year', 2025).execute()
        print(f"   Raw pre-2025 records: {past_year_simple.count}")
        
        # Get distinct past emails
        past_emails = set()
        for record in past_year_simple.data:
            email = record['email']
            if email and email.strip():
                past_emails.add(email.lower().strip())
        print(f"   Distinct pre-2025 emails: {len(past_emails)}")
        
        # Step 3c: Calculate intersection
        print("\n3c. Overlap analysis:")
        overlap = current_emails & past_emails
        print(f"   Emails in both 2025 and pre-2025: {len(overlap)}")
        print(f"   Emails only in 2025: {len(current_emails - past_emails)}")
        print(f"   Emails only in pre-2025: {len(past_emails - current_emails)}")
        
        # Sample some overlapping emails
        if overlap:
            print(f"\n   Sample overlapping emails:")
            for i, email in enumerate(list(overlap)[:5], 1):
                print(f"   {i}. {email}")
        
        # Sample some 2025-only emails
        new_emails = current_emails - past_emails
        if new_emails:
            print(f"\n   Sample 2025-only emails:")
            for i, email in enumerate(list(new_emails)[:5], 1):
                print(f"   {i}. {email}")
        
        # Test the seva pattern filtering
        print("\n4. TESTING SEVA PATTERN FILTERING:")
        print("-" * 40)
        
        # Check what seva patterns exist in 2025
        seva_counts = {}
        for record in current_year_simple.data:
            seva = record.get('seva', 'None')
            seva_counts[seva] = seva_counts.get(seva, 0) + 1
        
        print("Seva patterns in 2025:")
        for seva, count in sorted(seva_counts.items()):
            print(f"   {seva}: {count}")
        
        # The function uses ARRAY['%'] which should match all
        # But let's test the logic
        print("\nTesting seva pattern logic:")
        print("   ARRAY['%'] with pattern '%' should match all sevas")
        
        # Test the specific condition from the function
        print("\n5. TESTING SPECIFIC FUNCTION CONDITIONS:")
        print("-" * 40)
        
        # The function has this condition in current_year_volunteers:
        # AND (
        #     CASE 
        #         WHEN array_length(p_seva_patterns, 1) = 1 AND p_seva_patterns[1] = '%' THEN TRUE
        #         ELSE EXISTS (
        #             SELECT 1 FROM unnest(p_seva_patterns) as pattern
        #             WHERE COALESCE(vdh.seva, '') ILIKE pattern
        #         ) OR vdh.seva IS NULL
        #     END
        # )
        
        # With default parameters, p_seva_patterns = ARRAY['%']
        # So array_length(ARRAY['%'], 1) = 1 and ARRAY['%'][1] = '%'
        # This should evaluate to TRUE for all records
        
        print("With default parameters ARRAY['%']:")
        print("   array_length(ARRAY['%'], 1) = 1: TRUE")
        print("   ARRAY['%'][1] = '%': TRUE")
        print("   Therefore condition should be TRUE for all records")
        print("   Expected current_year_volunteers count: same as raw 2025 count")
        
        # Test a simple version of the volunteers_match logic
        print("\n6. TESTING MATCHING LOGIC PERFORMANCE:")
        print("-" * 40)
        
        # Take a small sample and test matching
        print("Testing matching performance with small sample...")
        
        sample_current = current_year_simple.data[:10]  # First 10 2025 volunteers
        sample_past = past_year_simple.data[:50]       # First 50 past volunteers
        
        match_count = 0
        total_comparisons = 0
        
        for current_vol in sample_current:
            current_email = current_vol['email']
            current_phone = current_vol['phone']
            
            for past_vol in sample_past:
                past_email = past_vol['email']  
                past_phone = past_vol['phone']
                total_comparisons += 1
                
                try:
                    # Test the match
                    match_result = supabase.rpc('volunteers_match', {
                        'email1': current_email,
                        'phone1': current_phone,
                        'email2': past_email,
                        'phone2': past_phone,
                        'email_threshold': 0.8
                    }).execute()
                    
                    if match_result.data:
                        match_count += 1
                        
                except Exception as e:
                    print(f"Error in match test: {e}")
                    break
        
        print(f"   Sample test: {match_count} matches out of {total_comparisons} comparisons")
        print(f"   Estimated total comparisons for full dataset: {len(current_year_simple.data)} × {len(past_year_simple.data)} = {len(current_year_simple.data) * len(past_year_simple.data):,}")
        
        if len(current_year_simple.data) * len(past_year_simple.data) > 500000:
            print("   ⚠️  WARNING: This could be causing the timeout!")
            print("   ⚠️  Too many comparisons for volunteers_match function")
        
        print("\n" + "=" * 60)
        print("ANALYSIS COMPLETE")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Error during debugging: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_function_logic()