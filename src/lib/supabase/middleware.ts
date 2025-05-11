import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import type { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/lib/types/supabase'; // Will create this file later

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const createSupabaseMiddlewareClient = (req: NextRequest, res: NextResponse) => {
  return createMiddlewareClient<Database>({ req, res }, {
    supabaseUrl,
    supabaseKey: supabaseAnonKey,
  });
};
