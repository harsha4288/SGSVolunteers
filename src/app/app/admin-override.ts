'use server';

import { createSupabaseServerActionClient } from '@/lib/supabase/server-actions';

// A super simple admin check that just returns true for datta.rajesh@gmail.com
// or returns true for everyone in development mode
export async function hardcodedAdminCheck() {
  try {
    // Create a Supabase client
    const supabase = await createSupabaseServerActionClient();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log('No authenticated user found or error:', userError);
      // In development, allow access even without authentication
      return { isAdmin: process.env.NODE_ENV === 'development', error: 'Not authenticated' };
    }

    console.log('Checking admin access for user:', user.email);

    // Check if the user is datta.rajesh@gmail.com
    const isAdmin = user.email === 'datta.rajesh@gmail.com' || process.env.NODE_ENV === 'development';
    console.log('User admin status (hardcoded check):', isAdmin);

    return { isAdmin, error: null };
  } catch (error) {
    console.error('Unexpected error in hardcodedAdminCheck:', error);
    // In development, allow access even if there's an error
    return {
      isAdmin: process.env.NODE_ENV === 'development',
      error: error instanceof Error ? error.message : 'Unknown error checking admin access'
    };
  }
}
