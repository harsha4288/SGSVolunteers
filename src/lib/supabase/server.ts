import { createServerClient, type CookieOptions } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/types/supabase';

export const createSupabaseServerClient = () => {
  const cookieStore = cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("Supabase server client creation failed: Missing NEXT_PUBLIC_SUPABASE_URL environment variable. Please ensure it is set in your .env file or environment configuration.");
  }
  if (!supabaseAnonKey) {
    throw new Error("Supabase server client creation failed: Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. Please ensure it is set in your .env file or environment configuration.");
  }

  try {
    // Validate that supabaseUrl is a valid URL string before passing it to the client
    new URL(supabaseUrl);
  } catch (e) {
    throw new Error(`Supabase server client creation failed: Invalid NEXT_PUBLIC_SUPABASE_URL: "${supabaseUrl}". It must be a valid URL string.`);
  }

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
};
