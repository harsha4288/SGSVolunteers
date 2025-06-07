import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/lib/types/supabase';

export async function GET(request: NextRequest) {
  console.log("Auth callback route hit!"); // Unconditional log
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    console.log("Code parameter found:", code); // Log if code is found
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchanging code for session:", error);
      // Optionally, redirect to an error page or show a toast
      return NextResponse.redirect(requestUrl.origin + '/login?error=' + encodeURIComponent(error.message));
    }

    // Log the session data and cookies being set
    console.log("Supabase session data after exchange:", data.session);
    const response = NextResponse.redirect(requestUrl.origin + '/app/dashboard');
    console.log("Response headers (Set-Cookie):", response.headers.get('Set-Cookie'));
    return response;
  } else {
    console.log("No code parameter found in callback URL."); // Log if no code
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin + '/app/dashboard');
}
