const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkProfile() {
  try {
    console.log('Checking for profile with email: rajesh_yg@yahoo.com');
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'rajesh_yg@yahoo.com')
      .single();

    if (profileError) {
      console.error('Profile query error:', profileError);
      if (profileError.code === 'PGRST116') {
        console.log('❌ No profile found for rajesh_yg@yahoo.com');
      }
    } else {
      console.log('✅ Profile found:', profile);
    }
    
    // Also check all profiles to see what exists
    const { data: allProfiles, error: allError } = await supabase
      .from('profiles')
      .select('*')
      .limit(10);
    
    if (allError) {
      console.error('Error fetching all profiles:', allError);
    } else {
      console.log('\nAll profiles in database:');
      allProfiles.forEach(p => console.log(`- ${p.email} (ID: ${p.id})`));
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkProfile();