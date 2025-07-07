"use client";

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/types/supabase';

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // During build time or if environment variables are missing, use fallback
    if (typeof window === 'undefined') {
      console.warn('Missing Supabase environment variables during SSR/build');
      return createBrowserClient<Database>(
        'https://placeholder.supabase.co',
        'placeholder-key'
      );
    }
    throw new Error('Missing Supabase environment variables');
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
};