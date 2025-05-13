'use server';

import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/types/supabase';
import { Pool } from 'pg';

// A simplified function to check if the current user has admin role
export async function simpleAdminCheck() {
  try {
    const cookieStore = cookies();
    
    // Create Supabase client
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('No authenticated user found or error:', userError);
      return { isAdmin: false, error: 'Not authenticated' };
    }
    
    console.log('Checking admin access for user:', user.email);
    
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
      // Check if the user has admin role directly by email
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
      `, [user.email]);
      
      const isAdmin = parseInt(result.rows[0].admin_count) > 0;
      console.log('User admin status (by email):', isAdmin, 'Count:', result.rows[0].admin_count);
      
      return { isAdmin, error: null };
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error('Unexpected error in simpleAdminCheck:', error);
    return { 
      isAdmin: false, 
      error: error instanceof Error ? error.message : 'Unknown error checking admin access' 
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
