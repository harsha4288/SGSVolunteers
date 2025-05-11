
import { createBrowserClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase';

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || supabaseUrl === "YOUR_SUPABASE_URL_HERE" || supabaseUrl === "" || supabaseUrl === "undefined") {
    console.error("Supabase client creation failed: Missing or placeholder NEXT_PUBLIC_SUPABASE_URL environment variable. Value:", supabaseUrl);
    throw new Error("Supabase client creation failed: Missing or placeholder NEXT_PUBLIC_SUPABASE_URL environment variable. Please ensure it is set correctly in your .env.local file or environment configuration.");
  }
  if (!supabaseAnonKey || supabaseAnonKey === "YOUR_SUPABASE_ANON_KEY_HERE" || supabaseAnonKey === "" || supabaseAnonKey === "undefined") {
    console.error("Supabase client creation failed: Missing or placeholder NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. Value:", supabaseAnonKey);
    throw new Error("Supabase client creation failed: Missing or placeholder NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. Please ensure it is set correctly in your .env.local file or environment configuration.");
  }

  try {
    // Validate that supabaseUrl is a valid URL string before passing it to the client
    // Ensure it starts with http:// or https://
    if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
        throw new Error(`Invalid URL format. URL must start with http:// or https://. Received: ${supabaseUrl}`);
    }
    new URL(supabaseUrl);
  } catch (e: any) {
    console.error(`Supabase client creation failed: Invalid NEXT_PUBLIC_SUPABASE_URL: "${supabaseUrl}". Error:`, e.message);
    throw new Error(`Supabase client creation failed: Invalid NEXT_PUBLIC_SUPABASE_URL: "${supabaseUrl}". It must be a valid URL string, including the protocol (e.g., https://).`);
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
};

