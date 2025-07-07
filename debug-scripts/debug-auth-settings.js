const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkAuthSettings() {
  try {
    console.log('🔍 Testing OTP send to rajesh_yg@yahoo.com...');
    
    // Try to send OTP - this will reveal the exact error
    const { data, error } = await supabase.auth.signInWithOtp({
      email: 'rajesh_yg@yahoo.com',
      options: {
        shouldCreateUser: true
      }
    });

    if (error) {
      console.error('❌ Auth Error:', error);
      console.error('Error Code:', error.status);
      console.error('Error Message:', error.message);
      
      if (error.message.includes('Signups not allowed')) {
        console.log('\n🚨 SOLUTION: Enable user signups in Supabase Dashboard');
        console.log('   → Go to: Authentication → Settings');
        console.log('   → Find: "Enable signup" setting');
        console.log('   → Toggle: ON');
      }
    } else {
      console.log('✅ OTP send successful:', data);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkAuthSettings();