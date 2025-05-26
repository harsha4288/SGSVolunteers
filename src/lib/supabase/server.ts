import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/types/supabase';

export const createSupabaseServerClient = async () => {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("Supabase server client creation failed: Missing NEXT_PUBLIC_SUPABASE_URL environment variable. Please ensure it is set in your .env file or environment configuration.");
  }
  if (!supabaseAnonKey) {
    throw new Error("Supabase server client creation failed: Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. Please ensure it is set in your .env file or environment configuration.");
  }

  try {
    new URL(supabaseUrl);
  } catch (e) {
    throw new Error(`Supabase server client creation failed: Invalid NEXT_PUBLIC_SUPABASE_URL: "${supabaseUrl}". It must be a valid URL string.`);
  }

  // Create client with Next.js 15 compatible async cookie handling
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
      storage: {
        getItem: (key: string) => {
          const cookie = cookieStore.get(key);
          return cookie?.value || null;
        },
        setItem: (key: string, value: string) => {
          cookieStore.set(key, value, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
          });
        },
        removeItem: (key: string) => {
          cookieStore.delete(key);
        }
      }
    }
  });
};
