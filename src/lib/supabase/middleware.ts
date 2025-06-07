import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import type { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/lib/types/supabase';

export const createSupabaseMiddlewareClient = (req: NextRequest, res: NextResponse) => {
  // Use the standard createMiddlewareClient from auth-helpers-nextjs
  // This handles cookie setting and retrieval automatically
  return createMiddlewareClient<Database>({ req, res });
};
