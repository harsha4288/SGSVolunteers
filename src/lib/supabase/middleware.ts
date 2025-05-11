import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import type { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/lib/types/supabase';

export const createSupabaseMiddlewareClient = (req: NextRequest, res: NextResponse) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("Supabase middleware client creation failed: Missing NEXT_PUBLIC_SUPABASE_URL environment variable. Please ensure it is set in your .env file or environment configuration.");
  }
  if (!supabaseAnonKey) {
    throw new Error("Supabase middleware client creation failed: Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. Please ensure it is set in your .env file or environment configuration.");
  }
  
  try {
    // Validate that supabaseUrl is a valid URL string before passing it to the client
    new URL(supabaseUrl);
  } catch (e) {
    throw new Error(`Supabase middleware client creation failed: Invalid NEXT_PUBLIC_SUPABASE_URL: "${supabaseUrl}". It must be a valid URL string.`);
  }

  return createMiddlewareClient<Database>({ req, res }, {
    supabaseUrl,
    supabaseKey: supabaseAnonKey,
  });
};
