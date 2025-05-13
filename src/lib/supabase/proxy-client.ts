import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/supabase';

// This client uses a CORS proxy to bypass CORS restrictions during development
export const createProxyClient = () => {
  // Get the original Supabase credentials
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Validate credentials
  if (!supabaseUrl || !supabaseAnonKey) {
    const errorMsg = "Supabase client creation failed: Missing environment variables. Please check your .env.local file.";
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  // Use the local CORS proxy URL instead of the direct Supabase URL
  const proxyUrl = 'http://localhost:3005/supabase';
  
  console.log(`Creating Supabase client with CORS proxy: ${proxyUrl}`);
  console.log(`Original Supabase URL: ${supabaseUrl}`);

  // Create the Supabase client with the proxy URL
  const supabaseClient = createSupabaseClient<Database>(
    proxyUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: {
          // Pass the original URL as a custom header for debugging
          'X-Original-URL': supabaseUrl,
        },
      },
    }
  );

  return supabaseClient;
};
