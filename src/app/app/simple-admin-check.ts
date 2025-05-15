'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/types/supabase';
import { Pool } from 'pg';

// A simplified function to check if the current user has admin role
export async function simpleAdminCheck() {
  try {
    const supabase = createSupabaseServerClient();
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { isAdmin: false, error: 'Not authenticated' };
    }

    // Get the user's profile by user_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();
    if (profileError || !profile) {
      return { isAdmin: false, error: 'Profile not found' };
    }

    // Check if the user has the Admin role
    const { data: roles, error: rolesError } = await supabase
      .from('profile_roles')
      .select('role_id, roles:role_id (role_name)')
      .eq('profile_id', profile.id);
    if (rolesError) {
      return { isAdmin: false, error: 'Error fetching roles: ' + rolesError.message };
    }

    const isAdmin = roles?.some((r: any) => r.roles?.role_name === 'Admin');
    return { isAdmin, error: null };
  } catch (error) {
    return {
      isAdmin: false,
      error: error instanceof Error ? error.message : 'Unknown error checking admin access',
    };
  }
}

// A function to check if a specific email has admin role
export async function checkEmailHasAdminRole(email: string) {
  try {
    // Create a direct database connection
    const pool = new Pool({
      host: process.env.SUPABASE_DB_HOST,
      port: parseInt(process.env.SUPABASE_DB_PORT || '5432'),
      database: process.env.SUPABASE_DB_NAME,
      user: process.env.SUPABASE_DB_USER,
      password: process.env.SUPABASE_DB_PASSWORD,
      ssl: true
    });
    
    // Get a client from the pool
    const client = await pool.connect();
    
    try {
      // Check if the email has admin role
      const result = await client.query(`
        SELECT 
          COUNT(*) as admin_count
        FROM 
          public.profiles p
        JOIN 
          public.profile_roles pr ON p.id = pr.profile_id
        JOIN 
          public.roles r ON pr.role_id = r.id
        WHERE 
          p.email = $1 
          AND r.role_name = 'Admin'
      `, [email]);
      
      const isAdmin = parseInt(result.rows[0].admin_count) > 0;
      console.log('Email admin status:', isAdmin, 'Count:', result.rows[0].admin_count);
      
      return { isAdmin, error: null };
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error('Unexpected error in checkEmailHasAdminRole:', error);
    return { 
      isAdmin: false, 
      error: error instanceof Error ? error.message : 'Unknown error checking admin access' 
    };
  }
}
