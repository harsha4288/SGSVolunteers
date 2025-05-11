
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase';

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

  // Explicitly pass the validated variables to the client creation function.
  // This ensures that the library uses these specific values.
  return createClientComponentClient<Database>({
    supabaseUrl: supabaseUrl,
    supabaseKey: supabaseAnonKey,
  });
};
