"use client";

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/types/supabase';

export const createClient = () => {
  // Try environment variables first
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Fallback to hardcoded values for production if env vars aren't available
  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window === 'undefined') {
      // During SSR/build, use placeholder values
      console.warn('Missing Supabase environment variables during SSR/build');
      return createBrowserClient<Database>(
        'https://placeholder.supabase.co',
        'placeholder-key'
      );
    }
    
    // For production client-side, use the known values from VERCEL_SETUP.md
    console.warn('Environment variables missing, using fallback values');
    supabaseUrl = 'https://itnuxwdxpzdjlfwlvjyz.supabase.co';
    supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0bnV4d2R4cHpkamxmd2x2anl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4NDk0NTUsImV4cCI6MjA2MjQyNTQ1NX0.2YXD8rjFdAq4jGIHihya60QD_h3PsBB2m17SGBU0Hes';
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
};