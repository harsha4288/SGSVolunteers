const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkSessionRefresh() {
  try {
    console.log('🔍 Testing session and refresh token...');
    
    // Check current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session Error:', sessionError);
      return;
    }
    
    if (!sessionData.session) {
      console.log('ℹ️ No active session found');
      return;
    }
    
    console.log('✅ Active session found:');
    console.log('  - User ID:', sessionData.session.user?.id);
    console.log('  - Email:', sessionData.session.user?.email);
    console.log('  - Expires at:', new Date(sessionData.session.expires_at * 1000));
    console.log('  - Has refresh token:', !!sessionData.session.refresh_token);
    
    // Test refresh
    console.log('\n🔄 Testing token refresh...');
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError) {
      console.error('❌ Refresh Error:', refreshError);
      console.error('Error Code:', refreshError.status);
      console.error('Error Message:', refreshError.message);
      
      if (refreshError.message.includes('Refresh Token Not Found')) {
        console.log('\n🚨 SOLUTION: Session/cookie storage issue');
        console.log('   → Check browser cookies for supabase tokens');
        console.log('   → Verify SSR client configuration');
        console.log('   → May need to clear browser storage and re-login');
      }
    } else {
      console.log('✅ Token refresh successful');
      console.log('  - New expires at:', new Date(refreshData.session?.expires_at * 1000));
    }
    
    // Test user fetch
    console.log('\n👤 Testing user fetch...');
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ User fetch error:', userError);
    } else {
      console.log('✅ User fetch successful');
      console.log('  - User ID:', userData.user?.id);
      console.log('  - Email:', userData.user?.email);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkSessionRefresh();