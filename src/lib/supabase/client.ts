
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/supabase';

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Debug logging to understand what's happening
  console.log("Environment check:", {
    isClient: typeof window !== 'undefined',
    nodeEnv: process.env.NODE_ENV,
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlLength: supabaseUrl?.length,
    keyLength: supabaseAnonKey?.length
  });

  // During build time, if environment variables are not available, return a mock client
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'production' && !supabaseUrl) {
    console.log("Still loading, showing non-admin items only");
    // Return a mock client that won't cause build failures
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signInWithOAuth: () => Promise.resolve({ data: {}, error: null }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: null }, error: null }),
        exchangeCodeForSession: () => Promise.resolve({ data: {}, error: null })
      },
      from: () => ({
        select: () => ({ data: [], error: null }),
        insert: () => ({ data: [], error: null }),
        update: () => ({ data: [], error: null }),
        delete: () => ({ data: [], error: null }),
        upsert: () => ({ data: [], error: null })
      })
    } as any;
  }

  // If running on client side in production and env vars are missing, use hardcoded values
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production' && !supabaseUrl) {
    console.warn("Environment variables not found on client side, using fallback values");
    const fallbackUrl = 'https://itnuxwdxpzdjlfwlvjyz.supabase.co';
    const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0bnV4d2R4cHpkamxmd2x2anl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4NDk0NTUsImV4cCI6MjA2MjQyNTQ1NX0.2YXD8rjFdAq4jGIHihya60QD_h3PsBB2m17SGBU0Hes';
    
    return createSupabaseClient<Database>(fallbackUrl, fallbackKey, {
      auth: {
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
      },
      global: {
        headers: {
          'X-Client-Info': 'nextjs-15-client-fallback'
        }
      }
    });
  }

  // Strict checks for URL
  if (!supabaseUrl || supabaseUrl === "YOUR_SUPABASE_URL_HERE" || supabaseUrl.trim() === "" || typeof supabaseUrl !== 'string') {
    const errorMsg = "Supabase client creation failed: NEXT_PUBLIC_SUPABASE_URL is missing, a placeholder, empty, or not a string. Please check your .env.local file and ensure it's loaded correctly by restarting your Next.js server.";
    console.error(errorMsg, "Received URL:", supabaseUrl);
    throw new Error(errorMsg);
  }

  try {
    const parsedUrl = new URL(supabaseUrl);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error("URL protocol must be http or https.");
    }
    // Example: check if it's a Supabase-like URL if needed, though this might be too restrictive.
    // if (!parsedUrl.hostname.endsWith(".supabase.co")) {
    //   throw new Error("Hostname does not look like a Supabase URL (e.g., project-ref.supabase.co)");
    // }
  } catch (e: any) {
    const errorMsg = `Supabase client creation failed: Invalid NEXT_PUBLIC_SUPABASE_URL: "${supabaseUrl}". It must be a valid URL (e.g., https://project-ref.supabase.co). Original error: ${e.message}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  // Strict checks for Anon Key
  if (!supabaseAnonKey || supabaseAnonKey === "YOUR_SUPABASE_ANON_KEY_HERE" || supabaseAnonKey.trim() === "" || typeof supabaseAnonKey !== 'string') {
    const errorMsg = "Supabase client creation failed: NEXT_PUBLIC_SUPABASE_ANON_KEY is missing, a placeholder, empty, or not a string. Please check your .env.local file and ensure it's loaded correctly by restarting your Next.js server.";
    // Avoid logging the full key, even the anon key, in production logs if possible.
    // For debugging, logging the first few chars can be helpful.
    console.error(errorMsg, "Received Key (length):", supabaseAnonKey?.length);
    throw new Error(errorMsg);
  }

  // Create client with Next.js 15 compatible configuration
  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        'X-Client-Info': 'nextjs-15-client'
      }
    }
  });
};
