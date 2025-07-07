// Debug script to check refresh token issues
// Run with: npx tsx debug-scripts/debug-refresh-token.ts

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function debugRefreshToken() {
  console.log('🔍 Debugging refresh token issues...\n');
  
  try {
    // 1. Check current session
    console.log('1. Getting current session...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session Error:', sessionError.message);
      console.log('\n🚨 POSSIBLE CAUSES:');
      console.log('   → Browser cookies corrupted');
      console.log('   → Session expired');
      console.log('   → SSR/client configuration mismatch');
      return;
    }
    
    if (!sessionData.session) {
      console.log('ℹ️ No active session - please login first');
      return;
    }
    
    console.log('✅ Active session found');
    console.log(`   User: ${sessionData.session.user.email}`);
    console.log(`   Expires: ${new Date(sessionData.session.expires_at! * 1000)}`);
    console.log(`   Has refresh token: ${!!sessionData.session.refresh_token}`);
    
    // 2. Test manual refresh
    console.log('\n2. Testing manual token refresh...');
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError) {
      console.error('❌ Refresh Error:', refreshError.message);
      console.log('\n🚨 SOLUTIONS:');
      console.log('   → Clear browser cookies and localStorage');
      console.log('   → Check SSR client configuration');
      console.log('   → Ensure middleware cookie handling is correct');
      console.log('   → Login again to get fresh tokens');
    } else {
      console.log('✅ Token refresh successful');
      console.log(`   New expires: ${new Date(refreshData.session!.expires_at! * 1000)}`);
    }
    
    // 3. Check auth state listener
    console.log('\n3. Testing auth state listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(`   Auth event: ${event}`);
        if (event === 'TOKEN_REFRESHED') {
          console.log('✅ Token refresh event received');
        } else if (event === 'SIGNED_OUT') {
          console.log('⚠️ User signed out');
        }
      }
    );
    
    // Clean up listener after 2 seconds
    setTimeout(() => {
      subscription.unsubscribe();
      console.log('\n✅ Debug complete');
    }, 2000);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.log('\n🚨 EMERGENCY SOLUTIONS:');
    console.log('   → Clear all browser data for your domain');
    console.log('   → Check browser developer tools for cookie issues');
    console.log('   → Verify Supabase project settings');
  }
}

debugRefreshToken();