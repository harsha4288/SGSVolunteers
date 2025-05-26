'use server';

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/types/supabase';

export async function testServerConnection() {
  try {
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase URL or Anon Key is missing from environment variables.");
    }

    // Create a server-side Supabase client
    const supabase = createClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
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
      }
    );

    // Test connection with a simple query
    const { data, error } = await supabase.from("events").select("*").limit(5);

    if (error) {
      return {
        success: false,
        error: error.message,
        details: error
      };
    }

    return {
      success: true,
      data
    };
  } catch (err: any) {
    console.error("Server-side database connection test error:", err);
    return {
      success: false,
      error: err.message || "Unknown error",
      details: err
    };
  }
}

export async function testMultipleTablesServer() {
  try {
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase URL or Anon Key is missing from environment variables.");
    }

    // Create a server-side Supabase client
    const supabase = createClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
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
      }
    );

    // Test multiple tables to see if any work
    const tables = ["events", "profiles", "volunteers", "time_slots", "seva_categories"];
    const results: any[] = [];

    for (const table of tables) {
      try {
        console.log(`Testing table: ${table}`);
        const { data, error } = await supabase.from(table).select("*").limit(1);

        results.push({
          table,
          success: !error,
          data: data || [],
          error: error ? error.message : null
        });
      } catch (tableErr: any) {
        results.push({
          table,
          success: false,
          data: [],
          error: tableErr.message || "Unknown error"
        });
      }
    }

    // Check if any tables were successful
    const anySuccess = results.some(r => r.success);

    return {
      success: anySuccess,
      results
    };
  } catch (err: any) {
    console.error("Server-side database tables test error:", err);
    return {
      success: false,
      error: err.message || "Unknown error",
      details: err
    };
  }
}
