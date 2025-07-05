import { createClient } from '@supabase/supabase-js';
import type { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/lib/types/supabase';

export const createSupabaseMiddlewareClient = (req: NextRequest, res: NextResponse) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    console.error("Supabase middleware client creation failed: Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
    throw new Error("Supabase middleware client creation failed: Missing NEXT_PUBLIC_SUPABASE_URL environment variable. Please ensure it is set in your .env file or environment configuration.");
  }
  if (!supabaseAnonKey) {
    console.error("Supabase middleware client creation failed: Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable");
    throw new Error("Supabase middleware client creation failed: Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. Please ensure it is set in your .env file or environment configuration.");
  }

  try {
    // Validate that supabaseUrl is a valid URL string before passing it to the client
    new URL(supabaseUrl);
  } catch (e) {
    throw new Error(`Supabase middleware client creation failed: Invalid NEXT_PUBLIC_SUPABASE_URL: "${supabaseUrl}". It must be a valid URL string.`);
  }

  // Create a simple Supabase client for middleware use
  // Middleware doesn't need complex auth handling, just basic session checking
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
      storage: {
        getItem: (key: string) => {
          // Get from request cookies
          const cookie = req.cookies.get(key);
          return cookie?.value || null;
        },
        setItem: (key: string, value: string) => {
          // Set response cookies
          res.cookies.set(key, value, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
          });
        },
        removeItem: (key: string) => {
          // Remove response cookies
          res.cookies.delete(key);
        }
      }
    }
  });
};
